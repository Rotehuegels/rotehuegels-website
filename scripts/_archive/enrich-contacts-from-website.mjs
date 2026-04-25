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

// Domains known to be unsafe — flagged by Norton / hosting providers. Never fetch.
const DOMAIN_BLOCKLIST = new Set([
  'nicoex.com',
  'www.nicoex.com',
]);
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

function extractAllEmails(html) {
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
  return [...addrs];
}

function pickPrimary(addrs, siteHost) {
  if (!addrs.length) return null;
  const hostKey = siteHost.replace(/^www\./, '');
  const same = addrs.filter(a => {
    const d = a.split('@')[1];
    return d === hostKey || d.endsWith('.' + hostKey);
  });
  const preferred = ['info@', 'sales@', 'contact@', 'enquiry@', 'enquiries@', 'hello@', 'care@', 'support@', 'admin@'];
  function best(list) {
    for (const p of preferred) { const hit = list.find(a => a.startsWith(p)); if (hit) return hit; }
    return list[0];
  }
  return same.length ? best(same) : best(addrs);
}

function extractAllPhones(html) {
  const out = new Set();
  const tel = html.match(/href=["']tel:([+\d\s\-()]+)["']/gi) ?? [];
  for (const t of tel) {
    const num = t.replace(/.*tel:/i, '').replace(/["']$/, '').trim();
    const digits = num.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 13) out.add(normalise(digits));
  }
  for (const m of (html.match(/(?<![\d])[6-9]\d{9}(?![\d])/g) ?? [])) out.add(normalise(m));
  for (const mm of html.matchAll(/\+?91[\s\-().]{0,3}([6-9]\d{9})/g)) if (mm[1]) out.add(normalise(mm[1]));
  return [...out];
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
  if (DOMAIN_BLOCKLIST.has(siteUrl.host)) return { error: 'blocklisted domain' };
  const host = siteUrl.host;
  const paths = ['/', '/contact', '/contact-us', '/contact.html', '/about', '/about-us', '/reach-us', '/get-in-touch'];
  const emails = new Set();
  const phones = new Set();
  let firstHitUrl = null;
  let lastStatus = 'no-match';
  for (const p of paths) {
    const url = new URL(p, siteUrl).toString();
    const r = await httpGet(url);
    if (r.error) { lastStatus = r.error; continue; }
    const pageEmails = extractAllEmails(r.html);
    const pagePhones = extractAllPhones(r.html);
    for (const e of pageEmails) emails.add(e);
    for (const ph of pagePhones) phones.add(ph);
    if ((pageEmails.length || pagePhones.length) && !firstHitUrl) firstHitUrl = url;
    await sleep(350);
  }
  if (!emails.size && !phones.size) return { error: lastStatus };
  const allEmails = [...emails];
  const allPhones = [...phones];
  return {
    primaryEmail: pickPrimary(allEmails, host),
    primaryPhone: allPhones[0] ?? null,
    emails: allEmails,
    phones: allPhones,
    source: firstHitUrl ?? siteUrl.toString(),
  };
}

async function fetchTargets() {
  // All active rows with a website. We'll enrich every one; dedup lives in
  // the merge step so re-runs are safe.
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('recyclers')
      .select('id, recycler_code, company_name, website, email, phone, contacts_all')
      .eq('is_active', true)
      .not('website', 'is', null)
      .range(from, from + 999);
    if (error) throw error;
    if (!data || !data.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

const SOURCE = 'website-scrape';
const TODAY = new Date().toISOString().slice(0, 10);
const normEmailKey = (e) => e?.toLowerCase().trim();
const normPhoneKey = (p) => p?.replace(/\D/g, '').replace(/^91/, '');

function mergeContacts(existing, rows) {
  const out = [...(existing ?? [])];
  const keys = new Set(out.map(c => [normEmailKey(c.email), normPhoneKey(c.phone), `${c.name}|${c.source}`].filter(Boolean).join('::')));
  let added = 0;
  for (const c of rows) {
    const k = [normEmailKey(c.email), normPhoneKey(c.phone), c.name && `${c.name}|${c.source}`].filter(Boolean).join('::');
    if (!k || keys.has(k)) continue;
    keys.add(k); out.push(c); added++;
  }
  return { merged: out, added };
}

async function main() {
  const rows = await fetchTargets();
  console.log(`${rows.length} rows with website to scrape\n`);

  let ok = 0, skip = 0, fail = 0, totalContactsAdded = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const prefix = `[${String(i + 1).padStart(3)}/${rows.length}] ${r.recycler_code}`;
    const res = await enrichRow(r);
    if (res.error) { fail++; console.log(`${prefix} ✗ ${res.error}  (${r.website})`); continue; }

    const update = {};
    const isPlaceholder = !r.email || (r.email ?? '').match(/(placeholder|^cpcb\.|^mrai\.)/i);
    if (res.primaryEmail && isPlaceholder) update.email = res.primaryEmail;
    if (res.primaryPhone && !r.phone) update.phone = res.primaryPhone;

    // Build contact rows for contacts_all — generic mailboxes (name=null).
    const newRows = [];
    for (const e of res.emails) newRows.push({ name: null, title: null, department: null, email: e, phone: null, source: SOURCE, first_seen: TODAY });
    for (const p of res.phones) newRows.push({ name: null, title: null, department: null, email: null, phone: p, source: SOURCE, first_seen: TODAY });
    const { merged, added } = mergeContacts(r.contacts_all, newRows);
    if (added > 0) { update.contacts_all = merged; totalContactsAdded += added; }

    if (!Object.keys(update).length) {
      skip++; console.log(`${prefix} — no new data (got ${res.emails.length}e/${res.phones.length}p, all dups)`); continue;
    }
    const { error } = await sb.from('recyclers').update(update).eq('id', r.id);
    if (error) { fail++; console.warn(`${prefix} ✗ db ${error.message}`); continue; }
    ok++;
    const parts = [];
    if (update.email) parts.push(`primary_email=${update.email}`);
    if (update.phone) parts.push(`primary_phone=${update.phone}`);
    if (added) parts.push(`+${added} contacts_all`);
    console.log(`${prefix} ✓ ${parts.join(' ')}  [${res.source}]`);
  }
  console.log(`\nDone. rows_updated=${ok} skipped=${skip} failed=${fail} contacts_added=${totalContactsAdded}`);
}

main().catch(e => { console.error(e); process.exit(1); });
