#!/usr/bin/env node
/**
 * Create a new 'critical-minerals' category and seed India's major
 * critical / heavy-mineral producers — companies that mine or process
 * titanium, zirconium, rare earths, graphite, ferro-chrome, and similar
 * upstream feedstocks for the metals + defence + clean-energy supply
 * chains.
 *
 * Step 1: retag Trimex Sands from 'hazardous' → 'critical-minerals'.
 * Step 2: insert major Indian critical-minerals producers, each with
 *         publicly disclosed corporate contacts, plant location, GPS,
 *         and capacity.
 *
 * Run: node --env-file=.env.local scripts/seed-critical-minerals.mjs [--dry-run]
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

// ── Step 1: retag Trimex Sands ─────────────────────────────────────────
const TRIMEX_UPDATE = {
  recycler_code: 'MAJ-TN-001',
  updates: {
    waste_type: 'critical-minerals',
  },
  note: '[category 2026-04-19] Reclassified from hazardous → critical-minerals. Heavy-minerals mining (Ilmenite, Rutile, Zircon, Garnet, Sillimanite). Roadmap includes titanium metal.',
};

// ── Step 2: new rows ───────────────────────────────────────────────────
// Each row: recycler_code, company_name, unit_name, state, city,
//           lat, lng, capacity_per_month, email, phone, contacts[], notes
const SEEDS = [
  {
    recycler_code: 'CMIN-MH-001',
    company_name: 'IREL (India) Limited',
    unit_name: 'Corporate HQ — Mumbai (NAPT Complex)',
    state: 'Maharashtra',
    city: 'Navi Mumbai',
    latitude: 19.0176,
    longitude: 72.8562,
    capacity_per_month: 'Group-level: ~650,000 TPA heavy minerals (Ilmenite ~340k + Rutile ~8k + Zircon ~21k + Sillimanite ~35k + Garnet ~14k + Monazite + REEs)',
    email: 'info@irel.co.in',
    phone: '+912228493500',
    extras: [
      { title: 'Company Secretary', email: 'cs@irel.co.in' },
    ],
    note: 'IREL (India) Ltd — Central PSU under Dept. of Atomic Energy (CIN U12000MH1950GOI008191). Operates 4 mineral-sands mining + separation plants (Chavara KL, Manavalakurichi TN, OSCOM Chatrapur OD, Aluva rare-earths KL). India\'s only monazite + rare-earths processor. Classified under critical minerals.',
  },
  {
    recycler_code: 'CMIN-KL-001',
    company_name: 'IREL (India) Limited',
    unit_name: 'Chavara Mineral Sands Plant',
    state: 'Kerala',
    city: 'Kollam',
    latitude: 9.0036,
    longitude: 76.5344,
    capacity_per_month: '150,000 TPA Ilmenite + Rutile + Zircon + Sillimanite from Neendakara-Kayamkulam belt',
    email: 'info@irel.co.in',
    phone: '+914742685800',
    note: 'IREL Chavara — oldest operational mineral-sands unit (commissioned 1935). Feeds KMML TiO2 plant next door.',
  },
  {
    recycler_code: 'CMIN-TN-001',
    company_name: 'IREL (India) Limited',
    unit_name: 'Manavalakurichi Mineral Sands Plant',
    state: 'Tamil Nadu',
    city: 'Kanyakumari',
    latitude: 8.1447,
    longitude: 77.3028,
    capacity_per_month: '90,000 TPA Ilmenite + Monazite + Rutile + Zircon + Garnet + Sillimanite',
    email: 'info@irel.co.in',
    phone: '+914651200215',
    note: 'IREL Manavalakurichi — Tamil Nadu mineral-sands operations (commissioned 1970). Monazite production critical for India\'s thorium + rare-earth supply.',
  },
  {
    recycler_code: 'CMIN-OD-001',
    company_name: 'IREL (India) Limited',
    unit_name: 'OSCOM Chatrapur Mineral Sands + Rare Earths',
    state: 'Odisha',
    city: 'Ganjam',
    latitude: 19.3636,
    longitude: 84.9856,
    capacity_per_month: '450,000 TPA Ilmenite + Rutile + Zircon + Sillimanite + Garnet + Monazite (largest IREL unit)',
    email: 'info@irel.co.in',
    phone: '+916811266215',
    note: 'IREL OSCOM — Orissa Sands Complex, Chatrapur. Largest Indian heavy-minerals operation. Rare-earth chloride + trisodium phosphate derivatives produced on-site.',
  },
  {
    recycler_code: 'CMIN-KL-002',
    company_name: 'Kerala Minerals and Metals Limited',
    unit_name: 'Chavara Integrated Ti Complex',
    state: 'Kerala',
    city: 'Kollam',
    latitude: 8.9951,
    longitude: 76.5307,
    capacity_per_month: '100,000 TPA TiO2 pigment (chloride route) + 500 TPA titanium sponge + mineral separation',
    email: 'mail@kmml.com',
    phone: '+914762685800',
    extras: [
      { title: 'Marketing', email: 'marketing@kmml.com' },
    ],
    note: 'KMML — Kerala govt PSU. India\'s only chloride-route TiO2 pigment plant + only titanium sponge maker. Critical for aerospace + defence Ti supply chain.',
  },
  {
    recycler_code: 'CMIN-KA-001',
    company_name: 'Graphite India Limited',
    unit_name: 'Bengaluru HQ',
    state: 'Karnataka',
    city: 'Bengaluru',
    latitude: 12.9716,
    longitude: 77.5946,
    capacity_per_month: '98,000 TPA graphite electrodes (Bengaluru + Durgapur + Nashik + Mandya combined)',
    email: 'cs.gil@graphiteindia.com',
    phone: '+918025589461',
    extras: [
      { title: 'Investor Relations', email: 'investor@graphiteindia.com' },
    ],
    note: 'Graphite India Ltd — BSE-listed (509488). India\'s largest graphite electrode producer. Electrodes critical for EAF steel + silicon carbide + lithium-ion anode supply.',
  },
  {
    recycler_code: 'CMIN-MP-001',
    company_name: 'HEG Limited',
    unit_name: 'Mandideep Integrated Graphite Electrode Plant',
    state: 'Madhya Pradesh',
    city: 'Mandideep',
    latitude: 23.1084,
    longitude: 77.5339,
    capacity_per_month: '80,000 TPA graphite electrodes (UHP + HP grades)',
    email: 'corporate@lnjbhilwara.com',
    phone: '+917480405500',
    extras: [
      { title: 'Investor Relations', email: 'investor@hegltd.com' },
    ],
    note: 'HEG Limited — part of LNJ Bhilwara Group, BSE-listed (509631). Second-largest Indian graphite electrode producer. Mandideep MP is Asia\'s largest single-location electrode plant.',
  },
  {
    recycler_code: 'CMIN-OD-002',
    company_name: 'Indian Metals & Ferro Alloys Limited',
    unit_name: 'Therubali + Choudwar Ferro Chrome Complexes',
    state: 'Odisha',
    city: 'Bhubaneswar',
    latitude: 20.2961,
    longitude: 85.8245,
    capacity_per_month: '284,000 TPA ferro chrome (Therubali 184k + Choudwar 100k)',
    email: 'corporate@imfa.in',
    phone: '+916742580100',
    extras: [
      { title: 'Investor Relations', email: 'investor@imfa.in' },
    ],
    note: 'IMFA — India\'s largest fully-integrated ferro-chrome producer. BSE-listed (533047). Ferro-chrome is critical for stainless steel (a major recycling feedstock).',
  },
  {
    recycler_code: 'CMIN-OD-003',
    company_name: 'Balasore Alloys Limited',
    unit_name: 'Balgopalpur Ferro Chrome Plant',
    state: 'Odisha',
    city: 'Balasore',
    latitude: 21.4924,
    longitude: 86.9339,
    capacity_per_month: '165,000 TPA ferro chrome (captive chrome ore mine at Sukinda)',
    email: 'cs@balasorealloys.com',
    phone: '+916782275781',
    extras: [
      { title: 'Investor Relations', email: 'investor@balasorealloys.com' },
    ],
    note: 'Balasore Alloys Ltd — BSE-listed (513142). Integrated ferro-chrome producer with captive Sukinda chrome mine. Critical input for stainless steel production.',
  },
  {
    recycler_code: 'CMIN-TN-002',
    company_name: 'V.V. Mineral',
    unit_name: 'Tuticorin Beach Sand Operations',
    state: 'Tamil Nadu',
    city: 'Thoothukudi',
    latitude: 8.7642,
    longitude: 78.1348,
    capacity_per_month: 'Group-level 200,000+ TPA Ilmenite + Rutile + Zircon + Garnet + Sillimanite + Monazite traces',
    email: 'info@vvmineral.com',
    phone: '+914612342030',
    note: 'V.V. Mineral — Tuticorin-based private heavy-minerals miner. One of India\'s largest private beach-sand operators. Feeds domestic + export TiO2 pigment + zircon markets.',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────
const normEmail = (e) => e?.toLowerCase().trim();
const normPhone = (p) => p?.replace(/\D/g, '').replace(/^91/, '');

function buildContacts(s) {
  const out = [];
  if (s.email || s.phone) {
    out.push({ name: null, title: null, department: null, email: s.email ?? null, phone: s.phone ?? null, source: SOURCE, first_seen: TODAY });
  }
  for (const x of s.extras ?? []) {
    out.push({ name: null, title: x.title ?? null, department: null, email: x.email ?? null, phone: x.phone ?? null, source: SOURCE, first_seen: TODAY });
  }
  return out;
}

// ── Step 1 ─────────────────────────────────────────────────────────────
{
  const { data: row } = await sb.from('recyclers').select('id, notes').eq('recycler_code', TRIMEX_UPDATE.recycler_code).maybeSingle();
  if (!row) { console.log(`✗ ${TRIMEX_UPDATE.recycler_code} not found`); }
  else {
    const newNotes = row.notes?.includes('[category 2026-04-19]') ? row.notes : `${row.notes ?? ''}\n${TRIMEX_UPDATE.note}`.trim();
    if (!DRY) {
      const { error } = await sb.from('recyclers').update({ ...TRIMEX_UPDATE.updates, notes: newNotes }).eq('id', row.id);
      if (error) console.log(`✗ ${TRIMEX_UPDATE.recycler_code} retag: ${error.message}`);
      else console.log(`✓ ${TRIMEX_UPDATE.recycler_code} retagged → critical-minerals`);
    } else {
      console.log(`~ ${TRIMEX_UPDATE.recycler_code} would retag → critical-minerals`);
    }
  }
}

// ── Step 2 ─────────────────────────────────────────────────────────────
let inserted = 0, skipped = 0, failed = 0;
for (const s of SEEDS) {
  // Skip if code already exists
  const { data: existing } = await sb.from('recyclers').select('id').eq('recycler_code', s.recycler_code).maybeSingle();
  if (existing) { skipped++; console.log(`- ${s.recycler_code} already exists — skip`); continue; }

  const contacts = buildContacts(s);
  const row = {
    recycler_code: s.recycler_code,
    company_name: s.company_name,
    unit_name: s.unit_name ?? null,
    state: s.state,
    city: s.city ?? null,
    address: s.address ?? `${s.city ?? ''}, ${s.state}`.trim(),
    contact_person: 'Corporate Communications',
    latitude: s.latitude,
    longitude: s.longitude,
    waste_type: 'critical-minerals',
    email: s.email ?? `info.${s.recycler_code.toLowerCase()}@placeholder.in`,
    phone: s.phone ?? null,
    contacts_all: contacts,
    capacity_per_month: s.capacity_per_month ?? null,
    notes: `[created ${TODAY}] ${s.note}`,
    is_active: true,
  };

  if (DRY) {
    inserted++;
    console.log(`~ ${s.recycler_code.padEnd(14)} ${s.company_name}${s.unit_name ? ' · ' + s.unit_name : ''}`);
    continue;
  }

  const { error } = await sb.from('recyclers').insert(row);
  if (error) { failed++; console.log(`✗ ${s.recycler_code}: ${error.message}`); continue; }
  inserted++;
  console.log(`✓ ${s.recycler_code.padEnd(14)} ${s.company_name}${s.unit_name ? ' · ' + s.unit_name : ''}`);
}

console.log(`\n${DRY ? 'DRY RUN — ' : ''}inserted ${inserted}, skipped ${skipped}, failed ${failed}`);
