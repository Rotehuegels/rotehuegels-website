#!/usr/bin/env node
/**
 * Enrich recyclers.email / recyclers.phone for rows that have a `website`
 * set but a placeholder email or missing phone. Walks the homepage and
 * a handful of common contact paths, extracts the first plausible
 * corporate email + Indian phone number.
 *
 * Run: node --env-file=.env.local scripts/enrich-contacts-from-website.mjs
 *
 * Notes:
 *  - Uses a real Chrome User-Agent — the bot-identifying UA caused some
 *    sites (Hindalco, HZL, Vedanta, GEM) to return empty cached responses
 *    or a WAF challenge page instead of real content.
 *  - Idempotent. Safe to re-run.
 */
import { createClient } from '@supabase/supabase-js';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('Missing Supabase env'); process.exit(1); }
const sb = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const FETCH_TIMEOUT_MS = 20_000;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function httpGet(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Sec-Ch-Ua': '"Chromium";v="125", "Not.A/Brand";v="24"',
        'Sec-Ch-Ua-Platform': '"macOS"',
      },
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html') && !ct.includes('xml')) return { error: `ct=${ct}` };
    return { html: await res.text() };
  } catch (e) { return { error: e.message }; } finally { clearTimeout(t); }
}

const BAD_EMAIL_DOMAINS = new Set([
  'sentry.io', 'wordpress.com', 'wix.com', 'godaddy.com',
  'example.com', 'domain.com', 'yourdomain.com', 'test.com',
]);

function extractEmail(html, siteHost) {
  const re = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}/g;
  const addrs = new Set();
  let m;
  while ((m = re.exec(html)) !== null) {
    const a = m[0].toLowerCase();
    if (/\.(png|jpg|jpeg|gif|svg|webp|js|css|woff|ico)$/i.test(a)) continue;
    if (a.startsWith('noreply@') || a.startsWith('no-reply@')) continue;
    const domain = a.split('@')[1];
    if (BAD_EMAIL_DOMAINS.has(domain)) continue;
    addrs.add(a);
  }
  const arr = [...addrs];
  if (!arr.length) return null;

  // 1st pass: prefer same-domain corporate addresses
  const hostKey = siteHost.replace(/^www\./, '');
  const same = arr.filter(a => {
    const d = a.split('@')[1];
    return d === hostKey || d.endsWith('.' + hostKey);
  });
  // 2nd pass: preferred prefixes
  const preferred = ['info@', 'sales@', 'contact@', 'enquiry@', 'enquiries@', 'hello@', 'care@', 'support@', 'admin@'];
  function best(list) {
    for (const p of preferred) {
      const hit = list.find(a => a.startsWith(p));
      if (hit) return hit;
    }
    return list[0];
  }
  if (same.length) return best(same);
  return best(arr);
}

function extractPhone(html) {
  // Priority 1: tel: links — most reliable
  const tel = html.match(/href=["']tel:([+\d\s\-()]+)["']/gi);
  if (tel && tel.length) {
    for (const t of tel) {
      const num = t.replace(/.*tel:/i, '').replace(/["']$/, '').trim();
      const digits = num.replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 13) return normalise(digits);
    }
  }
  // Priority 2: 10-digit Indian mobile numbers in body (word-boundary protected)
  const reMobile = /(?<![\d])[6-9]\d{9}(?![\d])/g;
  const matches = [...new Set(html.match(reMobile) || [])];
  if (matches.length) return normalise(matches[0]);
  // Priority 3: +91 prefixed
  const reIntl = /\+?91[\s\-().]{0,3}([6-9]\d{9})/g;
  for (const mm of html.matchAll(reIntl)) {
    if (mm[1]) return normalise(mm[1]);
  }
  return null;
}

function normalise(raw) {
  let d = String(raw).replace(/\D/g, '');
  if (d.startsWith('91') && d.length === 12) d = d.slice(2);
  if (d.startsWith('0') && d.length === 11) d = d.slice(1);
  if (d.length === 10 && /^[6-9]/.test(d)) return '+91' + d;
  return raw.trim();
}

function toUrl(website) {
  let u = String(website).trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try { return new URL(u); } catch { return null; }
}

async function enrichRow(row) {
  const siteUrl = toUrl(row.website);
  if (!siteUrl) return { error: 'bad url' };
  const host = siteUrl.host;
  const paths = ['/', '/contact', '/contact-us', '/contact.html', '/about', '/about-us', '/reach-us', '/get-in-touch'];
  let lastStatus = 'no-match';
  for (const p of paths) {
    const url = new URL(p, siteUrl).toString();
    const r = await httpGet(url);
    if (r.error) { lastStatus = r.error; continue; }
    const email = extractEmail(r.html, host);
    const phone = extractPhone(r.html);
    if (email || phone) return { email, phone, source: url };
    await sleep(350);
  }
  return { error: lastStatus };
}

async function fetchTargets() {
  const { data, error } = await sb
    .from('recyclers')
    .select('id, recycler_code, company_name, website, email, phone')
    .eq('is_active', true)
    .not('website', 'is', null)
    .or('email.like.%placeholder%,email.like.cpcb.%,email.like.mrai.%,phone.is.null');
  if (error) throw error;
  return data ?? [];
}

async function main() {
  console.log('Loading rows with website + placeholder contact…');
  const rows = await fetchTargets();
  console.log(`${rows.length} candidates\n`);

  let ok = 0, skip = 0, fail = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const prefix = `[${String(i + 1).padStart(3)}/${rows.length}] ${r.recycler_code}`;
    const res = await enrichRow(r);
    if (res.error) { fail++; console.log(`${prefix} ✗ ${res.error}  (${r.website})`); continue; }
    const update = {};
    const isPlaceholder = (r.email ?? '').match(/(placeholder|^cpcb\.|^mrai\.)/i);
    if (res.email && isPlaceholder) update.email = res.email;
    if (res.phone && !r.phone) update.phone = res.phone;
    if (!Object.keys(update).length) {
      skip++; console.log(`${prefix} — existing kept (got ${res.email ?? '-'} / ${res.phone ?? '-'})`); continue;
    }
    const { error } = await sb.from('recyclers').update(update).eq('id', r.id);
    if (error) { fail++; console.warn(`${prefix} ✗ db ${error.message}`); continue; }
    ok++;
    const parts = [];
    if (update.email) parts.push(`email=${update.email}`);
    if (update.phone) parts.push(`phone=${update.phone}`);
    console.log(`${prefix} ✓ ${parts.join(' ')}  [${res.source}]`);
  }
  console.log(`\nDone. updated=${ok} skipped=${skip} failed=${fail}`);
}

main().catch(e => { console.error(e); process.exit(1); });
