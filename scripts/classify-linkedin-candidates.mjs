#!/usr/bin/env node
/**
 * Pre-classify candidates:
 *  - `skip_non_india`: companies clearly based outside India (Kamoto DRC, etc.)
 *  - `skip_non_recycler`: research bodies / associations / traders only (we still record)
 *  - `web_check`: India-based or India-ambiguous; send to verification step
 * Writes an updated file with the `_preclass` field so downstream web-check
 * only hits the right set.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const IN = '/Users/sivakumar/Projects/rotehuegels-website/.buddy/linkedin-candidates.json';
const OUT = '/Users/sivakumar/Projects/rotehuegels-website/.buddy/linkedin-candidates-classified.json';

// Clearly non-Indian: company name geographically anchors abroad
const NON_INDIA_PAT = [
  /morocco/i, /egypt|assiut/i, /emirates global aluminium|\bega\b/i,
  /bahrain/i, /iran/i, /iralco/i,
  /kamoto copper|konkola|mopani|chambishi/i, // DRC/Zambia
  /\bUAE\b/i, /middle east recycling/i,
  /united states min/i,
  /copper development association inc/i, // US body
  /copper quail global/i, // Dubai-based consultancy
  /aeris stream copper manufacturing llc/i, // UAE
  /vargel expert corrosion aluminium/i, // non-India
];

// Associations / research / not-an-operating-recycler (India ones we keep, mark separately)
const NOT_RECYCLER_PAT = [
  /association of india/i, /material recycling association/i,
  /international copper association/i,
  /jawaharlal nehru aluminium research/i, /jnarddc/i,
  /battery innovations hub/i, // incubator/consortium
  /marketing manager - steel aluminium power sector/i, // misfiled — not a company
];

const data = JSON.parse(readFileSync(IN, 'utf-8'));

for (const v of data.missing) {
  const name = v.canonical;
  if (NON_INDIA_PAT.some(r => r.test(name))) v._preclass = 'skip_non_india';
  else if (NOT_RECYCLER_PAT.some(r => r.test(name))) v._preclass = 'not_recycler_org';
  else v._preclass = 'web_check';
}

const webCheck = data.missing.filter(v => v._preclass === 'web_check');
const nonIndia = data.missing.filter(v => v._preclass === 'skip_non_india');
const notRec = data.missing.filter(v => v._preclass === 'not_recycler_org');

console.log(`web_check: ${webCheck.length}, skip_non_india: ${nonIndia.length}, not_recycler_org: ${notRec.length}`);
writeFileSync(OUT, JSON.stringify(data, null, 2));
console.log(`→ wrote ${OUT}`);
console.log('\n== web_check list ==');
webCheck.forEach((v,i) => console.log(`${i+1}. ${v.canonical}`));
console.log('\n== skip_non_india ==');
nonIndia.forEach((v,i) => console.log(`${i+1}. ${v.canonical}`));
console.log('\n== not_recycler_org ==');
notRec.forEach((v,i) => console.log(`${i+1}. ${v.canonical}`));
