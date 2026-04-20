#!/usr/bin/env node
/**
 * Website scraper for the ecosystem enrichment pass.
 * READ-ONLY: writes .buddy/website-scrape-results.json.
 *
 * Run: node --env-file=.env.local scripts/scrape-ecosystem-websites.mjs
 *
 * Targets (capped at 100 fetches total):
 *  - All LKDN-001..024 recyclers (24)
 *  - Other recyclers with website AND (phone IS NULL OR email LIKE placeholder)
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import pg from 'pg';

const ROOT = '/Users/sivakumar/Projects/rotehuegels-website';
const OUT_PATH = process.env.OUT_PATH_OVERRIDE || `${ROOT}/.buddy/website-scrape-results.json`;
const MAX_FETCHES = Number(process.env.SCRAPE_MAX_FETCHES || 100);
const SKIP_CODES = new Set((process.env.SKIP_CODES || '').split(',').map(s=>s.trim()).filter(Boolean));

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const FETCH_TIMEOUT_MS = 15_000;

const DOMAIN_BLOCKLIST = new Set([
  'nicoex.com', 'www.nicoex.com',
]);

const BAD_EMAIL_DOMAINS = new Set([
  'sentry.io','wordpress.com','wix.com','godaddy.com','example.com',
  'domain.com','yourdomain.com','test.com','sentry-next.wixpress.com',
  'w3.org','schema.org','gmail.com','googlemail.com','yahoo.com','hotmail.com',
  'outlook.com','rediffmail.com','ymail.com','live.com',
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
      },
    });
    if (!res.ok) return { error: `HTTP ${res.status}`, status: res.status };
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html') && !ct.includes('xml')) return { error: `ct=${ct}`, status: res.status };
    return { html: await res.text(), status: res.status };
  } catch (e) { return { error: e.message, status: 0 }; } finally { clearTimeout(t); }
}

function extractAllEmails(html) {
  const re = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}/g;
  const addrs = new Set();
  let m;
  while ((m = re.exec(html)) !== null) {
    const a = m[0].toLowerCase();
    if (/\.(png|jpg|jpeg|gif|svg|webp|js|css|woff|ico)$/i.test(a)) continue;
    if (a.startsWith('noreply@') || a.startsWith('no-reply@') || a.startsWith('donotreply@')) continue;
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
  const preferred = ['info@','sales@','contact@','enquiry@','enquiries@','hello@','care@','support@','admin@','mail@','office@'];
  function best(list) {
    for (const p of preferred) { const hit = list.find(a => a.startsWith(p)); if (hit) return hit; }
    return list[0];
  }
  // Strongly prefer same-domain — this is the corporate email signal.
  return same.length ? best(same) : null;
}

function normalisePhone(raw) {
  let d = String(raw).replace(/\D/g, '');
  if (d.startsWith('91') && d.length === 12) d = d.slice(2);
  if (d.startsWith('0') && d.length === 11) d = d.slice(1);
  if (d.length === 10 && /^[6-9]/.test(d)) return '+91' + d;
  return null;
}

function extractAllPhones(html) {
  const out = new Set();
  const tel = html.match(/href=["']tel:([+\d\s\-()]+)["']/gi) ?? [];
  for (const t of tel) {
    const num = t.replace(/.*tel:/i, '').replace(/["']$/, '').trim();
    const digits = num.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 13) {
      const n = normalisePhone(digits);
      if (n) out.add(n);
    }
  }
  for (const m of (html.match(/(?<![\d])[6-9]\d{9}(?![\d])/g) ?? [])) {
    const n = normalisePhone(m);
    if (n) out.add(n);
  }
  for (const mm of html.matchAll(/\+?91[\s\-().]{0,3}([6-9]\d{9})/g)) {
    if (mm[1]) { const n = normalisePhone(mm[1]); if (n) out.add(n); }
  }
  return [...out];
}

function toUrl(website) {
  let u = String(website).trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try { return new URL(u); } catch { return null; }
}

async function enrichRow(row, fetchCounter) {
  const siteUrl = toUrl(row.website);
  if (!siteUrl) return { error: 'bad url', http_status: 0 };
  if (DOMAIN_BLOCKLIST.has(siteUrl.host)) return { error: 'blocklisted domain', http_status: 0 };
  const host = siteUrl.host;
  const paths = ['/', '/contact', '/contact-us', '/contact.html', '/about', '/about-us'];
  const emails = new Set();
  const phones = new Set();
  let firstHitUrl = null;
  let lastStatus = 'no-match';
  let lastHttp = 0;
  for (const p of paths) {
    if (fetchCounter.n >= MAX_FETCHES) break;
    const url = new URL(p, siteUrl).toString();
    const r = await httpGet(url);
    fetchCounter.n++;
    if (r.status) lastHttp = r.status;
    if (r.error) { lastStatus = r.error; continue; }
    const pageEmails = extractAllEmails(r.html);
    const pagePhones = extractAllPhones(r.html);
    for (const e of pageEmails) emails.add(e);
    for (const ph of pagePhones) phones.add(ph);
    if ((pageEmails.length || pagePhones.length) && !firstHitUrl) firstHitUrl = url;
    await sleep(300);
  }
  const allEmails = [...emails];
  const allPhones = [...phones];
  return {
    primary_email: pickPrimary(allEmails, host),
    primary_phone: allPhones[0] ?? null,
    emails: allEmails,
    phones: allPhones,
    source: firstHitUrl ?? siteUrl.toString(),
    http_status: lastHttp,
    error: (emails.size === 0 && phones.size === 0) ? lastStatus : null,
  };
}

async function connectDB() {
  const host = process.env.SUPABASE_DB_HOST;
  const password = process.env.SUPABASE_DB_PASSWORD;
  const m = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
  const ref = m[1];
  const regions = ['ap-south-1','us-east-1','ap-southeast-1','eu-west-1','us-west-1','ap-northeast-1'];
  try {
    const c = new pg.Client({ host, port: 5432, database: 'postgres', user: 'postgres', password, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
    await c.connect(); return c;
  } catch {}
  for (const r of regions) {
    try {
      const c = new pg.Client({ host: `aws-0-${r}.pooler.supabase.com`, port: 5432, database: 'postgres', user: `postgres.${ref}`, password, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
      await c.connect(); return c;
    } catch {}
  }
  throw new Error('No route to DB');
}

async function main() {
  const t0 = Date.now();
  const client = await connectDB();
  let targets = [];
  try {
    // LKDN-* first
    const lkdn = (await client.query(`
      SELECT id, recycler_code, company_name, website, email, phone
      FROM recyclers
      WHERE recycler_code LIKE 'LKDN-%' AND website IS NOT NULL
      ORDER BY recycler_code
    `)).rows;

    // Plus other recyclers with website + gap
    const other = (await client.query(`
      SELECT id, recycler_code, company_name, website, email, phone
      FROM recyclers
      WHERE website IS NOT NULL
        AND recycler_code NOT LIKE 'LKDN-%'
        AND (phone IS NULL OR email LIKE 'cpcb.%@recycler.in' OR email LIKE 'lkdn.%@recycler.in' OR email LIKE 'mrai.%@recycler.in')
      ORDER BY recycler_code
    `)).rows;

    targets = [...lkdn, ...other].filter(r => !SKIP_CODES.has(r.recycler_code));
  } finally {
    await client.end();
  }
  console.log(`targets: LKDN+others = ${targets.length}, MAX_FETCHES=${MAX_FETCHES}`);

  const fetchCounter = { n: 0 };
  const results = [];
  // Estimate sites we can cover: each site does up to 6 path fetches
  // so cap sites at ~floor(MAX_FETCHES/3) to keep diversity.
  const MAX_SITES = Math.floor(MAX_FETCHES / 3);
  const sitesPlanned = targets.slice(0, MAX_SITES);
  console.log(`will scrape up to ${sitesPlanned.length} sites\n`);

  for (let i = 0; i < sitesPlanned.length && fetchCounter.n < MAX_FETCHES; i++) {
    const r = sitesPlanned[i];
    const prefix = `[${String(i+1).padStart(3)}/${sitesPlanned.length}] ${r.recycler_code}`;
    const res = await enrichRow(r, fetchCounter);
    const rec = {
      recycler_code: r.recycler_code,
      company_name: r.company_name,
      url: r.website,
      email_found: res.primary_email || null,
      phone_found: res.primary_phone || null,
      all_emails: res.emails || [],
      all_phones: res.phones || [],
      http_status: res.http_status || 0,
      error: res.error || null,
      source: res.source || null,
    };
    results.push(rec);
    const detail = rec.error
      ? `✗ ${rec.error}`
      : `✓ email=${rec.email_found || '∅'} phone=${rec.phone_found || '∅'} (${rec.all_emails.length}e/${rec.all_phones.length}p)`;
    console.log(`${prefix} ${detail}  [${r.website}]  fetches=${fetchCounter.n}`);
  }

  const payload = {
    generated_at: new Date().toISOString(),
    elapsed_ms: Date.now() - t0,
    planned: sitesPlanned.length,
    scraped: results.length,
    total_fetches: fetchCounter.n,
    cap: MAX_FETCHES,
    results,
  };
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2));
  console.log(`\n✓ ${OUT_PATH}`);
  console.log(`  ${Math.round((Date.now()-t0)/1000)}s  sites=${results.length}  fetches=${fetchCounter.n}`);
}

main().catch(e => { console.error(e); process.exit(1); });
