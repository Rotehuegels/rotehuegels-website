#!/usr/bin/env node
/**
 * Phase 1b: harvest candidate GSTINs for recyclers that have no website.
 * Queries search.brave.com (tolerant to scraping), regex-extracts GSTINs
 * directly from the search results page (Brave inlines the GSTIN in snippets),
 * and stages them in recycler_gstin_candidates for later gstincheck validation.
 *
 * CLI:
 *   --limit N       process only first N rows (default: all)
 *   --offset N      skip first N rows before applying limit
 *   --min-delay ms  floor between Brave queries (default 2500)
 *
 * Run: node --env-file=.env.local scripts/harvest-gstin-candidates.mjs --limit 50
 */
import { createClient } from '@supabase/supabase-js';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('Missing env'); process.exit(1); }
const sb = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

const args = process.argv.slice(2);
const flag = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const LIMIT     = parseInt(flag('--limit', '0'), 10);
const OFFSET    = parseInt(flag('--offset', '0'), 10);
const MIN_DELAY = parseInt(flag('--min-delay', '2500'), 10);

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const TIMEOUT = 20_000;
const GSTIN_RE = /\b(\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[A-Z0-9])\b/g;
const HREF_RE  = /href="(https?:\/\/[^"]+)"/g;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const STATE_CODE = {
  'Jammu & Kashmir':'01','Himachal Pradesh':'02','Punjab':'03','Chandigarh':'04',
  'Uttarakhand':'05','Haryana':'06','Delhi':'07','Rajasthan':'08',
  'Uttar Pradesh':'09','Bihar':'10','Sikkim':'11','Arunachal Pradesh':'12',
  'Nagaland':'13','Manipur':'14','Mizoram':'15','Tripura':'16',
  'Meghalaya':'17','Assam':'18','West Bengal':'19','Jharkhand':'20',
  'Odisha':'21','Chhattisgarh':'22','Madhya Pradesh':'23','Gujarat':'24',
  'Dadra & Nagar Haveli':'26','Daman & Diu':'26','Maharashtra':'27',
  'Karnataka':'29','Goa':'30','Lakshadweep':'31','Kerala':'32',
  'Tamil Nadu':'33','Puducherry':'34','Andaman & Nicobar Islands':'35',
  'Telangana':'36','Andhra Pradesh':'37','Ladakh':'38',
};

// Ignore hrefs pointing back to the search engine itself.
const INTERNAL_HOSTS = new Set(['search.brave.com', 'brave.com', 'www.brave.com']);

async function httpGet(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': UA,
        'Accept-Language': 'en-IN,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    return { html: await res.text() };
  } catch (e) { return { error: e.message }; }
  finally { clearTimeout(t); }
}

async function braveSearch(query) {
  const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
  const r = await httpGet(url);
  if (r.error) return { error: r.error };
  return { html: r.html };
}

// For each GSTIN found, attribute the nearest preceding external href as source.
function extractGstins(html, nameWords, expectedPrefix) {
  // Collect href positions
  const hrefs = [];
  let m;
  HREF_RE.lastIndex = 0;
  while ((m = HREF_RE.exec(html)) !== null) {
    try {
      const h = new URL(m[1]).host;
      if (!INTERNAL_HOSTS.has(h)) hrefs.push({ pos: m.index, url: m[1], host: h });
    } catch { /* skip */ }
  }
  const lc = html.toLowerCase();
  const firstWord = nameWords.find(w => w.length >= 5);
  const out = new Map(); // gstin → { score, sourceUrl, host }
  GSTIN_RE.lastIndex = 0;
  while ((m = GSTIN_RE.exec(html)) !== null) {
    const gstin = m[1];
    const pos = m.index;
    // nearest preceding href
    let nearest = null;
    for (const h of hrefs) {
      if (h.pos > pos) break;
      nearest = h;
    }
    let score = 0;
    if (expectedPrefix && gstin.startsWith(expectedPrefix)) score += 2;
    if (firstWord && lc.includes(firstWord.toLowerCase())) score += 1;
    const prev = out.get(gstin);
    if (!prev || score > prev.score) {
      out.set(gstin, { score, sourceUrl: nearest?.url ?? null, host: nearest?.host ?? null });
    }
  }
  return [...out.entries()].map(([gstin, v]) => ({ gstin, ...v }));
}

async function harvestForRow(row) {
  const expectedPrefix = STATE_CODE[row.state];
  const nameWords = row.company_name.split(/\s+/).filter(w => /^[A-Za-z]+$/.test(w));
  const q1 = `"${row.company_name}" ${row.state ?? ''} GSTIN`.trim();
  let { error, html } = await braveSearch(q1);
  if (error) return { error: `brave:${error}` };
  let candidates = extractGstins(html, nameWords, expectedPrefix);

  // Fallback query if first yields nothing
  if (!candidates.length) {
    await sleep(800);
    const q2 = `"${row.company_name}" GSTIN India`;
    const r2 = await braveSearch(q2);
    if (!r2.error) candidates = extractGstins(r2.html, nameWords, expectedPrefix);
  }

  if (!candidates.length) return { error: 'no-gstin-found' };
  return { candidates };
}

async function fetchTargets() {
  const rows = [];
  let from = 0; const size = 1000;
  while (true) {
    const { data, error } = await sb.from('recyclers')
      .select('id, recycler_code, company_name, state, city, capacity_per_month')
      .eq('is_active', true)
      .is('gstin', null)
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

async function alreadyCandidated() {
  const { data } = await sb.from('recycler_gstin_candidates')
    .select('recycler_id').eq('source', 'search');
  return new Set((data ?? []).map(r => r.recycler_id));
}

async function main() {
  let rows = await fetchTargets();
  const skip = await alreadyCandidated();
  rows = rows.filter(r => !skip.has(r.id));
  if (OFFSET) rows = rows.slice(OFFSET);
  if (LIMIT)  rows = rows.slice(0, LIMIT);
  console.log(`${rows.length} rows to harvest (min-delay ${MIN_DELAY}ms)\n`);

  let hits = 0, fails = 0, inserted = 0;
  const started = Date.now();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const prefix = `[${String(i + 1).padStart(4)}/${rows.length}] ${r.recycler_code.padEnd(14)}`;
    const res = await harvestForRow(r);
    if (res.error) {
      fails++;
      console.log(`${prefix} ✗ ${res.error}`);
    } else {
      hits++;
      const payload = res.candidates.map(c => ({
        recycler_id: r.id,
        candidate_gstin: c.gstin,
        source: 'search',
        source_url: c.sourceUrl,
        source_context: `brave confidence=${c.score}${c.host ? ` host=${c.host}` : ''}`,
        state_prefix_match: STATE_CODE[r.state] ? c.gstin.startsWith(STATE_CODE[r.state]) : null,
      }));
      const { error, count } = await sb
        .from('recycler_gstin_candidates')
        .upsert(payload, { onConflict: 'recycler_id,candidate_gstin', ignoreDuplicates: true, count: 'exact' });
      if (error) { fails++; console.warn(`${prefix} ✗ db ${error.message}`); continue; }
      inserted += count ?? 0;
      const tags = res.candidates.slice(0, 3).map(c => `${c.score >= 2 ? '✓' : c.score === 1 ? '~' : '?'}${c.gstin}`).join(' ');
      console.log(`${prefix} ${tags} — ${r.company_name.slice(0, 40)}`);
    }
    await sleep(MIN_DELAY);
  }
  const mins = ((Date.now() - started) / 60_000).toFixed(1);
  console.log(`\nDone. rows=${rows.length} hits=${hits} fails=${fails} candidates_inserted=${inserted} took=${mins}m`);
}

main().catch(e => { console.error(e); process.exit(1); });
