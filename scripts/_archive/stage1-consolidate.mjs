#!/usr/bin/env node
/**
 * Merge WebSearch-confirmed Stage-1 hits into stage1-websites.json.
 * Manually curated from WebSearch results run by the agent.
 */
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';

const STAGE1_CANDS = '/Users/sivakumar/Projects/rotehuegels-website/.buddy/stage1-candidates.json';
const STAGE1_OUT   = '/Users/sivakumar/Projects/rotehuegels-website/.buddy/stage1-websites.json';
const LOG          = '/Users/sivakumar/Projects/rotehuegels-website/.buddy/website-backfill-skipped.log';

// Curated hits from WebSearch tool — validated against company name + title/heading.
const HITS = [
  { recycler_code: 'CPCB-GJ-041', company_name: 'Egnus Ewaste Solution Private Limited',          website: 'https://egnus.in' },
  { recycler_code: 'CPCB-HR-043', company_name: 'Endeavor Recyclers India Private Limited',       website: 'https://endeavor-recyclers.com' },
  { recycler_code: 'CPCB-GJ-040', company_name: 'Evergreen E Waste Management Pvt. Ltd.',         website: 'https://evergreenrecycler.in' },
  { recycler_code: 'CPCB-MH-002', company_name: 'Eco-Recycling Ltd.',                              website: 'https://ecoreco.com' },
  { recycler_code: 'CPCB-TN-022', company_name: 'Enviro Metals Recyclers Private Limited',        website: 'https://ensenviro.com' },
  { recycler_code: 'CPCB-GJ-001', company_name: 'E-coli Waste Management P. Ltd',                  website: 'https://ecoliwaste.com' },
  { recycler_code: 'CPCB-UP-116', company_name: 'Cynosure Recycling Private Ltd.',                 website: 'https://cynosurerecycling.com' },
  { recycler_code: 'CPCB-UP-083', company_name: 'Eco Fly E-Waste Recycling Pvt. Ltd.',             website: 'https://ecoflyewaste.com' },
  { recycler_code: 'MPCB-MH-028', company_name: 'Bhangarwala Waste Management Pvt Ltd',            website: 'https://bwmgroup.in' },
  { recycler_code: 'MPCB-MH-038', company_name: 'Aman E-Waste Recyclers Pvt Ltd',                   website: 'https://amanrecyclers.com' },
  { recycler_code: 'CPCB-UP-043', company_name: 'B.R.P. Infotech Private Limited',                 website: 'https://brpinfotech.in' },
  { recycler_code: 'CPCB-UP-077', company_name: 'B.R.P. Infotech Private Limited (Unit-II)',      website: 'https://brpinfotech.in' },
  { recycler_code: 'CPCB-RJ-019', company_name: 'Abaad Developers Private Limited',                website: 'https://abaadd.com' },
  { recycler_code: 'RSPCB-RJ-028', company_name: 'Abaad Developers Pvt. Ltd.',                     website: 'https://abaadd.com' },
  { recycler_code: 'CPCB-UP-016', company_name: 'Auctus Recycling Solutions Pvt. Ltd',             website: 'https://auctusrecycling.com' },
  { recycler_code: 'CPCB-KA-012', company_name: 'E-Parisara Pvt. Ltd.',                            website: 'https://ewasteindia.com' },
  { recycler_code: 'CPCB-UP-013', company_name: 'Circularity Solutions PrivateLimited',            website: 'https://circularity.in' },
  { recycler_code: 'MPCB-MH-041', company_name: 'E-Frontline Recycling Pvt. Ltd.',                  website: 'https://e-frontline.com' },
  { recycler_code: 'CPCB-RJ-011', company_name: 'Adatte E-Waste Management Pvt. Ltd.',              website: 'https://adatte.in' },
  { recycler_code: 'CPCB-GJ-029', company_name: 'GL Recycling LLP',                                website: 'https://glrecycling.co.in' },
  { recycler_code: 'CPCB-MH-011', company_name: 'ECO RESET PRIVATE LIMITED',                       website: 'https://ecoreset.in' },
];

// Prior run had these additional confirmed from scraper — keep as is:
// NFMR-GJ-031 Atlas Chemical was flagged as score=3.5 but is a known false positive
// (atlasaircons.com is different company), so we exclude it.
const AUTO_REJECTED_FROM_PRIOR = new Set(['NFMR-GJ-031']);

const cands = JSON.parse(readFileSync(STAGE1_CANDS, 'utf-8')).stage1;
const byCode = new Map(cands.map(r => [r.recycler_code, r]));

// Build final results array in same shape as stage1-websites.json
const results = [];
let found = 0, rejected = 0, skipped = 0;
const hitsByCode = new Map(HITS.map(h => [h.recycler_code, h]));

for (const r of cands) {
  const hit = hitsByCode.get(r.recycler_code);
  if (AUTO_REJECTED_FROM_PRIOR.has(r.recycler_code)) {
    rejected++;
    results.push({ id: r.id, recycler_code: r.recycler_code, company_name: r.company_name, website: null, confidence: 0, candidates: [] });
    appendFileSync(LOG, `${r.recycler_code}\t${r.company_name}\tfalse-positive-atlasaircons\n`);
    continue;
  }
  if (hit) {
    found++;
    results.push({
      id: r.id, recycler_code: r.recycler_code, company_name: r.company_name,
      website: hit.website, confidence: 10, candidates: [{ host: new URL(hit.website).host, url: hit.website, score: 10 }],
      source: 'websearch',
    });
  } else {
    skipped++;
    results.push({ id: r.id, recycler_code: r.recycler_code, company_name: r.company_name, website: null, confidence: null, candidates: [] });
  }
}

const payload = {
  generated_at: new Date().toISOString(),
  method: 'mixed: brave-html scraper + WebSearch-curated',
  total_input: cands.length,
  found, rejected, skipped,
  results,
};
writeFileSync(STAGE1_OUT, JSON.stringify(payload, null, 2));
console.log(`found=${found} rejected=${rejected} skipped=${skipped}`);
console.log(`→ ${STAGE1_OUT}`);
