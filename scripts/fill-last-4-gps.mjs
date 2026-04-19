#!/usr/bin/env node
// Backfill GPS for the last 4 rows still missing it.
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const GPS = {
  'BM-MH-006':    [19.6494, 73.1641],  // Epic Energy SPV — Wada, Palghar district
  'BM-WB-001':    [22.5159, 88.3574],  // Navprakriti — 97A Southern Avenue Kolkata
  'METAL-TN-003': [13.4022, 80.1058],  // Jain Green — Pappankuppam SIPCOT Gummidipoondi
  'METAL-TN-004': [13.4016, 80.1070],  // Jain Resource Facility 2 Lead — SIPCOT R1-R3
};

for (const [code, [lat, lng]] of Object.entries(GPS)) {
  const { data: r } = await sb.from('recyclers').select('id, company_name').eq('recycler_code', code).maybeSingle();
  if (!r) { console.log(`✗ ${code} not found`); continue; }
  const { error } = await sb.from('recyclers').update({ latitude: lat, longitude: lng }).eq('id', r.id);
  if (error) console.log(`✗ ${code}: ${error.message}`);
  else       console.log(`✓ ${code.padEnd(14)} ${lat.toFixed(4)}, ${lng.toFixed(4)}  — ${r.company_name}`);
}
