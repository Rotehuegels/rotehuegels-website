#!/usr/bin/env node
/**
 * Reconcile Trimex Sands data using the Future Projects strategy diagram
 * as the authoritative consolidated view (supersedes the small deltas on
 * the individual Srikurmam / Bhavanapadu project pages).
 *
 * Adds the full 3-tier roadmap:
 *   Current (Base Products) — operational mining from Srikurmam
 *   Short-to-medium (Value-Added) — Sillimanite flour + sulphate pigment
 *   Medium-to-long (Premium) — Titanium metal + TiO2 slag + chloride pigment
 */
import { createClient } from '@supabase/supabase-js';

const DRY = process.argv.includes('--dry-run');
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const TODAY = new Date().toISOString().slice(0, 10);

const CAPACITY =
  '321,000 TPA mineral sands — Ilmenite 210,000 + Rutile 6,000 + Zircon 5,000 + Garnet 50,000 + Sillimanite 50,000 (Srikurmam, current)';

const NOTE = [
  `[capacity ${TODAY}] Srikurmam Mineral Sands (current operational plant, Vatsavalasa / Gara Mandal / Srikakulam AP 532404): Ilmenite 210k + Rutile 6k + Zircon 5k + Garnet 50k + Sillimanite 50k = 321,000 TPA. 7.2 sq km mining lease covering Vatchavalasa + Tonangi deposits. World's only 5-mineral (Ilmenite/Rutile/Zircon/Garnet/Sillimanite) beach-sand separation plant. EPC: Walchand Nagar Industries (Pune). Tech: Downer EDI Mining (Australia).`,
  `[expansion ${TODAY}] Bhavanapadu Mineral Sands (short-to-medium, pending mining-lease clearance): Ilmenite 300k + Rutile 8k + Zircon 8k + Sillimanite 50k + Garnet 50k = 416,000 TPA additional. Kalingapatnam 15.39 sq km + Bhavanapadu 17.95 sq km. MSP design by Bateman Engineering (South Africa).`,
  `[value-add ${TODAY}] Short-to-medium roadmap (Value-Added): Sillimanite flour, sintered sillimanite grains, sintered mullite grains, sulphate-route TiO2 pigment 30-60 kT.`,
  `[premium ${TODAY}] Medium-to-long roadmap (Premium): Titanium metal 10,000 TPA, Zircoflour 5,000 TPA, TiO2 slag / synthetic rutile 180,000 TPA, chloride-route pigment 60,000 TPA. Strategic vision: "Asia's largest industrial minerals business through a fully integrated value chain."`,
  `[hq ${TODAY}] Registered office: Trimex Tower, 1 Subbaraya Avenue, CP Ramaswamy Road, Alwarpet, Chennai 600018.`,
].join('\n');

const { data: row } = await sb.from('recyclers')
  .select('id, capacity_per_month, notes')
  .eq('recycler_code', 'MAJ-TN-001')
  .single();

// Strip previous [capacity/expansion/hq] tags from today (our own earlier passes)
// so we don't accumulate stale notes. Keep lines that are not from today's tags.
const cleanedNotes = (row.notes ?? '')
  .split('\n')
  .filter(line => !/^\[(capacity|expansion|value-add|premium|hq|facility) \d{4}-\d{2}-\d{2}\]/.test(line))
  .join('\n')
  .trim();

const newNotes = cleanedNotes ? `${cleanedNotes}\n${NOTE}` : NOTE;

if (DRY) {
  console.log('DRY RUN');
  console.log('capacity:', CAPACITY);
  console.log('\nnotes:');
  console.log(newNotes);
  process.exit(0);
}

const { error } = await sb.from('recyclers')
  .update({ capacity_per_month: CAPACITY, notes: newNotes })
  .eq('id', row.id);

if (error) { console.error('✗', error.message); process.exit(1); }
console.log('✓ MAJ-TN-001 updated');
console.log(`  capacity: ${CAPACITY}`);
console.log(`  notes: ${NOTE.split('\n').length} roadmap lines`);
