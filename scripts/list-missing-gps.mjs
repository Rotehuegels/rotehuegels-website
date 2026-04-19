import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data } = await sb.from('recyclers')
  .select('recycler_code, company_name, state, city, unit_name, address')
  .eq('is_active', true)
  .or('latitude.is.null,longitude.is.null')
  .order('recycler_code');
for (const r of data ?? []) {
  console.log(`${r.recycler_code.padEnd(16)} ${String(r.city ?? '?').padEnd(20)} ${String(r.state ?? '?').padEnd(18)} ${r.company_name}${r.unit_name ? ' · '+r.unit_name : ''}`);
  if (r.address) console.log(`     addr: ${r.address}`);
}
