import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// 1. Any waste_type literally named "plastic*"?
const { data: wt } = await sb.from('recyclers').select('waste_type').eq('is_active', true);
const types = new Set((wt ?? []).map(r => r.waste_type));
console.log('All distinct waste_type values:', [...types].sort().join(', '));
console.log();

// 2. Companies whose name / notes mention plastic / PET / polymer / granules
const { data: mentions } = await sb.from('recyclers')
  .select('recycler_code, company_name, state, waste_type, capacity_per_month, notes, unit_name')
  .eq('is_active', true)
  .or('company_name.ilike.%plastic%,company_name.ilike.%polymer%,company_name.ilike.%pet%,company_name.ilike.%granule%,unit_name.ilike.%plastic%,notes.ilike.%plastic%,notes.ilike.%pet %,notes.ilike.%polymer%');

console.log(`Rows mentioning plastic/PET/polymer/granules: ${mentions?.length ?? 0}`);
for (const r of mentions ?? []) {
  console.log(`  ${r.recycler_code.padEnd(16)} ${r.waste_type.padEnd(14)} ${(r.state ?? '').padEnd(16)} ${r.company_name}${r.unit_name ? ' · '+r.unit_name : ''}`);
}
