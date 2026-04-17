#!/usr/bin/env node
/**
 * Scrape GSTINs from company websites. Starts with largest-capacity rows
 * so the most valuable facilities get enriched first.
 *
 * Target pages (GSTINs are usually on): /, /contact, /contact-us,
 * /privacy-policy, /terms, /terms-of-use, /legal, /about, /invoice.
 *
 * Run: node --env-file=.env.local scripts/enrich-gstin.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('Missing env'); process.exit(1); }
const sb = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const TIMEOUT = 20_000;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// GSTIN format: dd + 5 letters + 4 digits + 1 letter + 1 alphanum + Z + 1 alphanum
const GSTIN_RE = /\b(\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[A-Z0-9])\b/g;

// State name → GSTIN 2-digit prefix (for validation)
const STATE_CODE = {
  'Jammu & Kashmir': '01', 'Himachal Pradesh': '02', 'Punjab': '03', 'Chandigarh': '04',
  'Uttarakhand': '05', 'Haryana': '06', 'Delhi': '07', 'Rajasthan': '08',
  'Uttar Pradesh': '09', 'Bihar': '10', 'Sikkim': '11', 'Arunachal Pradesh': '12',
  'Nagaland': '13', 'Manipur': '14', 'Mizoram': '15', 'Tripura': '16',
  'Meghalaya': '17', 'Assam': '18', 'West Bengal': '19', 'Jharkhand': '20',
  'Odisha': '21', 'Chhattisgarh': '22', 'Madhya Pradesh': '23', 'Gujarat': '24',
  'Dadra & Nagar Haveli': '26', 'Daman & Diu': '26', 'Maharashtra': '27',
  'Karnataka': '29', 'Goa': '30', 'Lakshadweep': '31', 'Kerala': '32',
  'Tamil Nadu': '33', 'Puducherry': '34', 'Andaman & Nicobar Islands': '35',
  'Telangana': '36', 'Andhra Pradesh': '37', 'Ladakh': '38',
};

async function httpGet(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-IN,en;q=0.9' },
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html') && !ct.includes('xml')) return { error: `ct=${ct}` };
    return { html: await res.text() };
  } catch (e) { return { error: e.message }; } finally { clearTimeout(t); }
}

function findGstins(html) {
  const found = new Set();
  let m;
  while ((m = GSTIN_RE.exec(html)) !== null) found.add(m[1]);
  return [...found];
}

function toUrl(website) {
  let u = String(website).trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try { return new URL(u); } catch { return null; }
}

async function enrichRow(row) {
  const siteUrl = toUrl(row.website);
  if (!siteUrl) return { error: 'bad url' };
  const paths = ['/', '/contact', '/contact-us', '/privacy-policy', '/privacy',
                 '/terms', '/terms-of-use', '/terms-and-conditions',
                 '/legal', '/about', '/about-us', '/invoice-details'];
  const all = new Set();
  let lastStatus = 'no-match';
  for (const p of paths) {
    const url = new URL(p, siteUrl).toString();
    const r = await httpGet(url);
    if (r.error) { lastStatus = r.error; continue; }
    const gstins = findGstins(r.html);
    for (const g of gstins) all.add(g);
    await sleep(250);
    if (all.size) break; // first hit is usually enough
  }
  if (!all.size) return { error: lastStatus };

  const list = [...all];
  const expected = STATE_CODE[row.state];
  // Prefer one that matches the declared state
  const matching = list.find(g => g.startsWith(expected ?? 'ZZ'));
  return { gstin: matching ?? list[0], candidates: list };
}

async function fetchTargets() {
  // Fetch rows with website, no gstin, ordered by capacity DESC
  const all = [];
  let from = 0; const size = 1000;
  while (true) {
    const { data, error } = await sb.from('recyclers')
      .select('id, recycler_code, company_name, state, website, capacity_per_month')
      .eq('is_active', true)
      .is('gstin', null)
      .not('website', 'is', null)
      .range(from, from + size - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < size) break;
    from += size;
  }
  const parseCap = (s) => {
    if (!s) return 0;
    const m = String(s).match(/([\d,]+(?:\.\d+)?)/);
    return m ? parseFloat(m[1].replace(/,/g, '')) : 0;
  };
  all.sort((a, b) => parseCap(b.capacity_per_month) - parseCap(a.capacity_per_month));
  return all;
}

async function main() {
  const rows = await fetchTargets();
  console.log(`${rows.length} rows with website and no GSTIN\n`);

  let ok = 0, fail = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const prefix = `[${String(i + 1).padStart(3)}/${rows.length}] ${r.recycler_code.padEnd(14)}`;
    const res = await enrichRow(r);
    if (res.error) { fail++; console.log(`${prefix} ✗ ${res.error}`); continue; }

    const expected = STATE_CODE[r.state];
    const matches = expected && res.gstin.startsWith(expected);
    const tag = matches ? '✓' : '⚠ state-mismatch';
    const { error } = await sb.from('recyclers').update({ gstin: res.gstin }).eq('id', r.id);
    if (error) { fail++; console.warn(`${prefix} ✗ db ${error.message}`); continue; }
    ok++;
    console.log(`${prefix} ${tag} ${res.gstin} (expected prefix ${expected ?? '?'}) — ${r.company_name.slice(0, 40)}${res.candidates.length > 1 ? ` [+${res.candidates.length - 1} other]` : ''}`);
  }
  console.log(`\nDone. updated=${ok} failed=${fail}`);
}

main().catch(e => { console.error(e); process.exit(1); });
