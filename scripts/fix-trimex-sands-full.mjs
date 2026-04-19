#!/usr/bin/env node
/**
 * Full correction for MAJ-TN-001 Trimex Sands using verified data from
 * trimexsands.com (contact, Srikurmam project, Bhavanapadu project pages).
 *
 * Corrections:
 *   1. State/city — registered office is Chennai but the facility being
 *      tracked is the Srikurmam Mineral Sands plant in Srikakulam AP.
 *      Move state → Andhra Pradesh, city → Srikakulam.
 *   2. GPS — was set to Chennai registered office (13.0637, 80.2367).
 *      Update to Srikurmam deposit at Vatsavalasa village.
 *   3. capacity_per_month — had Rutile 5k, Zircon 5k, Garnet 50k (wrong).
 *      Actual operational Srikurmam capacity: Ilmenite 200k, Rutile 6k,
 *      Zircon 6k, Garnet 60k, Sillimanite 50k = 322,000 TPA total.
 *   4. notes — add Bhavanapadu planned expansion (415k TPA additional)
 *      and registered office address.
 *   5. unit_name — set to reflect the Srikurmam plant identity.
 */
import { createClient } from '@supabase/supabase-js';

const DRY = process.argv.includes('--dry-run');
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const TODAY = new Date().toISOString().slice(0, 10);

const update = {
  state: 'Andhra Pradesh',
  city: 'Srikakulam',
  latitude: 18.2789,
  longitude: 83.9403,
  unit_name: 'Srikurmam Mineral Sands · Vatsavalasa, Gara Mandal',
  capacity_per_month:
    '322,000 TPA mineral sands — Ilmenite 200,000 + Rutile 6,000 + Zircon 6,000 + Garnet 60,000 + Sillimanite 50,000',
};

const NOTE = [
  `[facility ${TODAY}] Trimex Sands — Srikurmam Mineral Sands plant at Vatsavalasa village, Gara Mandal, Srikakulam AP 532404 (15 km from Srikakulam town, 7.2 sq km mining lease across Vatchavalasa + Tonangi deposits). World's only plant separating 5 minerals (Ilmenite, Rutile, Zircon, Garnet, Sillimanite) from beach sands; EPC by Walchand Nagar Industries, tech by Downer EDI Mining (Australia).`,
  `[expansion ${TODAY}] Bhavanapadu Mineral Sands — planned expansion (2012 plan, still under mining-lease clearance): 415,000 TPA additional (Ilmenite 300k + Rutile 8k + Zircon 7k + Garnet 50k + Sillimanite 50k). Sites: Bhavanapadu 17.95 sq km + Kalingapatnam 15.39 sq km. Bateman Engineering (South Africa) designed the MSP.`,
  `[hq ${TODAY}] Registered office: Trimex Tower, 1 Subbaraya Avenue, CP Ramaswamy Road, Alwarpet, Chennai 600018.`,
].join('\n');

const { data: row } = await sb.from('recyclers')
  .select('id, company_name, state, city, latitude, longitude, capacity_per_month, unit_name, notes')
  .eq('recycler_code', 'MAJ-TN-001')
  .single();

console.log('Before:');
console.log(`  state/city: ${row.state} / ${row.city}`);
console.log(`  GPS:        ${row.latitude}, ${row.longitude}`);
console.log(`  unit_name:  ${row.unit_name ?? '(null)'}`);
console.log(`  capacity:   ${row.capacity_per_month}`);

const newNotes = row.notes
  ? `${row.notes}\n${NOTE}`
  : NOTE;

if (DRY) {
  console.log('\nDRY RUN — would update:');
  console.log(JSON.stringify({ ...update, notes: newNotes }, null, 2));
  process.exit(0);
}

const { error } = await sb.from('recyclers')
  .update({ ...update, notes: newNotes })
  .eq('id', row.id);

if (error) { console.error('✗ update failed:', error.message); process.exit(1); }
console.log('\n✓ MAJ-TN-001 updated');
console.log(`  state/city: ${update.state} / ${update.city}`);
console.log(`  GPS:        ${update.latitude}, ${update.longitude}`);
console.log(`  capacity:   ${update.capacity_per_month}`);
