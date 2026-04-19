#!/usr/bin/env node
// Inspect GPS coverage for the EV/battery-chain directory entries.
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const CATS = ['ev-oem', 'battery-pack', 'cell-maker', 'cam-maker'];

// Distinct waste-type breakdown first
const { data: all } = await sb.from('recyclers').select('waste_type').eq('is_active', true);
const counts = {};
for (const r of all ?? []) counts[r.waste_type ?? 'null'] = (counts[r.waste_type ?? 'null'] ?? 0) + 1;
console.log('waste_type breakdown (active):');
for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(20)} ${v}`);
}

const { data: ev } = await sb.from('recyclers')
  .select('recycler_code, company_name, state, city, waste_type, latitude, longitude, unit_name')
  .in('waste_type', CATS)
  .eq('is_active', true)
  .order('recycler_code');

const rows = ev ?? [];
const missing = rows.filter(r => r.latitude == null || r.longitude == null);

console.log(`\nEV/battery rows (ev-oem + battery-pack + cell-maker + cam-maker): ${rows.length}`);
console.log(`  with GPS:    ${rows.length - missing.length}`);
console.log(`  missing GPS: ${missing.length}`);

if (missing.length) {
  console.log('\nMissing GPS:');
  for (const r of missing) {
    const unit = r.unit_name ? ` · ${r.unit_name}` : '';
    console.log(`  ${r.recycler_code.padEnd(16)} ${String(r.waste_type).padEnd(14)} ${String(r.city ?? '?').padEnd(22)} ${String(r.state ?? '?').padEnd(18)} ${r.company_name}${unit}`);
  }
}
