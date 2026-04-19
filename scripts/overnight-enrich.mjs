#!/usr/bin/env node
/**
 * Overnight enrichment runner.
 *
 * Loop: pick the next highest-capacity recycler that still has no website,
 * Brave-search to find its site, save it, scrape /, /contact, /about etc.
 * for emails + phones, fill missing primary fields, append to notes if
 * primary already set (a proper jsonb migration is ready but not applied).
 *
 * Resilient to Brave rate-limits (exponential backoff + long base delay)
 * and to process interrupts (each row is a full DB round-trip).
 *
 * Writes .buddy/overnight-log.md — append-only progress log.
 *
 * Run: node --env-file=.env.local scripts/overnight-enrich.mjs --limit 150
 */
import { createClient } from '@supabase/supabase-js';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('Missing env'); process.exit(1); }
const sb = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const LIMIT        = parseInt(flag('--limit', '150'), 10);
const BASE_DELAY   = parseInt(flag('--delay', '22000'), 10); // 22s between queries
const MAX_BACKOFF  = 300_000; // 5 min cap

mkdirSync(resolve('.buddy'), { recursive: true });
const LOG = resolve('.buddy/overnight-log.md');
function log(s) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${s}\n`;
  process.stdout.write(line);
  appendFileSync(LOG, line);
}
log(`=== overnight-enrich started (limit=${LIMIT}, delay=${BASE_DELAY}ms) ===`);

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const TIMEOUT = 20_000;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const EMAIL_RE = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g;
const PHONE_IN_RE = /\+?\d{1,3}[\s\-]?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,5}/g;

const NOT_OFFICIAL = new Set([
  'www.justdial.com','justdial.com','www.indiamart.com','indiamart.com','dir.indiamart.com',
  'www.tradeindia.com','tradeindia.com','www.exportersindia.com','exportersindia.com',
  'www.aajjo.com','aajjo.com','www.zaubacorp.com','zaubacorp.com','www.tofler.in','tofler.in',
  'www.piceapp.com','piceapp.com','www.knowyourgst.com','knowyourgst.com',
  'www.mastersindia.co','mastersindia.co','www.mastergst.com','mastergst.com',
  'www.linkedin.com','linkedin.com','in.linkedin.com','lnkd.in','www.facebook.com','facebook.com',
  'm.facebook.com','www.instagram.com','instagram.com','twitter.com','x.com','www.youtube.com',
  'youtube.com','en.wikipedia.org','wikipedia.org','www.screener.in','screener.in','groww.in',
  'www.moneycontrol.com','moneycontrol.com','www.nseindia.com','nseindia.com','www.bseindia.com',
  'bseindia.com','finance.yahoo.com','www.cnbc.com','cnbc.com','www.dnb.com','dnb.com','about.me',
  'github.com','www.cpcb.nic.in','cpcb.nic.in','ciiwasteexchange.org','mpcb.gov.in','www.mpcb.gov.in',
  'tnpcb.gov.in','www.tnpcb.gov.in','www.rotehuegels.com','rotehuegels.com',
]);
const DOMAIN_BLOCKLIST = new Set(['nicoex.com','www.nicoex.com']);
const NOISE = new Set(['the','and','of','pvt','private','ltd','limited','llp','inc','corp','company','co','p','group','india','metals','metal','industries','industry','enterprises','enterprise','recyclers','recycler','recycling','scrap']);

function nameTokens(name) {
  return String(name).toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[^a-z0-9]+/g,' ')
    .split(' ').filter(w => w.length >= 3 && !NOISE.has(w));
}
function hostTokens(h) {
  return h.replace(/^www\./,'').replace(/\.(com|in|co\.in|org|net|io|biz|info|co|gov\.in|nic\.in)$/,'')
    .split('.')[0].replace(/[^a-z0-9]+/g,' ').split(' ').filter(Boolean);
}
function scoreHost(row, host) {
  if (NOT_OFFICIAL.has(host) || DOMAIN_BLOCKLIST.has(host)) return -1;
  const nt = nameTokens(row.company_name);
  const ht = hostTokens(host).join('').toLowerCase();
  let s = 0;
  for (const t of nt) if (ht.includes(t)) s += 3;
  if (host.split('.').length > 3) s -= 1;
  if (host.endsWith('.in') || host.endsWith('.co.in') || host.endsWith('.com')) s += 1;
  return s;
}
function hostOf(url) { try { return new URL(url).host.toLowerCase(); } catch { return null; } }

let braveBackoff = 0;
async function httpGet(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { signal: ctl.signal, redirect: 'follow',
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-IN,en;q=0.9', 'Accept': 'text/html' } });
    if (res.status === 429) return { error: 'HTTP 429', ratelimited: true };
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('text/html') && !ct.includes('xml')) return { error: `ct=${ct}` };
    return { html: await res.text() };
  } catch (e) { return { error: e.message }; }
  finally { clearTimeout(t); }
}

async function braveFindWebsite(row) {
  const q = `"${row.company_name}" ${row.state ?? ''} official website`.trim();
  const url = `https://search.brave.com/search?q=${encodeURIComponent(q)}`;
  const r = await httpGet(url);
  if (r.ratelimited) {
    braveBackoff = Math.min(MAX_BACKOFF, (braveBackoff || 30_000) * 2);
    log(`   ✗ brave 429 — backing off ${Math.round(braveBackoff/1000)}s`);
    await sleep(braveBackoff);
    return { error: 'ratelimited' };
  }
  if (r.error) return { error: r.error };
  braveBackoff = 0;
  const candidates = new Map();
  for (const m of r.html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    const h = hostOf(m[1]); if (!h) continue;
    if (h.endsWith('.brave.com') || h === 'search.brave.com') continue;
    const s = scoreHost(row, h);
    if (s < 0) continue;
    const prev = candidates.get(h);
    if (!prev || s > prev.score) candidates.set(h, { url: m[1], score: s });
  }
  const ranked = [...candidates.entries()].sort((a,b) => b[1].score - a[1].score);
  if (!ranked.length || ranked[0][1].score < 3) return { error: 'low-confidence' };
  return { url: `https://${ranked[0][0]}`, score: ranked[0][1].score };
}

async function scrapeSite(websiteUrl) {
  const paths = ['/', '/contact', '/contact-us', '/about', '/about-us'];
  const emails = new Set(), phones = new Set();
  for (const p of paths) {
    try { new URL(p, websiteUrl); } catch { continue; }
    const url = new URL(p, websiteUrl).toString();
    const r = await httpGet(url);
    if (r.error) continue;
    for (const m of r.html.matchAll(EMAIL_RE)) {
      const e = m[0].toLowerCase();
      if (/\.(png|jpg|jpeg|svg|gif|webp)@/.test(e)) continue;
      if (/sentry|wixpress|example\.com|yourdomain/.test(e)) continue;
      emails.add(e);
    }
    for (const m of r.html.matchAll(PHONE_IN_RE)) {
      const digits = m[0].replace(/\D/g,'');
      if (digits.length >= 10 && digits.length <= 14) phones.add(m[0].replace(/\s+/g,' ').trim());
    }
    await sleep(400);
    if (emails.size || phones.size) break;
  }
  return { emails: [...emails], phones: [...phones] };
}

async function fetchTargets() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from('recyclers')
      .select('id, recycler_code, company_name, state, city, email, phone, website, contact_person, notes, capacity_per_month, is_active')
      .eq('is_active', true).is('website', null).range(from, from + 999);
    if (!data || !data.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  const parseCap = (s) => { if (!s) return 0; const m = String(s).match(/([\d,]+(?:\.\d+)?)/); return m ? parseFloat(m[1].replace(/,/g, '')) : 0; };
  rows.sort((a, b) => parseCap(b.capacity_per_month) - parseCap(a.capacity_per_month));
  return rows;
}

const isPlaceholderEmail = (e) => !e || /placeholder|^cpcb\.|^mrai\./i.test(e);
const isRealValue = (v) => v && v.trim() && !/placeholder/i.test(v);

async function main() {
  const rows = (await fetchTargets()).slice(0, LIMIT);
  log(`Targets: ${rows.length}`);
  let websitesFound = 0, emailsAdded = 0, phonesAdded = 0, errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const prefix = `[${i+1}/${rows.length}] ${r.recycler_code.padEnd(14)} ${r.company_name.slice(0, 45)}`;
    const res = await braveFindWebsite(r);
    if (res.error) { errors++; log(`${prefix} — website: ✗ ${res.error}`); await sleep(BASE_DELAY); continue; }
    log(`${prefix} — website: ✓ ${res.url} (score=${res.score})`);

    // Save website
    const wupd = { website: res.url };

    // Scrape for emails/phones
    const scraped = await scrapeSite(res.url);
    let updEmail = null, updPhone = null, extras = [];
    if (scraped.emails.length) {
      // Prefer a corporate-looking email (not gmail/yahoo)
      const corp = scraped.emails.find(e => !/@(gmail|yahoo|hotmail|outlook|rediffmail|live)\./i.test(e));
      const primary = corp ?? scraped.emails[0];
      if (isPlaceholderEmail(r.email)) { wupd.email = primary; updEmail = primary; emailsAdded++; }
      for (const e of scraped.emails) if (e !== primary) extras.push(`email: ${e}`);
    }
    if (scraped.phones.length) {
      if (!isRealValue(r.phone)) { wupd.phone = scraped.phones[0]; updPhone = scraped.phones[0]; phonesAdded++; }
      for (const p of scraped.phones.slice(1)) extras.push(`phone: ${p}`);
    }
    if (extras.length) {
      const tag = `\n[website-scrape ${new Date().toISOString().slice(0,10)}] ${extras.join(' | ')}`;
      wupd.notes = (r.notes ?? '') + tag;
    }
    websitesFound++;
    const { error } = await sb.from('recyclers').update(wupd).eq('id', r.id);
    if (error) log(`   ✗ db: ${error.message}`);
    else log(`   → saved: ${updEmail ? `email=${updEmail}` : ''} ${updPhone ? `phone=${updPhone}` : ''} extras=${extras.length}`);

    await sleep(BASE_DELAY);
  }

  log(`=== DONE: websites=${websitesFound} emails+${emailsAdded} phones+${phonesAdded} errors=${errors} ===`);
}

main().catch(e => { log(`FATAL ${e.message}`); process.exit(1); });
