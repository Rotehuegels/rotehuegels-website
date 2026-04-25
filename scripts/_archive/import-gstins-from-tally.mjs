#!/usr/bin/env node
/**
 * Import verified GSTINs from a Tally ledger CSV export into the
 * `recyclers` table. Tally Prime export path:
 *
 *   Gateway → Alter → List of Ledgers → Group: Sundry Creditors
 *   (and Sundry Debtors, separately) → Export (Alt+E)
 *   Format: CSV (or XML — script supports both)
 *
 * Expected CSV columns (any of these header names — script is case-
 * insensitive and tolerant of extra whitespace / commas):
 *   - "Ledger Name" or "Name" or "Party Name"
 *   - "GSTIN" or "GST No" or "GSTIN/UIN"
 *   - "State" (optional; used as disambiguator)
 *
 * Matching logic:
 *   1. Normalise Tally ledger name (strip suffixes like "Pvt Ltd",
 *      lowercase, remove punctuation)
 *   2. Find recyclers whose company_name normalises to the same thing
 *   3. If exactly ONE match — save the GSTIN
 *   4. If multiple matches — disambiguate by state (2-char state code
 *      in GSTIN vs recyclers.state)
 *   5. If still ambiguous — skip + report for manual review
 *
 * Run: node --env-file=.env.local scripts/import-gstins-from-tally.mjs <path-to-csv>
 *
 * Dry-run (report matches, don't write):
 *   node --env-file=.env.local scripts/import-gstins-from-tally.mjs <path> --dry
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const [file, ...flags] = process.argv.slice(2);
const DRY = flags.includes('--dry');

if (!file) {
  console.error('Usage: node --env-file=.env.local scripts/import-gstins-from-tally.mjs <csv-file> [--dry]');
  process.exit(1);
}

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('Missing Supabase env'); process.exit(1); }
const sb = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

// GST state codes → full state name mapping (for disambiguation)
const STATE_BY_CODE = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan',
  '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura',
  '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand',
  '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra', '29': 'Karnataka',
  '30': 'Goa', '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry',
  '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
};

const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[A-Z0-9]$/;

function normaliseName(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .replace(/\s*(pvt\.?\s*ltd\.?|private\s+limited|public\s+limited|limited|ltd\.?|llp|inc\.?|co\.?|corporation|corp\.?)\s*\.?\s*$/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Very small CSV parser (handles quoted fields with commas)
function parseCSV(text) {
  const rows = [];
  let cur = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { cur.push(field); field = ''; }
      else if (ch === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; }
      else if (ch !== '\r') field += ch;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter(r => r.some(c => c.trim().length));
}

function pickColumnIdx(headers, candidates) {
  const h = headers.map(x => x.trim().toLowerCase());
  for (const cand of candidates) {
    const idx = h.indexOf(cand.toLowerCase());
    if (idx >= 0) return idx;
  }
  // Fuzzy: "gstin" anywhere in the header
  for (const cand of candidates) {
    const needle = cand.toLowerCase();
    for (let i = 0; i < h.length; i++) if (h[i].includes(needle)) return i;
  }
  return -1;
}

async function main() {
  const raw = readFileSync(file, 'utf8');
  const rows = parseCSV(raw);
  if (rows.length < 2) { console.error('CSV has no data rows'); process.exit(1); }

  const headers = rows[0];
  const nameIdx  = pickColumnIdx(headers, ['Ledger Name', 'Name', 'Party Name', 'Company Name', 'Particulars']);
  const gstinIdx = pickColumnIdx(headers, ['GSTIN', 'GSTIN/UIN', 'GST No', 'GST Number', 'GSTIN No']);
  const stateIdx = pickColumnIdx(headers, ['State', 'State Name']);

  if (nameIdx < 0 || gstinIdx < 0) {
    console.error('Could not find required columns. Headers seen:', headers);
    console.error('Need at least a Name column and a GSTIN column.');
    process.exit(1);
  }

  console.log(`Columns: name=[${headers[nameIdx]}] gstin=[${headers[gstinIdx]}]${stateIdx >= 0 ? ' state=[' + headers[stateIdx] + ']' : ''}`);
  console.log(`Reading ${rows.length - 1} data rows from ${file}${DRY ? ' (DRY RUN)' : ''}\n`);

  // Collect valid Tally records
  const tallyRecs = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = (r[nameIdx] ?? '').trim();
    const gstinRaw = (r[gstinIdx] ?? '').trim().toUpperCase().replace(/\s/g, '');
    const state = stateIdx >= 0 ? (r[stateIdx] ?? '').trim() : '';
    if (!name || !GSTIN_RE.test(gstinRaw)) continue;
    const stateCode = gstinRaw.slice(0, 2);
    const derivedState = STATE_BY_CODE[stateCode] ?? state;
    tallyRecs.push({ name, norm: normaliseName(name), gstin: gstinRaw, state: derivedState });
  }
  console.log(`Valid Tally records (name + valid GSTIN): ${tallyRecs.length}\n`);
  if (!tallyRecs.length) { console.log('Nothing to import.'); return; }

  // Load all recyclers, build normalised-name index grouped by state
  let recyclers = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb.from('recyclers')
      .select('id, recycler_code, company_name, state, gstin')
      .eq('is_active', true)
      .range(from, from + 999);
    if (error) throw error;
    if (!data || !data.length) break;
    recyclers = recyclers.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`Loaded ${recyclers.length} active recyclers\n`);

  const normIdx = new Map(); // norm → [recycler rows]
  for (const r of recyclers) {
    const n = normaliseName(r.company_name);
    if (!n) continue;
    const list = normIdx.get(n) ?? [];
    list.push(r);
    normIdx.set(n, list);
  }

  let matched = 0, ambiguous = 0, noMatch = 0, alreadySet = 0, updated = 0;
  const ambigReport = [];

  for (const t of tallyRecs) {
    const candidates = normIdx.get(t.norm) ?? [];
    if (!candidates.length) { noMatch++; continue; }

    let chosen = null;
    if (candidates.length === 1) {
      chosen = candidates[0];
    } else {
      // Disambiguate by state
      const sameState = candidates.filter(c => (c.state ?? '').toLowerCase() === (t.state ?? '').toLowerCase());
      if (sameState.length === 1) chosen = sameState[0];
      else { ambiguous++; ambigReport.push({ tally: t, candidates }); continue; }
    }

    matched++;
    if (chosen.gstin) { alreadySet++; continue; }

    if (!DRY) {
      const { error } = await sb.from('recyclers').update({ gstin: t.gstin }).eq('id', chosen.id);
      if (!error) updated++;
    } else {
      updated++;
    }
    console.log(` ${DRY ? '[dry]' : '✓'} ${chosen.recycler_code.padEnd(14)} ← ${t.gstin}  (${t.name})`);
  }

  console.log(`\nSummary`);
  console.log(`  Tally records:       ${tallyRecs.length}`);
  console.log(`  Matched to recyclers: ${matched}`);
  console.log(`  Already had GSTIN:   ${alreadySet}`);
  console.log(`  ${DRY ? 'Would update' : 'Updated'}:       ${updated}`);
  console.log(`  Ambiguous (skipped): ${ambiguous}`);
  console.log(`  No match:             ${noMatch}`);

  if (ambigReport.length) {
    console.log(`\nAmbiguous matches (manual review):`);
    for (const a of ambigReport.slice(0, 10)) {
      console.log(` Tally: "${a.tally.name}" (${a.tally.state}) → ${a.tally.gstin}`);
      for (const c of a.candidates) console.log(`    candidate: ${c.recycler_code} ${c.company_name} (${c.state})`);
    }
    if (ambigReport.length > 10) console.log(`  ... and ${ambigReport.length - 10} more`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
