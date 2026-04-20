#!/usr/bin/env node
/**
 * Parse LinkedIn Connections.csv, filter to recycling-relevant companies,
 * dedupe, cross-check vs recyclers table, and emit a candidate list sorted
 * by Connected On date desc. No web checks here — that happens in step 2.
 *
 * Run: node --env-file=.env.local scripts/mine-linkedin-recyclers.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const CSV = '/Users/sivakumar/Downloads/Complete_LinkedInDataExport_04-20-2026.zip/Connections.csv';
const DB_DUMP = '/Users/sivakumar/Projects/rotehuegels-website/.buddy/recyclers-dump.json';
const OUT = '/Users/sivakumar/Projects/rotehuegels-website/.buddy/linkedin-candidates.json';

// ---- keyword filter ----
const KW = [
  'recycl', 'scrap', 'metal recovery', 'e-waste', 'ewaste', 'battery',
  'li-ion', 'lithium', 'cobalt', 'zinc', 'copper', 'aluminium', 'aluminum',
  'smelt', 'refin', 'hydromet', 'pyrometal', 'black mass', 'urban mining',
  'circular', 'alloys', 'extrusion', 'galvanis', 'anode', 'cathode', 'plating',
];
// Noise filter — obvious non-recycler contexts that match keywords
const NOISE_EXACT = new Set([
  'amazon web services (aws)', 'aws', 'jio platforms limited',
]);
// Phrases that typically mean "not a recycler" even if a kw hits
const NOISE_SUBSTR = [
  'refinitiv', // financial data
  'refine labs', 'refinery29',
  'battery ventures', // VC
  'cognizant refinery',
  'zomato', 'swiggy',
  'circular economy club', 'circularly',
  'consulting', 'consultancy', // we'll still keep some but tag noisy
];

// ---- CSV parsing (handles quotes) ----
function parseCsv(text) {
  const rows = [];
  let cur = [''];
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cur[cur.length - 1] += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur[cur.length - 1] += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') cur.push('');
      else if (c === '\n') { rows.push(cur); cur = ['']; }
      else if (c === '\r') { /* skip */ }
      else cur[cur.length - 1] += c;
    }
  }
  if (cur.length > 1 || cur[0]) rows.push(cur);
  return rows;
}

const text = readFileSync(CSV, 'utf-8');
const rows = parseCsv(text);

// Find header row (the one starting with "First Name")
let hdrIdx = -1;
for (let i = 0; i < Math.min(rows.length, 10); i++) {
  if (rows[i][0]?.trim() === 'First Name') { hdrIdx = i; break; }
}
if (hdrIdx < 0) { console.error('header not found'); process.exit(1); }
const header = rows[hdrIdx].map(s => s.trim());
const col = (n) => header.indexOf(n);
const cFirst = col('First Name');
const cLast = col('Last Name');
const cURL = col('URL');
const cEmail = col('Email Address');
const cCompany = col('Company');
const cPos = col('Position');
const cOn = col('Connected On');

const conns = [];
for (let i = hdrIdx + 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r || r.length < 5) continue;
  const company = (r[cCompany] || '').trim();
  if (!company) continue;
  conns.push({
    first: (r[cFirst] || '').trim(),
    last: (r[cLast] || '').trim(),
    url: (r[cURL] || '').trim(),
    email: (r[cEmail] || '').trim(),
    company,
    position: (r[cPos] || '').trim(),
    connectedOn: (r[cOn] || '').trim(),
  });
}
console.log(`→ parsed ${conns.length} connections (rows with Company)`);

// ---- keyword filter ----
function matchKw(company) {
  const lc = company.toLowerCase();
  if (NOISE_EXACT.has(lc)) return null;
  for (const s of NOISE_SUBSTR) if (lc.includes(s)) return null;
  for (const k of KW) if (lc.includes(k)) return k;
  return null;
}

const hits = conns.filter(c => matchKw(c.company));
console.log(`→ ${hits.length} connections at recycling-relevant companies`);

// ---- dedupe by normalized company ----
function normCompany(s) {
  return s.toLowerCase()
    .replace(/[()\[\]{}.,]/g, ' ')
    .replace(/\b(private|pvt|ltd|limited|the|india|inc|co|corp|corporation|llp|llc|group|industries|industry|enterprises|pvt\.|ltd\.)\b/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const byNorm = new Map();
for (const h of hits) {
  const key = normCompany(h.company);
  if (!key) continue;
  if (!byNorm.has(key)) byNorm.set(key, { canonical: h.company, norm: key, keyword: matchKw(h.company), connections: [] });
  byNorm.get(key).connections.push({
    name: `${h.first} ${h.last}`.trim(),
    position: h.position,
    connectedOn: h.connectedOn,
    url: h.url,
  });
}
console.log(`→ ${byNorm.size} unique companies after dedupe`);

// ---- cross-check vs DB ----
const db = JSON.parse(readFileSync(DB_DUMP, 'utf-8'));
const dbNorms = new Set();
for (const r of db) {
  if (r.company_name) dbNorms.add(normCompany(r.company_name));
  if (r.unit_name) dbNorms.add(normCompany(r.unit_name));
}
console.log(`→ DB has ${db.length} recycler rows, ${dbNorms.size} normalized company keys`);

// Loose partial match — if any token overlap > 70% of chars, treat as match
function looseMatch(norm) {
  if (dbNorms.has(norm)) return true;
  const toks = norm.split(' ').filter(t => t.length > 3);
  if (!toks.length) return false;
  for (const dn of dbNorms) {
    const dtoks = dn.split(' ').filter(t => t.length > 3);
    if (!dtoks.length) continue;
    const shared = toks.filter(t => dtoks.includes(t));
    if (shared.length >= Math.min(toks.length, dtoks.length) && shared.length >= 2) return true;
    // single-token exact match for short company names
    if (toks.length === 1 && dtoks.includes(toks[0]) && toks[0].length >= 5) return true;
  }
  return false;
}

const missing = [];
const inDb = [];
for (const v of byNorm.values()) {
  if (looseMatch(v.norm)) inDb.push(v);
  else missing.push(v);
}
console.log(`→ ${inDb.length} in DB, ${missing.length} missing from DB`);

// ---- sort missing by most recent connection ----
function parseDate(s) {
  // "19 Apr 2026"
  if (!s) return 0;
  const m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return 0;
  const months = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  const mi = months[m[2].slice(0,3)];
  if (mi == null) return 0;
  return new Date(+m[3], mi, +m[1]).getTime();
}
for (const v of missing) {
  v.newestConnMs = Math.max(...v.connections.map(c => parseDate(c.connectedOn)));
}
missing.sort((a, b) => b.newestConnMs - a.newestConnMs);

writeFileSync(OUT, JSON.stringify({
  total_connections: conns.length,
  keyword_hits: hits.length,
  unique_companies: byNorm.size,
  in_db: inDb.length,
  missing_from_db: missing.length,
  missing,
  in_db_companies: inDb.map(v => v.canonical),
}, null, 2));
console.log(`→ wrote ${OUT}`);
console.log('\nTop 20 most recent missing:');
for (const v of missing.slice(0, 20)) {
  console.log(`  [${new Date(v.newestConnMs).toISOString().slice(0,10)}] ${v.canonical} — ${v.connections.length} conn — kw=${v.keyword}`);
}
