#!/usr/bin/env node
// Report which active recycler rows still have no GPS, grouped by category,
// state, and company-code prefix. Helps prioritise the next backfill batch.
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from('recyclers')
    .select('recycler_code, company_name, state, city, waste_type, latitude, longitude, is_active')
    .eq('is_active', true)
    .range(from, from + 999);
  if (error) { console.error(error.message); process.exit(1); }
  if (!data?.length) break;
  rows.push(...data);
  if (data.length < 1000) break;
}

const missing = rows.filter(r => r.latitude == null || r.longitude == null);
const total = rows.length;
console.log(`Active rows: ${total}`);
console.log(`  with GPS:    ${total - missing.length} (${((total - missing.length) / total * 100).toFixed(1)}%)`);
console.log(`  missing GPS: ${missing.length} (${(missing.length / total * 100).toFixed(1)}%)`);

if (!missing.length) { console.log('\nAll rows have GPS.'); process.exit(0); }

// By waste_type
const byType = {};
for (const r of missing) byType[r.waste_type ?? 'null'] = (byType[r.waste_type ?? 'null'] ?? 0) + 1;
console.log('\nMissing GPS by waste_type:');
for (const [k, v] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(20)} ${v}`);
}

// By state
const byState = {};
for (const r of missing) byState[r.state ?? 'null'] = (byState[r.state ?? 'null'] ?? 0) + 1;
console.log('\nMissing GPS by state (top 15):');
for (const [k, v] of Object.entries(byState).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${k.padEnd(25)} ${v}`);
}

// By recycler_code prefix (source cohort)
const byPrefix = {};
for (const r of missing) {
  const pfx = String(r.recycler_code).split('-')[0];
  byPrefix[pfx] = (byPrefix[pfx] ?? 0) + 1;
}
console.log('\nMissing GPS by code prefix (cohort):');
for (const [k, v] of Object.entries(byPrefix).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(10)} ${v}`);
}

// Rows with city but no GPS — easy wins via city-centre geocoding
const hasCity = missing.filter(r => r.city && r.city.trim() !== '' && r.city !== '?');
console.log(`\nHave city (easy to geocode): ${hasCity.length}`);
console.log(`Missing city too:             ${missing.length - hasCity.length}`);

// Top cities in the missing set
const byCity = {};
for (const r of hasCity) {
  const k = `${r.city}, ${r.state}`;
  byCity[k] = (byCity[k] ?? 0) + 1;
}
console.log('\nTop cities in missing set (≥3):');
for (const [k, v] of Object.entries(byCity).sort((a, b) => b[1] - a[1])) {
  if (v < 3) break;
  console.log(`  ${k.padEnd(40)} ${v}`);
}
