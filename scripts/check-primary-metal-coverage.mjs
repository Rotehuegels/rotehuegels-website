import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data } = await sb.from('recyclers')
  .select('recycler_code, company_name, state, waste_type')
  .eq('is_active', true)
  .in('waste_type', ['primary-metal', 'critical-minerals'])
  .order('waste_type')
  .order('recycler_code');
for (const r of data ?? []) console.log(`${r.recycler_code.padEnd(16)} ${r.waste_type.padEnd(18)} ${r.state.padEnd(16)} ${r.company_name}`);
