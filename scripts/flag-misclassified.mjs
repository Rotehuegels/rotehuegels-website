import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: rows } = await sb.from('recyclers')
  .select('recycler_code, company_name, state, waste_type, capacity_per_month, website')
  .eq('is_active', true)
  .is('capacity_per_month', null);

// Patterns that suggest a row is NOT a pure recycler
const suspicious = /\b(engineering|consultancy|services|solutions|international|trading|traders|trade\b|exporters|export|enterprises?|ply(?:boards?)?|forging|foundries|castings?|bearings?|mills?|stamping|insulation|carbon\b|speciality|pigments?|cement|gases?|ceramic|refractories|equipment|oem|holdings?|industries limited\b|group)/i;

const flagged = (rows ?? []).filter(r => suspicious.test(r.company_name));
console.log(`Missing-capacity rows whose name suggests NOT a pure recycler: ${flagged.length}/${rows?.length ?? 0}`);
console.log();
for (const r of flagged) {
  console.log(`  ${r.recycler_code.padEnd(16)} ${r.company_name}`);
}
