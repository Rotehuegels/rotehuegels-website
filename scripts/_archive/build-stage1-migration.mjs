#!/usr/bin/env node
/**
 * Build supabase/migrations/20260420_recyclers_website_backfill.sql
 * One UPDATE per row with COALESCE guard.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const IN  = '/Users/sivakumar/Projects/rotehuegels-website/.buddy/stage1-websites.json';
const OUT = '/Users/sivakumar/Projects/rotehuegels-website/supabase/migrations/20260420_recyclers_website_backfill.sql';

const data = JSON.parse(readFileSync(IN, 'utf-8'));
const hits = data.results.filter(r => r.website);

const esc = (s) => String(s).replace(/'/g, "''");

const lines = [
  '-- Stage 1 — Backfill recyclers.website for top 300 priority rows.',
  '-- Websites discovered via WebSearch + manual validation.',
  `-- Generated: ${new Date().toISOString()}`,
  `-- Hits: ${hits.length}`,
  '',
  'BEGIN;',
  '',
];
for (const h of hits) {
  lines.push(`-- ${h.recycler_code} ${esc(h.company_name)}`);
  lines.push(`UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), '${esc(h.website)}')`);
  lines.push(`WHERE id = '${h.id}';`);
  lines.push('');
}
lines.push('COMMIT;');
lines.push('');

writeFileSync(OUT, lines.join('\n'));
console.log(`wrote ${OUT} with ${hits.length} updates`);
