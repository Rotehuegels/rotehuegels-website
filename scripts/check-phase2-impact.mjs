import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const rows = [];
for (let from = 0; ; from += 1000) {
  const { data } = await sb.from('recyclers').select('recycler_code, capacity_per_month').eq('is_active', true).range(from, from + 999);
  if (!data?.length) break;
  rows.push(...data);
  if (data.length < 1000) break;
}
const undisclosed = rows.filter(r => r.capacity_per_month === 'Capacity not publicly disclosed').length;
const na = rows.filter(r => r.capacity_per_month?.startsWith('N/A')).length;
const real = rows.length - undisclosed - na;
console.log(`Total active: ${rows.length}`);
console.log(`  Real capacity figure:      ${real} (${(real/rows.length*100).toFixed(1)}%)`);
console.log(`  'Not publicly disclosed':  ${undisclosed}`);
console.log(`  'N/A — not a recycler':    ${na}`);
