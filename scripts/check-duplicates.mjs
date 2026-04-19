import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const codes = ['MRAI-HR-008', 'MRAI-HR-009', 'MAJ-WB-001', 'MRAI-RJ-005', 'RUN-TG-002', 'MAJ-TG-001', 'MRAI-MH-012', 'MRAI-DL-002', 'MRAI-TN-004', 'MRAI-WB-008'];
for (const code of codes) {
  const { data } = await sb.from('recyclers').select('recycler_code, company_name, state, waste_type, website, capacity_per_month').eq('recycler_code', code).maybeSingle();
  if (!data) { console.log(`${code}: not found`); continue; }
  console.log(`${code.padEnd(16)} ${data.company_name.padEnd(55)} waste=${(data.waste_type ?? '').padEnd(16)} cap=${(data.capacity_per_month ?? '(null)').slice(0, 40)}`);
}
