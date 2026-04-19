import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const rows = [];
for (let from = 0; ; from += 1000) {
  const { data } = await sb.from('recyclers').select('waste_type, black_mass_mta, state').eq('is_active', true).range(from, from + 999);
  if (!data?.length) break;
  rows.push(...data);
  if (data.length < 1000) break;
}
console.log(`Total active: ${rows.length}`);
const byCat = {};
for (const r of rows) byCat[r.waste_type ?? 'null'] = (byCat[r.waste_type ?? 'null'] ?? 0) + 1;
console.log('\nPrimary waste_type breakdown:');
let total = 0;
for (const [k, v] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) { total += v; console.log(`  ${k.padEnd(20)} ${v}`); }
console.log(`  ${'TOTAL'.padEnd(20)} ${total}`);
const bmExtras = rows.filter(r => r.waste_type !== 'black-mass' && (r.black_mass_mta ?? 0) > 0).length;
console.log(`\nIntegrated recyclers with black_mass_mta (different primary waste_type): ${bmExtras}`);

const ALL = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli','Daman & Diu','Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry'];
const present = new Set(rows.map(r => r.state).filter(Boolean));
const missing = ALL.filter(s => !present.has(s));
console.log(`\nMissing states (from ALL 37 states/UTs): ${missing.length}`);
console.log(missing.join(', '));
