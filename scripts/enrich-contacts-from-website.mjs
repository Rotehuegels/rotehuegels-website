#!/usr/bin/env node
/**
 * Enrich `recyclers.email` and `recyclers.phone` for rows that have a
 * `website` set by scraping the homepage + /contact, /contact-us, /about.
 *
 * Conservative extraction:
 *   - Email: must match standard RFC + domain sanity, prefers addresses
 *     that share the site's own domain (avoids emails of third-party
 *     CMS / agency contacts on generic pages).
 *   - Phone: Indian number patterns only (10-digit mobile starting 6-9,
 *     or 11-digit with leading 0, or +91 prefixed).
 *
 * Only updates placeholder-email rows (email LIKE '%placeholder%' etc.).
 * Idempotent — re-running only processes rows still on placeholders.
 *
 * Run: node --env-file=.env.local scripts/enrich-contacts-from-website.mjs
 */
import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error('Missing Supabase env'); process.exit(1); }
const sb = createClient(URL, KEY, { auth: { persistSession: false } });

const UA = 'Rotehuegels-Recycler-Directory/1.0 (sivakumarshanmugam@outlook.com)';
const FETCH_TIMEOUT_MS = 25_000;
const VERBOSE = process.env.VERBOSE === '1';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function httpGet(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': UA, 'Accept-Language': 'en,en-IN;q=0.9' },
    });
    if (!res.ok) { if (VERBOSE) console.log(`    ${url} — HTTP ${res.status}`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html') && !ct.includes('xml')) {
      if (VERBOSE) console.log(`    ${url} — skip ct=${ct}`);
      return null;
    }
    const html = await res.text();
    if (VERBOSE) console.log(`    ${url} — ${html.length} bytes`);
    return html;
  } catch (e) { if (VERBOSE) console.log(`    ${url} — ERR ${e.message}`); return null; } finally { clearTimeout(t); }
}

// Blocklist of third-party / generic / tracker emails
const EMAIL_BLOCK = new Set([
  'info@example.com', 'noreply@', 'no-reply@', 'wordpress@', 'admin@wix.com',
  'sentry@', 'example@example.com', 'test@test.com',
]);
const EMAIL_BLOCK_DOMAINS = new Set([
  'sentry.io', 'wordpress.com', 'wix.com', 'godaddy.com', 'gmail.com', // gmail = personal; catch when we can find a corporate one
  'example.com', 'domain.com', 'yourdomain.com',
]);

function extractEmails(html, siteHost) {
  const set = new Set();
  const re = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const addr = m[0].toLowerCase();
    if ([...EMAIL_BLOCK].some(b => addr.startsWith(b) || addr === b)) continue;
    const domain = addr.split('@')[1];
    if (EMAIL_BLOCK_DOMAINS.has(domain)) continue;
    // Skip image/font/js filenames mistakenly matched
    if (/\.(png|jpg|jpeg|gif|svg|webp|js|css|woff)$/i.test(addr)) continue;
    set.add(addr);
  }
  const arr = [...set];
  // Prefer same-domain emails
  if (siteHost) {
    const hostKey = siteHost.replace(/^www\./, '');
    const same = arr.filter(a => a.endsWith('@' + hostKey) || a.endsWith('.' + hostKey));
    if (same.length) return same[0];
  }
  // Prefer "info@", "sales@", "contact@" over random personal
  const preferredPrefixes = ['info@', 'sales@', 'contact@', 'enquiry@', 'hello@', 'admin@'];
  for (const p of preferredPrefixes) {
    const hit = arr.find(a => a.startsWith(p));
    if (hit) return hit;
  }
  return arr[0] ?? null;
}

function extractPhone(html) {
  // Indian mobile patterns
  //   +91 XXXXXXXXXX / +91-XXXXXXXXXX
  //   0 XXXXXXXXXX / 0-XXXXXXXXXX
  //   10-digit starting with 6-9
  const candidates = new Set();

  // +91 variants (allow spaces, dashes, brackets between groups)
  const reIntl = /\+?91[\s\-().]{0,3}[6-9]\d{2}[\s\-().]{0,3}\d{3}[\s\-().]{0,3}\d{4}/g;
  for (const m of html.matchAll(reIntl)) candidates.add(m[0]);

  // Landline with STD code: (0XX) XXXXXXXX — at least 10 digits total after leading 0
  const reStd = /\b0\d{2,4}[\s\-()]*\d{6,8}\b/g;
  for (const m of html.matchAll(reStd)) candidates.add(m[0]);

  // Plain 10-digit mobile (word-boundary protected)
  const reMobile = /(?<![\d])[6-9]\d{9}(?![\d])/g;
  for (const m of html.matchAll(reMobile)) candidates.add(m[0]);

  // Pick the first non-junk candidate. Normalise to digits-only with +91 prefix for mobiles.
  for (const raw of candidates) {
    const digits = raw.replace(/\D/g, '');
    // Strip leading 91 / 0
    let core = digits;
    if (core.startsWith('91') && core.length === 12) core = core.slice(2);
    if (core.startsWith('0') && core.length === 11) core = core.slice(1);
    if (core.length === 10 && /^[6-9]/.test(core)) return '+91' + core;
    if (core.length >= 10 && core.length <= 11) return raw.trim(); // landline as-is
  }
  return null;
}

function toUrl(website) {
  let u = website.trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try { return new URL(u); } catch { return null; }
}

async function enrichRow(row) {
  const siteUrl = toUrl(row.website);
  if (!siteUrl) return null;
  const host = siteUrl.host;
  const paths = ['/', '/contact', '/contact-us', '/contact.html', '/about', '/about-us', '/reach-us'];
  for (const p of paths) {
    const url = new URL(p, siteUrl).toString();
    const html = await httpGet(url);
    if (!html) continue;
    const email = extractEmails(html, host);
    const phone = extractPhone(html);
    if (email || phone) {
      return { email, phone, source: url };
    }
    // tiny gap between requests to same host
    await sleep(400);
  }
  return null;
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
  console.log('Loading recyclers that have a website + placeholder contact…');
  const rows = await fetchTargets();
  console.log(`${rows.length} candidates\n`);

  let ok = 0, skip = 0, fail = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const prefix = `[${String(i + 1).padStart(3)}/${rows.length}] ${r.recycler_code}`;
    const hit = await enrichRow(r);
    if (!hit || (!hit.email && !hit.phone)) { fail++; console.log(`${prefix} ✗ nothing found on ${r.website}`); continue; }
    const update = {};
    const isPlaceholder = (r.email ?? '').match(/(placeholder|^cpcb\.|^mrai\.)/i);
    if (hit.email && isPlaceholder) update.email = hit.email;
    if (hit.phone && !r.phone) update.phone = hit.phone;
    if (Object.keys(update).length === 0) { skip++; console.log(`${prefix} — kept existing (${r.company_name.slice(0,30)})`); continue; }
    const { error } = await sb.from('recyclers').update(update).eq('id', r.id);
    if (error) { fail++; console.warn(`${prefix} ✗ update error ${error.message}`); continue; }
    ok++;
    const parts = [];
    if (update.email) parts.push(`email=${update.email}`);
    if (update.phone) parts.push(`phone=${update.phone}`);
    console.log(`${prefix} ✓ ${parts.join(' ')}  [${hit.source}]`);
  }
  console.log(`\nDone. updated=${ok}, skipped=${skip}, failed=${fail}`);
}

main().catch(e => { console.error(e); process.exit(1); });
