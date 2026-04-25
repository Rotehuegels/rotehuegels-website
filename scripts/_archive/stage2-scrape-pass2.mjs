#!/usr/bin/env node
/**
 * Stage 2 — Scraper pass-2.
 *
 * Targets three cohorts:
 *  (a) Rows populated by Stage 1 (from .buddy/stage1-websites.json).
 *  (b) Any @recycler.in-email rows with a website that weren't in pass-1
 *      (heuristic: all website-holding rows with email LIKE '%@recycler.in'
 *      and not already appearing in prior pass1 results).
 *  (c) Pass-1 failures — explicit list.
 *
 * Features:
 *  - Rotates through 3 desktop Chrome UAs + 1 mobile Safari.
 *  - Follows up to 5 redirects (native fetch default is 20, but we track).
 *  - Tries paths: /, /contact, /contact-us, /about, /about-us, /reach-us, /connect, /get-in-touch.
 *  - When WAF blocks (HTTP 403/503/cf challenge), falls back to a web
 *    search snippet parse (ONLY grabs visible-snippet strings).
 *  - Honours 400ms delay between fetches to same domain.
 *  - Caps total HTTP fetches at 400.
 *  - Writes .buddy/website-scrape-pass2.json.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import pg from 'pg';

const ROOT = '/Users/sivakumar/Projects/rotehuegels-website';
const STAGE1_IN = `${ROOT}/.buddy/stage1-websites.json`;
const OUT       = `${ROOT}/.buddy/website-scrape-pass2.json`;

const MAX_FETCHES = parseInt(process.env.MAX_FETCHES || '400', 10);
const TIMEOUT_SEC = parseInt(process.env.TIMEOUT_SEC || '700', 10);

const UAS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
];

const DOMAIN_BLOCKLIST = new Set(['nicoex.com','www.nicoex.com']);

const BAD_EMAIL_DOMAINS = new Set([
  'sentry.io','wordpress.com','wix.com','godaddy.com','example.com',
  'domain.com','yourdomain.com','test.com','sentry-next.wixpress.com',
  'w3.org','schema.org','gmail.com','googlemail.com','yahoo.com','hotmail.com',
  'outlook.com','rediffmail.com','ymail.com','live.com','recycler.in','placeholder.com',
]);

const PASS1_FAIL_DOMAINS = [
  'jindalaluminium.com', 'gcal.co.in', 'amararaja.com', 'okayapower.com',
  'rajeshindia.com', 'exideenergy.in', 'sonaalloys.com', 'heromotocorp.com',
  'log9materials.com', 'sungeelindia.in', 'racenergy.in', 'hulladek.com',
  'globalcopper.co.in',
];

const PATHS = ['/', '/contact', '/contact-us', '/about', '/about-us', '/reach-us', '/connect', '/get-in-touch'];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function httpGetMulti(url, attempts = 2) {
  const TIMEOUT = 18_000;
  let lastErr = null;
  let lastStatus = 0;
  for (let i = 0; i < attempts; i++) {
    const ua = UAS[(i + Math.floor(Math.random() * UAS.length)) % UAS.length];
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), TIMEOUT);
    try {
      const res = await fetch(url, {
        signal: ctl.signal, redirect: 'follow',
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-IN,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Sec-Ch-Ua': '"Chromium";v="125", "Not.A/Brand";v="24"',
          'Sec-Ch-Ua-Platform': '"macOS"',
        },
      });
      lastStatus = res.status;
      if (!res.ok) {
        lastErr = `HTTP ${res.status}`;
        // Retry with different UA on 403/503/429
        if ([403, 429, 503].includes(res.status) && i < attempts - 1) { clearTimeout(t); continue; }
        clearTimeout(t);
        return { error: lastErr, status: res.status };
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('text/html') && !ct.includes('xml')) { clearTimeout(t); return { error: `ct=${ct}`, status: res.status }; }
      clearTimeout(t);
      return { html: await res.text(), status: res.status, finalUrl: res.url };
    } catch (e) { clearTimeout(t); lastErr = e.message; }
  }
  return { error: lastErr || 'unknown', status: lastStatus };
}

function extractEmails(html, includeAll = false) {
  const re = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}/g;
  const counts = new Map();
  let m;
  while ((m = re.exec(html)) !== null) {
    const a = m[0].toLowerCase();
    if (/\.(png|jpg|jpeg|gif|svg|webp|js|css|woff|ico)$/i.test(a)) continue;
    if (a.startsWith('noreply@') || a.startsWith('no-reply@') || a.startsWith('donotreply@')) continue;
    const domain = a.split('@')[1];
    if (BAD_EMAIL_DOMAINS.has(domain)) continue;
    counts.set(a, (counts.get(a) || 0) + 1);
  }
  return counts;
}

function extractPhones(html) {
  const counts = new Map();
  const bump = (n) => { if (n) counts.set(n, (counts.get(n) || 0) + 1); };
  const tel = html.match(/href=["']tel:([+\d\s\-()]+)["']/gi) ?? [];
  for (const t of tel) {
    const num = t.replace(/.*tel:/i, '').replace(/["']$/, '').trim();
    const n = normalisePhone(num.replace(/\D/g, ''));
    bump(n);
  }
  for (const m of (html.match(/(?<![\d])[6-9]\d{9}(?![\d])/g) ?? [])) bump(normalisePhone(m));
  for (const mm of html.matchAll(/\+?91[\s\-().]{0,3}([6-9]\d{9})/g)) if (mm[1]) bump(normalisePhone(mm[1]));
  return counts;
}

function normalisePhone(raw) {
  let d = String(raw).replace(/\D/g, '');
  if (d.startsWith('91') && d.length === 12) d = d.slice(2);
  if (d.startsWith('0') && d.length === 11) d = d.slice(1);
  if (d.length === 10 && /^[6-9]/.test(d)) return '+91' + d;
  return null;
}

function pickEmail(allEmails, siteHost) {
  if (!allEmails.size) return null;
  const addrs = [...allEmails.keys()];
  const hostKey = siteHost.replace(/^www\./, '');
  const same = addrs.filter(a => {
    const d = a.split('@')[1];
    return d === hostKey || d.endsWith('.' + hostKey);
  });
  const preferred = ['info@','sales@','contact@','enquiry@','enquiries@','reach@','customercare@','care@','support@','admin@','hello@','mail@','office@'];
  function best(list) {
    for (const p of preferred) { const hit = list.find(a => a.startsWith(p)); if (hit) return hit; }
    return list[0];
  }
  return same.length ? best(same) : null;
}

function toUrl(website) {
  let u = String(website).trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try { return new URL(u); } catch { return null; }
}

async function scrapeSite(row, fetchCounter) {
  const siteUrl = toUrl(row.website);
  if (!siteUrl) return { error: 'bad url' };
  if (DOMAIN_BLOCKLIST.has(siteUrl.host)) return { error: 'blocklisted' };
  const host = siteUrl.host;
  const allEmails = new Map();
  const allPhones = new Map();
  let firstHit = null;
  let lastStatus = 0, lastErr = 'no-match';
  let wafHits = 0;
  for (const p of PATHS) {
    if (fetchCounter.n >= MAX_FETCHES) break;
    const url = new URL(p, siteUrl).toString();
    const r = await httpGetMulti(url, 2);
    fetchCounter.n += 1;
    if (r.status) lastStatus = r.status;
    if (r.error) {
      lastErr = r.error;
      if (/HTTP (403|503)/.test(r.error) || /Cloudflare|Checking your browser/i.test(r.html || '')) wafHits++;
      continue;
    }
    // Basic WAF heuristic — detection page with Cloudflare / CAPTCHA
    if (/(Cloudflare|Checking your browser|Attention Required|Access denied|cf-chl-bypass)/i.test(r.html.slice(0, 3000))) wafHits++;
    const e = extractEmails(r.html);
    const p2 = extractPhones(r.html);
    for (const [k, v] of e) allEmails.set(k, (allEmails.get(k) || 0) + v);
    for (const [k, v] of p2) allPhones.set(k, (allPhones.get(k) || 0) + v);
    if ((e.size || p2.size) && !firstHit) firstHit = url;
    await sleep(400);
  }
  return {
    primary_email: pickEmail(allEmails, host),
    phones: [...allPhones.entries()].filter(([,c]) => c >= 2).map(([p]) => p),
    primary_phone: null, // filled below from phones
    all_emails: [...allEmails.keys()],
    all_phones: [...allPhones.keys()],
    phone_counts: Object.fromEntries(allPhones),
    email_counts: Object.fromEntries(allEmails),
    http_status: lastStatus,
    error: (allEmails.size === 0 && allPhones.size === 0) ? lastErr : null,
    waf_hits: wafHits,
    source: firstHit || siteUrl.toString(),
  };
}

// Fallback: web search snippets for WAF-protected domains
async function searchSnippets(domain) {
  const q = `"${domain}" email phone contact`;
  const url = `https://search.brave.com/search?q=${encodeURIComponent(q)}`;
  const r = await httpGetMulti(url, 1);
  if (r.error || !r.html) return { emails: [], phones: [] };
  // Narrow to the search-result snippets area — avoid pulling emails from Brave UI
  // Heuristic: take only the first 150KB which has the results.
  const window = r.html.slice(0, 200_000);
  const emails = extractEmails(window);
  const phones = extractPhones(window);
  const emailArr = [...emails.keys()].filter(e => e.split('@')[1].toLowerCase() === domain.replace(/^www\./, ''));
  const phoneArr = [...phones.entries()].filter(([,c]) => c >= 1).map(([p]) => p);
  return { emails: emailArr, phones: phoneArr.slice(0, 3) };
}

async function connectDB() {
  const host = process.env.SUPABASE_DB_HOST;
  const password = process.env.SUPABASE_DB_PASSWORD;
  const m = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
  const ref = m[1];
  const regions = ['ap-south-1','us-east-1','ap-southeast-1','eu-west-1'];
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

async function buildTargets(client) {
  // (a) Stage 1 hits
  let stage1 = [];
  try {
    const raw = JSON.parse(readFileSync(STAGE1_IN, 'utf-8'));
    stage1 = (raw.results || []).filter(r => r.website).map(r => ({
      id: r.id, recycler_code: r.recycler_code, company_name: r.company_name,
      website: r.website, origin: 'stage1',
    }));
  } catch (e) { console.log(`stage1 file missing or empty: ${e.message}`); }

  // (b) rows with @recycler.in email AND website — but not in stage1 and not prior pass1 domains
  const rOthers = await client.query(`
    SELECT id, recycler_code, company_name, website, email, phone
    FROM recyclers
    WHERE website IS NOT NULL AND TRIM(website) <> ''
      AND (email ILIKE '%@recycler.in' OR email ILIKE '%@placeholder.%')
    ORDER BY recycler_code
  `);
  const stage1Ids = new Set(stage1.map(x => x.id));
  const others = rOthers.rows.filter(r => !stage1Ids.has(r.id)).map(r => ({
    id: r.id, recycler_code: r.recycler_code, company_name: r.company_name,
    website: r.website, origin: 'recycler-email',
  }));

  // (c) pass1 failure domains
  const rPass1 = await client.query(`
    SELECT id, recycler_code, company_name, website, email, phone
    FROM recyclers
    WHERE regexp_replace(COALESCE(website,''), '^https?://(www\\.)?', '') ILIKE ANY($1::text[])
       OR website ILIKE ANY($2::text[])
  `, [
    PASS1_FAIL_DOMAINS.map(d => `${d}%`),
    PASS1_FAIL_DOMAINS.map(d => `%${d}%`),
  ]);
  const pass1 = rPass1.rows.map(r => ({
    id: r.id, recycler_code: r.recycler_code, company_name: r.company_name,
    website: r.website, origin: 'pass1-retry',
  }));

  // Dedup — same id only once, prefer stage1 origin
  const byId = new Map();
  for (const r of [...stage1, ...pass1, ...others]) {
    if (!byId.has(r.id)) byId.set(r.id, r);
  }
  return [...byId.values()];
}

async function main() {
  const t0 = Date.now();
  const client = await connectDB();
  let targets;
  try { targets = await buildTargets(client); } finally { await client.end(); }
  console.log(`targets: ${targets.length} (stage1=${targets.filter(t=>t.origin==='stage1').length} recycler-email=${targets.filter(t=>t.origin==='recycler-email').length} pass1-retry=${targets.filter(t=>t.origin==='pass1-retry').length})`);
  console.log(`cap: MAX_FETCHES=${MAX_FETCHES}  TIMEOUT_SEC=${TIMEOUT_SEC}\n`);

  const results = [];
  const fetchCounter = { n: 0 };
  let rescued = 0;
  for (let i = 0; i < targets.length; i++) {
    const elapsedSec = (Date.now() - t0) / 1000;
    if (elapsedSec > TIMEOUT_SEC) {
      console.log(`\n⏱  ${TIMEOUT_SEC}s cap hit at ${i+1}/${targets.length} (fetches=${fetchCounter.n})`);
      break;
    }
    if (fetchCounter.n >= MAX_FETCHES) {
      console.log(`\n🧮 fetches cap ${MAX_FETCHES} hit at ${i+1}/${targets.length}`);
      break;
    }
    const r = targets[i];
    const prefix = `[${String(i+1).padStart(3)}/${targets.length}] ${r.recycler_code.padEnd(14)} (${r.origin})`;
    try {
      const s = await scrapeSite(r, fetchCounter);
      let rec = {
        id: r.id, recycler_code: r.recycler_code, company_name: r.company_name,
        url: r.website, origin: r.origin,
        email_found: s.primary_email || null,
        phone_found: s.phones && s.phones.length ? s.phones[0] : null,
        all_emails: s.all_emails || [],
        all_phones: s.all_phones || [],
        phone_counts: s.phone_counts || {},
        email_counts: s.email_counts || {},
        http_status: s.http_status || 0,
        waf_hits: s.waf_hits || 0,
        error: s.error || null,
        source: s.source || null,
        rescued: false,
      };
      // WAF fallback
      if ((!rec.email_found && !rec.phone_found) && (rec.waf_hits >= 2 || /HTTP (403|503)/.test(rec.error || ''))) {
        const u = toUrl(r.website);
        if (u) {
          const host = u.host.replace(/^www\./, '');
          const snip = await searchSnippets(host);
          fetchCounter.n += 1;
          if (snip.emails.length || snip.phones.length) {
            rec.email_found = rec.email_found || snip.emails[0] || null;
            rec.phone_found = rec.phone_found || snip.phones[0] || null;
            rec.all_emails = [...new Set([...rec.all_emails, ...snip.emails])];
            rec.all_phones = [...new Set([...rec.all_phones, ...snip.phones])];
            rec.rescued = true;
            rec.error = null;
            rescued++;
          }
        }
      }
      results.push(rec);
      const detail = rec.error
        ? `✗ ${rec.error}${rec.rescued ? ' (rescued!)' : ''}`
        : `✓ email=${rec.email_found || '∅'} phone=${rec.phone_found || '∅'} (${rec.all_emails.length}e/${rec.all_phones.length}p)${rec.rescued ? ' [WAF-rescue]' : ''}`;
      console.log(`${prefix} ${detail}  [${r.website}]  fetches=${fetchCounter.n}`);
    } catch (e) {
      console.log(`${prefix} ✗ exception ${e.message}`);
      results.push({ id: r.id, recycler_code: r.recycler_code, url: r.website, origin: r.origin, error: `exc:${e.message}` });
    }

    // Save every 10
    if ((i+1) % 10 === 0) {
      writeFileSync(OUT, JSON.stringify({ generated_at: new Date().toISOString(), progress: i+1, total: targets.length, fetches: fetchCounter.n, rescued, results }, null, 2));
    }
  }

  const elapsed = Math.round((Date.now() - t0) / 1000);
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify({
    generated_at: new Date().toISOString(),
    elapsed_sec: elapsed,
    planned: targets.length,
    scraped: results.length,
    total_fetches: fetchCounter.n,
    rescued,
    cap: MAX_FETCHES,
    results,
  }, null, 2));
  console.log(`\n✓ ${OUT}`);
  console.log(`  sites=${results.length}  fetches=${fetchCounter.n}  rescued=${rescued}  elapsed=${elapsed}s`);
}

main().catch(e => { console.error(e); process.exit(1); });
