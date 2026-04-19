#!/usr/bin/env node
/**
 * Add two new battery-recycling entrants that were missing from our
 * initial CPCB-2023-seeded DB because they hadn't reached authorised
 * capacity yet.
 *
 *  1. Navprakriti Green Energies Pvt Ltd — Kolkata, Li-ion hydromet
 *     (pre-operational; 3,000 MT/yr target by 2027)
 *     → new recycler row BM-WB-001
 *
 *  2. Epic Energy Limited (BSE-listed solar/LED/smart-meter parent)
 *     with subsidiary SPV Swachchha Urja Nirman LLP running the Wada
 *     (MH) plant: 500 kg/hr Li-ion shredding + 10 MWh/mo second-life.
 *     C-MET licensee (Mar 2025).
 *     → new company rows (Epic Energy parent + SUN LLP subsidiary),
 *       new recycler row BM-MH-006 under SUN LLP.
 */
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const TODAY = new Date().toISOString().slice(0, 10);

async function upsertCompany(row) {
  const { data: ex } = await sb.from('companies').select('id').eq('slug', row.slug).maybeSingle();
  if (ex) { await sb.from('companies').update(row).eq('id', ex.id); return ex.id; }
  const { data: ins, error } = await sb.from('companies').insert(row).select('id').single();
  if (error) throw new Error(`company ${row.slug}: ${error.message}`);
  return ins.id;
}

async function upsertRecycler(row) {
  const { data: ex } = await sb.from('recyclers').select('id').eq('recycler_code', row.recycler_code).maybeSingle();
  if (ex) { await sb.from('recyclers').update(row).eq('id', ex.id); return { id: ex.id, op: 'updated' }; }
  const { data: ins, error } = await sb.from('recyclers').insert(row).select('id').single();
  if (error) throw new Error(`recycler ${row.recycler_code}: ${error.message}`);
  return { id: ins.id, op: 'inserted' };
}

// ── 1. Navprakriti Green Energies Pvt Ltd ───────────────────────────
const navId = await upsertCompany({
  slug: 'navprakriti-green-energies-pvt-ltd',
  legal_name: 'Navprakriti Green Energies Private Limited',
  trade_name: 'NavPrakriti',
  parent_company_id: null,
  is_group_holding: false,
  cin: 'U70109WB2010PTC151356',
  website: 'https://navprakriti.com',
  registered_address: '97A, Southern Avenue, Kolkata, West Bengal – 700029, India',
  registered_state: 'West Bengal',
  description: 'Eastern India\'s first Li-ion battery material company — black mass recovery + cathode/anode materials from end-of-life Li-ion. Pre-operational as of FY24; roadmap: 3,000 MT/yr by 2027, 200,000 MT cumulative by 2030. ISO 9001, R2v3, C-MET partner.',
});
console.log(`✓ Navprakriti company row: ${navId}`);

const navContacts = [
  { name: 'Akhilesh Bagaria', title: 'Director',         department: null, email: null, phone: null, source: 'navprakriti.com', first_seen: TODAY },
  { name: 'Avnish Bagaria',   title: 'Director',         department: null, email: null, phone: null, source: 'navprakriti.com', first_seen: TODAY },
  { name: null, title: 'General',  department: null, email: 'info@navprakriti.com', phone: '033-40537000',   source: 'navprakriti.com', first_seen: TODAY },
  { name: null, title: 'WhatsApp', department: null, email: null,                    phone: '+91 96746 40000', source: 'navprakriti.com', first_seen: TODAY },
];

const nav = await upsertRecycler({
  recycler_code: 'BM-WB-001',
  company_name: 'Navprakriti Green Energies Private Limited',
  contact_person: 'Akhilesh Bagaria (Director)',
  email: 'info@navprakriti.com',
  phone: '033-40537000',
  website: 'https://navprakriti.com',
  address: '97A, Southern Avenue, Kolkata, West Bengal – 700029, India',
  city: 'Kolkata',
  state: 'West Bengal',
  pincode: '700029',
  waste_type: 'battery',
  capacity_per_month: '250 MTA',
  service_radius_km: 500,
  is_active: true,
  is_verified: false,
  notes: 'Li-ion battery material company — black mass, cathode + anode materials recovery. Pre-operational FY24; ramping up to 3,000 MTA by 2027. Identified 2026-04-19 via user reference; not on CPCB 2023 list because authorised capacity not yet filed.',
  company_id: navId,
  unit_name: 'Kolkata Hub',
  contacts_all: navContacts,
  websites_all: [{ url: 'https://navprakriti.com', source: 'navprakriti.com', first_seen: TODAY }],
});
console.log(`✓ BM-WB-001 ${nav.op} — Navprakriti Green Energies`);

// ── 2. Epic Energy Limited (parent) + SUN LLP (subsidiary SPV) ──────
const epicId = await upsertCompany({
  slug: 'epic-energy-limited',
  legal_name: 'Epic Energy Limited',
  trade_name: 'Epic Energy',
  parent_company_id: null,
  is_group_holding: true,                // Battery recycling is via SPV
  cin: 'L67120MH1991PLC063103',
  website: 'https://epicenergy.in',
  registered_address: 'Office No. 206, A Wing, 2nd Floor, Gokul Arcade, Swami Nityanand Road, Vile Parle East, Mumbai, Maharashtra – 400057, India',
  registered_state: 'Maharashtra',
  description: 'BSE-listed (1991) solar EPC + LED + smart-meter + power-conditioner company, now expanding into Li-ion battery recycling via its SPV Swachchha Urja Nirman LLP (SUN LLP). C-MET licensee since Mar 2025 for hydromet recycling of end-of-life Li-ion batteries (excluding LFP).',
});
console.log(`✓ Epic Energy Limited company row: ${epicId}`);

const sunId = await upsertCompany({
  slug: 'swachchha-urja-nirman-llp',
  legal_name: 'Swachchha Urja Nirman LLP',
  trade_name: 'SUN LLP',
  parent_company_id: epicId,
  is_group_holding: false,
  website: 'https://epicenergy.in',
  registered_address: 'Wada, Palghar, Maharashtra, India',
  registered_state: 'Maharashtra',
  description: 'SPV of Epic Energy Limited + REFNIC (Zetrance Technology) for Li-ion battery recycling and second-life battery assembly at Wada, Maharashtra. 500 kg/hr shredding + 10 MWh/month second-life line.',
});
console.log(`✓ SUN LLP subsidiary row: ${sunId}`);

const epicContacts = [
  { name: 'Sanjay Manikchand Gugale', title: 'Non-Executive Director',       department: null, email: null, phone: null, source: 'ZaubaCorp / MCA', first_seen: TODAY },
  { name: 'Veena Nikhil Morsawala',   title: 'Non-Executive Director',       department: null, email: null, phone: null, source: 'ZaubaCorp / MCA', first_seen: TODAY },
  { name: 'Brian Andre Dsouza',       title: 'Non-Executive Director',       department: null, email: null, phone: null, source: 'ZaubaCorp / MCA', first_seen: TODAY },
  { name: 'Bharat Indravadan Mehta',  title: 'Non-Executive Director',       department: null, email: null, phone: null, source: 'ZaubaCorp / MCA', first_seen: TODAY },
  { name: 'Priya Kishor Joshi',       title: 'Non-Executive Director',       department: null, email: null, phone: null, source: 'ZaubaCorp / MCA', first_seen: TODAY },
  { name: 'Nikhil Morsawala',         title: 'Chief Financial Officer',      department: 'Finance',       email: null, phone: null, source: 'epicenergy.in', first_seen: TODAY },
  { name: 'Harshal Gunde',            title: 'Advisor — Green Energy',       department: 'Advisory',      email: null, phone: null, source: 'epicenergy.in', first_seen: TODAY },
  { name: 'Pranav Chhatre',           title: 'Advisor — Business Development', department: 'Advisory',   email: null, phone: null, source: 'epicenergy.in', first_seen: TODAY },
  { name: null, title: 'General', department: null, email: null, phone: '+91 98338 32664', source: 'epicenergy.in', first_seen: TODAY },
];

const epic = await upsertRecycler({
  recycler_code: 'BM-MH-006',
  company_name: 'Swachchha Urja Nirman LLP (Epic Energy SPV)',
  contact_person: 'Nikhil Morsawala (CFO, Epic Energy)',
  email: 'bm.mh-006@placeholder.in',
  phone: '+91 98338 32664',
  website: 'https://epicenergy.in',
  address: 'Wada, Palghar district, Maharashtra, India',
  city: 'Wada',
  state: 'Maharashtra',
  waste_type: 'black-mass',
  capacity_per_month: '360 MTA',   // 500 kg/hr × 720 hrs/mo ≈ 360 MT
  black_mass_mta: 4320,            // 500 kg/hr × 8640 hrs ≈ 4,320 MTA (annualised)
  service_radius_km: 300,
  is_active: true,
  is_verified: false,
  notes: 'Epic Energy Ltd (BSE-listed) + REFNIC/Zetrance SPV. 500 kg/hr Li-ion shredding + 10 MWh/mo second-life battery assembly. C-MET hydromet licensee since Mar 2025. Wada, Palghar MH. Identified 2026-04-19 via user reference; not on CPCB 2023 list because plant commissioned after cutoff.',
  company_id: sunId,
  unit_name: 'Wada Li-ion Shredding + Second-Life Plant',
  contacts_all: epicContacts,
  websites_all: [{ url: 'https://epicenergy.in', source: 'epicenergy.in', first_seen: TODAY }],
});
console.log(`✓ BM-MH-006 ${epic.op} — SUN LLP / Epic Energy (Wada)`);

console.log('\nAll done.');
