#!/usr/bin/env node
/**
 * Parse MoEF/CPCB Non-Ferrous Metal Waste Reprocessors list (376 units).
 * Source: http://ciiwasteexchange.org/Data/Non-ferrous%20metal%20waste%20reprocessors.pdf
 *
 * Extracts per-unit: name, state, waste-type, authorised capacity (MTA).
 * Writes .buddy/nfmr-parsed.json.
 *
 * Run: node scripts/parse-nfmr-capacities.mjs
 */
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pdfPath = '/tmp/nfmr.pdf';
const txtPath = '/tmp/nfmr.txt';

// Make sure we have the text file
execSync(`pdftotext -layout "${pdfPath}" "${txtPath}"`);
const text = readFileSync(txtPath, 'utf8');

// States occur as all-caps lines (may have spaces). Known Indian states.
const STATES = new Set([
  'ANDHRA PRADESH','ARUNACHAL PRADESH','ASSAM','BIHAR','CHHATTISGARH','GOA','GUJARAT',
  'HARYANA','HIMACHAL PRADESH','JAMMU & KASHMIR','JAMMU AND KASHMIR','JHARKHAND',
  'KARNATAKA','KERALA','MADHYA PRADESH','MAHARASHTRA','MANIPUR','MEGHALAYA',
  'MIZORAM','NAGALAND','ODISHA','ORISSA','PUNJAB','RAJASTHAN','SIKKIM',
  'TAMIL NADU','TAMILNADU','TELANGANA','TRIPURA','UTTAR PRADESH','UTTARANCHAL',
  'UTTARAKHAND','WEST BENGAL',
  // UTs
  'DELHI','CHANDIGARH','PUDUCHERRY','PONDICHERRY','DAMAN & DIU','DADRA & NAGAR HAVELI',
  'DADRA AND NAGAR HAVELI','ANDAMAN AND NICOBAR ISLANDS','LAKSHADWEEP',
]);

const STATE_NORMALISE = {
  'ORISSA': 'Odisha',
  'TAMILNADU': 'Tamil Nadu',
  'TAMIL NADU': 'Tamil Nadu',
  'ANDHRA PRADESH': 'Andhra Pradesh',
  'KARNATAKA': 'Karnataka',
  'MAHARASHTRA': 'Maharashtra',
  'GUJARAT': 'Gujarat',
  'HARYANA': 'Haryana',
  'DELHI': 'Delhi',
  'PUNJAB': 'Punjab',
  'RAJASTHAN': 'Rajasthan',
  'WEST BENGAL': 'West Bengal',
  'UTTAR PRADESH': 'Uttar Pradesh',
  'UTTARAKHAND': 'Uttarakhand',
  'UTTARANCHAL': 'Uttarakhand',
  'TELANGANA': 'Telangana',
  'KERALA': 'Kerala',
  'MADHYA PRADESH': 'Madhya Pradesh',
  'CHHATTISGARH': 'Chhattisgarh',
  'HIMACHAL PRADESH': 'Himachal Pradesh',
  'BIHAR': 'Bihar',
  'JHARKHAND': 'Jharkhand',
  'GOA': 'Goa',
  'PUDUCHERRY': 'Puducherry',
  'PONDICHERRY': 'Puducherry',
  'DAMAN & DIU': 'Daman & Diu',
  'DADRA & NAGAR HAVELI': 'Dadra & Nagar Haveli',
  'DADRA AND NAGAR HAVELI': 'Dadra & Nagar Haveli',
  'JAMMU & KASHMIR': 'Jammu & Kashmir',
  'JAMMU AND KASHMIR': 'Jammu & Kashmir',
  'ASSAM': 'Assam',
};

const lines = text.split('\n');
const records = [];
let currentState = null;
let currentRecord = null;

// Regex for unit start line: "1.   M/s Name Of Unit" (number may be followed by dot/paren; "M/s" may have space or slash)
const unitStartRe = /^\s*(\d+)[.)]?\s+M[/\\]?s\.?\s+(.+?)\s*$/;

for (let i = 0; i < lines.length; i++) {
  const raw = lines[i];
  const line = raw.trim();

  // State header detection — all-caps line that matches a state
  if (/^[A-Z&\s]+$/.test(line) && STATES.has(line.toUpperCase())) {
    currentState = STATE_NORMALISE[line.toUpperCase()] ?? line;
    if (currentRecord) { records.push(currentRecord); currentRecord = null; }
    continue;
  }

  const u = raw.match(unitStartRe);
  if (u) {
    // Close previous record if any
    if (currentRecord) records.push(currentRecord);
    currentRecord = {
      serial: parseInt(u[1], 10),
      name: u[2].trim(),
      state: currentState,
      waste_types: [],
      capacity_mta: null,
      address_lines: [],
      raw_lines: [raw],
    };
    continue;
  }

  if (currentRecord) {
    currentRecord.raw_lines.push(raw);
    currentRecord.address_lines.push(raw);
    // Capacity: line contains "- NNNN MTA" or "- NNNN MT/annum" etc.
    const cap = raw.match(/[-–]\s*([\d,]+(?:\.\d+)?)\s*(?:MT[A/]|MT\s*\/?\s*(?:A|annum|yr|year|per\s*annum))/i);
    if (cap && currentRecord.capacity_mta == null) {
      const n = parseFloat(cap[1].replace(/,/g, ''));
      if (n > 0 && n < 10_000_000) currentRecord.capacity_mta = n;
    }
  }
}
if (currentRecord) records.push(currentRecord);

// Dedupe by (name + state)
const seen = new Set();
const deduped = [];
for (const r of records) {
  const k = `${r.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}|${r.state ?? ''}`;
  if (seen.has(k)) continue;
  seen.add(k);
  // Drop the raw_lines from the persisted output
  const { raw_lines, address_lines, ...keep } = r;
  deduped.push({ ...keep, _address: address_lines.slice(0, 6).join(' | ').slice(0, 300) });
}

mkdirSync(resolve('.buddy'), { recursive: true });
writeFileSync(resolve('.buddy/nfmr-parsed.json'), JSON.stringify(deduped, null, 2));

const withCap = deduped.filter(r => r.capacity_mta != null);
console.log(`NFMR parsed records: ${records.length} (raw), ${deduped.length} (dedup)`);
console.log(`  with capacity: ${withCap.length}`);
console.log(`  without capacity: ${deduped.length - withCap.length}`);

// State breakdown
const byState = new Map();
for (const r of deduped) byState.set(r.state ?? 'UNKNOWN', (byState.get(r.state ?? 'UNKNOWN') ?? 0) + 1);
console.log(`\nBy state:`);
for (const [s, n] of [...byState.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${s.padEnd(20)} ${n}`);

console.log(`\nSample (5 with capacity):`);
for (const r of withCap.slice(0, 5)) console.log(`  [${r.state}] ${r.name} — ${r.capacity_mta} MTA`);
