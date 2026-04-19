#!/usr/bin/env node
/**
 * For recyclers missing a website, search the web for the company name and
 * pick the most likely official domain. Goes capacity-DESC so the biggest
 * companies get enriched first. Uses Brave Search HTML with generous
 * delays + DDG-lite as fallback to dodge rate limits.
 *
 * Saves results to recyclers.website. Skips rows that already have a
 * website. Does NOT scrape the site — that's enrich-contacts-from-website.mjs.
 *
 * CLI:
 *   --limit N       process only first N rows (default: all)
 *   --offset N      skip first N rows
 *   --min-delay ms  delay between searches (default 9000)
 *   --dry-run       log matches but don't write to DB
 *
 * Run: node --env-file=.env.local scripts/find-websites-bulk.mjs --limit 25
 */
import { createClient } from '@supabase/supabase-js';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('Missing env'); process.exit(1); }
const sb = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const LIMIT     = parseInt(flag('--limit', '0'), 10);
const OFFSET    = parseInt(flag('--offset', '0'), 10);
const MIN_DELAY = parseInt(flag('--min-delay', '9000'), 10);
const DRY       = args.includes('--dry-run');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const TIMEOUT = 20_000;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Domains that show up as false positives — aggregators / directories /
// social media / news. Pin-match against these and discard.
const NOT_OFFICIAL = new Set([
  'www.justdial.com', 'justdial.com', 'www.indiamart.com', 'indiamart.com',
  'dir.indiamart.com', 'www.tradeindia.com', 'tradeindia.com',
  'www.exportersindia.com', 'exportersindia.com', 'www.aajjo.com', 'aajjo.com',
  'www.zaubacorp.com', 'zaubacorp.com', 'www.tofler.in', 'tofler.in',
  'www.piceapp.com', 'piceapp.com', 'www.knowyourgst.com', 'knowyourgst.com',
  'www.mastersindia.co', 'mastersindia.co', 'www.mastergst.com', 'mastergst.com',
  'www.linkedin.com', 'linkedin.com', 'in.linkedin.com', 'lnkd.in',
  'www.facebook.com', 'facebook.com', 'm.facebook.com', 'www.instagram.com',
  'instagram.com', 'twitter.com', 'x.com', 'www.youtube.com', 'youtube.com',
  'en.wikipedia.org', 'wikipedia.org',
  'www.screener.in', 'screener.in', 'groww.in', 'www.moneycontrol.com',
  'moneycontrol.com', 'www.nseindia.com', 'nseindia.com', 'www.bseindia.com',
  'bseindia.com', 'finance.yahoo.com', 'www.cnbc.com', 'cnbc.com',
  'www.dnb.com', 'dnb.com', 'about.me', 'github.com',
  'www.cpcb.nic.in', 'cpcb.nic.in', 'ciiwasteexchange.org', 'mpcb.gov.in',
  'www.mpcb.gov.in', 'tnpcb.gov.in', 'www.tnpcb.gov.in',
  'www.rotehuegels.com', 'rotehuegels.com',
]);

const DOMAIN_BLOCKLIST = new Set(['nicoex.com', 'www.nicoex.com']);

async function httpGet(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: ctl.signal, redirect: 'follow',
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-IN,en;q=0.9', 'Accept': 'text/html' },
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    return { html: await res.text() };
  } catch (e) { return { error: e.message }; }
  finally { clearTimeout(t); }
}

function hostOf(url) { try { return new URL(url).host.toLowerCase(); } catch { return null; } }

// Normalise name → tokens (strip legal suffixes + noise)
function nameTokens(name) {
  return String(name).toLowerCase()
    .replace(/\b(pvt|private|ltd|limited|p\.?\s*ltd|\(p\)|llp|inc|corp|company|co)\b/g, '')
    .replace(/\b(unit|plant)\s*[ivx\d-]+/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ').filter(w => w.length >= 3);
}

function hostTokens(host) {
  return host.replace(/^www\./, '').replace(/\.(com|in|co\.in|org|net|io|biz|info|co|gov\.in|nic\.in)$/, '')
    .split('.')[0]
    .replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean);
}

function scoreCandidate(row, host) {
  if (NOT_OFFICIAL.has(host) || DOMAIN_BLOCKLIST.has(host)) return -1;
  const nt = nameTokens(row.company_name);
  const ht = hostTokens(host).join('').toLowerCase();
  const htSpaced = hostTokens(host).join(' ').toLowerCase();
  let score = 0;
  // Big boost: any long name-token appears inside the host string
  for (const t of nt) {
    if (ht.includes(t)) score += 3;
    else if (htSpaced.includes(t)) score += 1;
  }
  // Penalise weird TLDs and subdomains
  if (host.split('.').length > 3) score -= 1;
  // Prefer .in / .co.in / .com for Indian companies
  if (host.endsWith('.in') || host.endsWith('.co.in') || host.endsWith('.com')) score += 1;
  return score;
}

// Brave HTML search → return list of candidate URLs (external only, dedup by host).
async function braveUrls(query) {
  const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
  const r = await httpGet(url);
  if (r.error) return { error: r.error, urls: [] };
  const hrefs = [];
  const seen = new Set();
  for (const m of r.html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    try {
      const u = new URL(m[1]);
      const h = u.host.toLowerCase();
      if (h === 'search.brave.com' || h === 'brave.com' || h.endsWith('.brave.com')) continue;
      if (seen.has(h)) continue;
      seen.add(h);
      hrefs.push(m[1]);
    } catch { /* skip */ }
    if (hrefs.length >= 20) break;
  }
  return { urls: hrefs };
}

// DDG-lite fallback (plain text links, different rate-limit bucket from Brave).
async function ddgLiteUrls(query) {
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
  const r = await httpGet(url);
  if (r.error) return { error: r.error, urls: [] };
  const hrefs = [];
  const seen = new Set();
  for (const m of r.html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    try {
      const u = new URL(m[1]);
      const h = u.host.toLowerCase();
      if (h.includes('duckduckgo')) continue;
      if (seen.has(h)) continue;
      seen.add(h);
      hrefs.push(m[1]);
    } catch { /* */ }
    if (hrefs.length >= 20) break;
  }
  return { urls: hrefs };
}

async function searchCandidates(row) {
  const queries = [
    `"${row.company_name}" ${row.state ?? ''} official website`.trim(),
    `"${row.company_name}" ${row.city ?? row.state ?? ''} contact`.trim(),
  ];
  const all = new Map(); // host → { url, score }
  let lastError = null;
  for (const q of queries) {
    let r = await braveUrls(q);
    if (r.error) { lastError = `brave:${r.error}`; r = await ddgLiteUrls(q); }
    if (r.error) { lastError = `ddg:${r.error}`; continue; }
    for (const u of r.urls) {
      const h = hostOf(u);
      if (!h) continue;
      const s = scoreCandidate(row, h);
      if (s < 0) continue;
      const prev = all.get(h);
      if (!prev || s > prev.score) all.set(h, { url: u, score: s });
    }
    if ([...all.values()].some(v => v.score >= 3)) break; // a confident hit is enough
    await sleep(1200);
  }
  const ranked = [...all.entries()]
    .map(([host, v]) => ({ host, ...v }))
    .sort((a, b) => b.score - a.score);
  return { candidates: ranked, error: ranked.length ? null : lastError };
}

async function fetchTargets() {
  const rows = [];
  let from = 0; const size = 1000;
  while (true) {
    const { data, error } = await sb.from('recyclers')
      .select('id, recycler_code, company_name, state, city, website, capacity_per_month')
      .eq('is_active', true)
      .is('website', null)
      .range(from, from + size - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < size) break;
    from += size;
  }
  const parseCap = (s) => {
    if (!s) return 0;
    const m = String(s).match(/([\d,]+(?:\.\d+)?)/);
    return m ? parseFloat(m[1].replace(/,/g, '')) : 0;
  };
  rows.sort((a, b) => parseCap(b.capacity_per_month) - parseCap(a.capacity_per_month));
  return rows;
}

async function main() {
  let rows = await fetchTargets();
  if (OFFSET) rows = rows.slice(OFFSET);
  if (LIMIT)  rows = rows.slice(0, LIMIT);
  console.log(`${rows.length} recyclers without website to search${DRY ? ' (DRY RUN)' : ''}\n`);

  let hits = 0, misses = 0, saved = 0;
  const started = Date.now();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const prefix = `[${String(i + 1).padStart(4)}/${rows.length}] ${r.recycler_code.padEnd(14)}`;
    const res = await searchCandidates(r);
    if (res.error) { misses++; console.log(`${prefix} ✗ ${res.error}  — ${r.company_name.slice(0, 40)}`); }
    else if (!res.candidates.length) { misses++; console.log(`${prefix} ✗ no-candidates — ${r.company_name.slice(0, 40)}`); }
    else {
      hits++;
      const best = res.candidates[0];
      const confident = best.score >= 3;
      const tag = confident ? '✓' : '?';
      console.log(`${prefix} ${tag} score=${best.score} ${best.host.padEnd(30)}  ${r.company_name.slice(0, 40)}`);
      if (confident && !DRY) {
        const url = `https://${best.host.replace(/^https?:\/\//, '')}`;
        const { error } = await sb.from('recyclers').update({ website: url }).eq('id', r.id);
        if (error) console.warn(`      ✗ db ${error.message}`);
        else saved++;
      }
    }
    await sleep(MIN_DELAY);
  }
  const mins = ((Date.now() - started) / 60_000).toFixed(1);
  console.log(`\nDone. rows=${rows.length} hits=${hits} misses=${misses} websites_saved=${saved} took=${mins}m`);
}

main().catch(e => { console.error(e); process.exit(1); });
