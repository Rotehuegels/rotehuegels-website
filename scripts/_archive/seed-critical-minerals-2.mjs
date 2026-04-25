#!/usr/bin/env node
/**
 * Phase 3 additions to the critical-minerals category — fills notable
 * gaps in ferro-alloys, manganese, and titanium pigment coverage:
 *
 *   CMIN-KL-003  Travancore Titanium Products (TTPL) — Kerala govt PSU,
 *                TiO2 pigment via sulphate route. Relevant because it's
 *                the complement to KMML's chloride-route unit on the
 *                same state.
 *   CMIN-AP-001  Nava Bharat Ventures — Paloncha (now Telangana) +
 *                Kharagprasad (Odisha) ferro-alloys + captive power.
 *   CMIN-WB-001  Maithan Alloys — India's largest private manganese-
 *                alloys producer.
 *   CMIN-MH-001B MOIL Limited — govt PSU, India's largest manganese-ore
 *                miner. Note: different state suffix since MH already
 *                used by IREL HQ row — using MAH to disambiguate.
 *                Actually CMIN-MH-002 is cleaner.
 *   CMIN-OD-004  Facor Alloys (now Vedanta) — Odisha ferro-chrome.
 */
import { createClient } from '@supabase/supabase-js';

const DRY = process.argv.includes('--dry-run');
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const TODAY = new Date().toISOString().slice(0, 10);
const SOURCE = 'corporate-public-disclosure';

const SEEDS = [
  {
    recycler_code: 'CMIN-KL-003',
    company_name: 'Travancore Titanium Products Limited',
    unit_name: 'Veli Ti Pigment Plant',
    state: 'Kerala',
    city: 'Thiruvananthapuram',
    latitude: 8.5333,
    longitude: 76.8867,
    capacity_per_month: '30,000 TPA TiO2 pigment (anatase grade, sulphate route) + 40,000 TPA ilmenite processing',
    email: 'marketing@ttpltd.com',
    phone: '+914712502301',
    extras: [{ title: 'Chairman / MD', email: 'md@ttpltd.com' }],
    note: 'TTPL — Kerala govt PSU. Anatase-grade TiO2 pigment via sulphate route (complement to KMML\'s chloride-route unit). Operational since 1946.',
  },
  {
    recycler_code: 'CMIN-TG-002',
    company_name: 'Nava Limited (formerly Nava Bharat Ventures)',
    unit_name: 'Paloncha Ferro Alloys + Captive Power',
    state: 'Telangana',
    city: 'Paloncha',
    latitude: 17.6000,
    longitude: 80.7000,
    capacity_per_month: '100,000 TPA ferro alloys (silico-manganese + ferro silicon + ferro chrome) + 114 MW captive power',
    email: 'ho@nblindia.com',
    phone: '+914023403565',
    extras: [{ title: 'Investor Relations', email: 'investor@navalimited.com' }],
    note: 'Nava Ltd — BSE-listed (513023), formerly Nava Bharat Ventures. Integrated ferro-alloys + power + agri business. Odisha unit separate (see CMIN-OD-005).',
  },
  {
    recycler_code: 'CMIN-OD-005',
    company_name: 'Nava Limited (formerly Nava Bharat Ventures)',
    unit_name: 'Kharagprasad Ferro Alloys + CFBC Power',
    state: 'Odisha',
    city: 'Dhenkanal',
    latitude: 20.6591,
    longitude: 85.5981,
    capacity_per_month: '175,000 TPA ferro chrome + 150 MW CFBC captive power',
    email: 'ho@nblindia.com',
    phone: '+916762232110',
    note: 'Nava Ltd Odisha unit — largest ferro-chrome plant in the group. Kharagprasad Dhenkanal Odisha.',
  },
  {
    recycler_code: 'CMIN-WB-001',
    company_name: 'Maithan Alloys Limited',
    unit_name: 'Kalyaneshwari + Byrnihat Ferro Manganese Complexes',
    state: 'West Bengal',
    city: 'Kolkata',
    latitude: 22.5726,
    longitude: 88.3639,
    capacity_per_month: '290,000 TPA ferro alloys (ferro manganese + silico manganese + ferro silicon) across 3 plants (Kalyaneshwari WB + Byrnihat Meghalaya + Ri Bhoi Meghalaya)',
    email: 'investors@maithanalloys.com',
    phone: '+913340294800',
    extras: [{ title: 'Company Secretary', email: 'cs@maithanalloys.com' }],
    note: 'Maithan Alloys — BSE-listed (590078) / NSE (MAITHANALL). India\'s largest private manganese-alloys producer. Captive power at each plant.',
  },
  {
    recycler_code: 'CMIN-MH-002',
    company_name: 'MOIL Limited',
    unit_name: 'Corporate HQ — Nagpur + 11 manganese ore mines (MH/MP)',
    state: 'Maharashtra',
    city: 'Nagpur',
    latitude: 21.1458,
    longitude: 79.0882,
    capacity_per_month: '1.3 Mn TPA manganese ore production (Balaghat MP + 10 smaller mines in MH + MP). Plans to ramp to 2.0 Mn TPA by FY30.',
    email: 'secmoil@moil.nic.in',
    phone: '+917122806182',
    extras: [{ title: 'Investor Relations', email: 'investor.moil@moil.nic.in' }],
    note: 'MOIL — govt PSU under Ministry of Steel. BSE-listed (533286) / NSE (MOIL). India\'s largest manganese-ore producer (~50% domestic market share).',
  },
  {
    recycler_code: 'CMIN-OD-004',
    company_name: 'Facor Alloys Limited (Vedanta)',
    unit_name: 'Bhadrak Ferro Chrome Plant',
    state: 'Odisha',
    city: 'Bhadrak',
    latitude: 21.0546,
    longitude: 86.5164,
    capacity_per_month: '72,000 TPA ferro chrome (2 × 16.5 MVA submerged-arc furnaces) + captive chrome-ore mine at Sukinda',
    email: 'investor@facor-alloys.com',
    phone: '+916784255401',
    note: 'Facor Alloys — acquired by Vedanta 2020. Ferro-chrome producer with captive Sukinda chrome-ore mine. Stainless-steel feedstock supplier.',
  },
];

const normEmail = (e) => e?.toLowerCase().trim();
const normPhone = (p) => p?.replace(/\D/g, '').replace(/^91/, '');

let inserted = 0, skipped = 0, failed = 0;
for (const s of SEEDS) {
  const { data: existing } = await sb.from('recyclers').select('id').eq('recycler_code', s.recycler_code).maybeSingle();
  if (existing) { skipped++; console.log(`- ${s.recycler_code} already exists — skip`); continue; }

  const contacts = [];
  if (s.email || s.phone) contacts.push({ name: null, title: null, department: null, email: s.email, phone: s.phone, source: SOURCE, first_seen: TODAY });
  for (const x of s.extras ?? []) contacts.push({ name: null, title: x.title ?? null, department: null, email: x.email ?? null, phone: x.phone ?? null, source: SOURCE, first_seen: TODAY });

  const row = {
    recycler_code: s.recycler_code,
    company_name: s.company_name,
    unit_name: s.unit_name,
    state: s.state,
    city: s.city,
    address: `${s.city}, ${s.state}`,
    contact_person: 'Corporate Communications',
    latitude: s.latitude,
    longitude: s.longitude,
    waste_type: 'critical-minerals',
    email: s.email,
    phone: s.phone,
    contacts_all: contacts,
    capacity_per_month: s.capacity_per_month,
    notes: `[created ${TODAY}] ${s.note}`,
    is_active: true,
  };

  if (DRY) { inserted++; console.log(`~ ${s.recycler_code} ${s.company_name}`); continue; }
  const { error } = await sb.from('recyclers').insert(row);
  if (error) { failed++; console.log(`✗ ${s.recycler_code}: ${error.message}`); continue; }
  inserted++;
  console.log(`✓ ${s.recycler_code.padEnd(14)} ${s.company_name} · ${s.unit_name}`);
}
console.log(`\n${DRY ? 'DRY RUN — ' : ''}inserted ${inserted}, skipped ${skipped}, failed ${failed}`);
