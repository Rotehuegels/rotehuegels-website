#!/usr/bin/env node
// Report rows missing capacity_per_month, grouped by cohort + state.
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const rows = [];
for (let from = 0; ; from += 1000) {
  const { data } = await sb.from('recyclers')
    .select('recycler_code, company_name, state, city, waste_type, capacity_per_month, website, address, unit_name')
    .eq('is_active', true)
    .range(from, from + 999);
  if (!data?.length) break;
  rows.push(...data);
  if (data.length < 1000) break;
}

const missing = rows.filter(r => !r.capacity_per_month || r.capacity_per_month.trim() === '');
console.log(`Active rows: ${rows.length}`);
console.log(`With capacity:    ${rows.length - missing.length} (${((rows.length - missing.length) / rows.length * 100).toFixed(1)}%)`);
console.log(`Missing capacity: ${missing.length} (${(missing.length / rows.length * 100).toFixed(1)}%)`);

const byPrefix = {};
for (const r of missing) {
  const pfx = String(r.recycler_code).split('-')[0];
  byPrefix[pfx] = byPrefix[pfx] ?? { total: 0, states: new Set(), hasWebsite: 0 };
  byPrefix[pfx].total++;
  if (r.state) byPrefix[pfx].states.add(r.state);
  if (r.website) byPrefix[pfx].hasWebsite++;
}
console.log(`\nBy code prefix:`);
for (const [k, v] of Object.entries(byPrefix).sort((a, b) => b[1].total - a[1].total)) {
  console.log(`  ${k.padEnd(10)} ${String(v.total).padStart(4)}  websites=${v.hasWebsite}  states=${v.states.size}`);
}

const byType = {};
for (const r of missing) byType[r.waste_type ?? 'null'] = (byType[r.waste_type ?? 'null'] ?? 0) + 1;
console.log(`\nBy waste_type:`);
for (const [k, v] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(20)} ${v}`);
}

// Export missing rows for research / seeding
import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('.buddy', { recursive: true });
writeFileSync('.buddy/capacity-gaps.json', JSON.stringify(missing, null, 2));
console.log(`\nWrote .buddy/capacity-gaps.json (${missing.length} rows)`);

// Top 30 with websites — highest-yield for automated scrape
const withSite = missing.filter(r => r.website).slice(0, 30);
console.log(`\nTop 30 missing-capacity rows WITH website (easiest targets):`);
for (const r of withSite) {
  console.log(`  ${r.recycler_code.padEnd(16)} ${String(r.state ?? '').padEnd(18)} ${r.company_name}`);
  console.log(`    ${r.website}`);
}
