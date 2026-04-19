#!/usr/bin/env node
// Export the 102 rows currently tagged "Capacity not publicly disclosed"
// so the research agents can work against a fixed list.
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data } = await sb.from('recyclers')
  .select('recycler_code, company_name, state, city, website, address')
  .eq('is_active', true)
  .eq('capacity_per_month', 'Capacity not publicly disclosed')
  .order('state')
  .order('recycler_code');

console.log(`Rows to research: ${data?.length ?? 0}`);
const chunks = [[], [], []];
(data ?? []).forEach((r, i) => chunks[i % 3].push(r));
for (let i = 0; i < 3; i++) {
  console.log(`\n--- CHUNK ${i + 1} (${chunks[i].length} rows) ---`);
  for (const r of chunks[i]) {
    const site = r.website ? ` · ${r.website}` : '';
    const city = r.city ? ` ${r.city}` : '';
    console.log(`${r.recycler_code}\t${r.company_name}\t${r.state}${city}${site}`);
  }
}
