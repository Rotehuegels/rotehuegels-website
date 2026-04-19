#!/usr/bin/env node
/**
 * Seed EV OEMs + battery pack makers + Li-ion cell / CAM manufacturers
 * into the recycler directory. These aren't recyclers themselves, but
 * they are (a) sources of EOL + production-scrap batteries and (b)
 * buyers of recycled cathode-active materials + battery-grade metal
 * salts. Listed under three new waste_type values:
 *   ev-oem       — vehicle OEMs that also assemble their own packs
 *   battery-pack — dedicated pack integrators (not vehicle OEMs)
 *   cell-maker   — Li-ion cell / CAM producers
 *
 * First seed batch — 15 majors. Config-driven; extend the GROUPS array
 * for the next pass.
 */
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const TODAY = new Date().toISOString().slice(0, 10);
const MCA = 'ZaubaCorp / Tofler / MCA 2026-04-19';

async function upsertCompany(row) {
  const { data: ex } = await sb.from('companies').select('id').eq('slug', row.slug).maybeSingle();
  if (ex) { await sb.from('companies').update(row).eq('id', ex.id); return ex.id; }
  const { data: ins, error } = await sb.from('companies').insert(row).select('id').single();
  if (error) throw new Error(`${row.slug}: ${error.message}`);
  return ins.id;
}
async function upsertRecycler(row) {
  const { data: ex } = await sb.from('recyclers').select('id').eq('recycler_code', row.recycler_code).maybeSingle();
  if (ex) { await sb.from('recyclers').update(row).eq('id', ex.id); return { id: ex.id, op: 'updated' }; }
  const { data: ins, error } = await sb.from('recyclers').insert(row).select('id').single();
  if (error) throw new Error(`${row.recycler_code}: ${error.message}`);
  return { id: ins.id, op: 'inserted' };
}

// All these are "generator + potential buyer" actors in the battery loop.
const ENTRIES = [
  // ── EV vehicle OEMs (in-house pack assembly) ───────────────────────
  {
    code: 'EVOEM-MH-001', waste_type: 'ev-oem',
    company: { slug: 'tata-motors-limited', legal_name: 'Tata Motors Limited', cin: 'L28920MH1945PLC004520', website: 'https://www.tatamotors.com', registered_address: 'Bombay House, 24 Homi Mody Street, Fort, Mumbai, Maharashtra – 400001, India', registered_state: 'Maharashtra', description: 'India\'s largest automotive OEM (Tata Group). EV portfolio: Nexon EV, Tigor EV, Punch EV, Tiago EV, Xpres-T. Pack assembly at Sanand (GJ) + Pune (MH). Tata Passenger Electric Mobility subsidiary.' },
    facility: { company_name: 'Tata Motors Limited', unit_name: 'Pune Electric Vehicle Plant', address: 'Chinchwad + Chikhali Plants, Pune, Maharashtra, India', city: 'Pune', state: 'Maharashtra', notes: 'EV assembly + in-house battery pack line. Source of production scrap + warranty-return packs. Potential buyer of CAM + metal salts.' },
    directors: [{ name: 'Natarajan Chandrasekaran', title: 'Chairman' }, { name: 'Girish Wagh', title: 'Executive Director — Commercial Vehicles' }, { name: 'P B Balaji', title: 'Group CFO' }],
  },
  {
    code: 'EVOEM-MH-002', waste_type: 'ev-oem',
    company: { slug: 'mahindra-mahindra-limited', legal_name: 'Mahindra & Mahindra Limited', cin: 'L65990MH1945PLC004558', website: 'https://www.mahindra.com', registered_address: 'Gateway Building, Apollo Bunder, Mumbai, Maharashtra – 400001, India', registered_state: 'Maharashtra', description: 'Mahindra Group flagship. EV portfolio: XUV400, BE 6e, XEV 9e, eKUV100, Treo e-rickshaw. Dedicated EV subsidiary (Mahindra Electric Automobile / MEAL). Pack plant at Chakan MH.' },
    facility: { company_name: 'Mahindra & Mahindra Limited', unit_name: 'Chakan EV Plant', address: 'Chakan Industrial Area, Pune, Maharashtra, India', city: 'Chakan', state: 'Maharashtra', notes: 'Flagship EV assembly + pack integration. Source of production scrap + future EOL packs.' },
    directors: [{ name: 'Anand G. Mahindra', title: 'Chairman' }, { name: 'Anish Shah', title: 'MD & CEO' }, { name: 'Rajesh Jejurikar', title: 'Executive Director — Auto & Farm' }],
  },
  {
    code: 'EVOEM-KA-001', waste_type: 'ev-oem',
    company: { slug: 'ola-electric-mobility-limited', legal_name: 'Ola Electric Mobility Limited', cin: 'L31909KA2017PLC101955', website: 'https://olaelectric.com', registered_address: 'Regent Insignia, 4th Floor, No. 414, Mysore Road, Bengaluru, Karnataka – 560026, India', registered_state: 'Karnataka', description: 'BSE/NSE-listed (2024). Electric 2-wheeler OEM + own Li-ion cell gigafactory (Futurefactory) at Krishnagiri TN. S1 Pro, S1 Air, S1 X range.' },
    facility: { company_name: 'Ola Electric Mobility Limited', unit_name: 'Futurefactory — Krishnagiri', address: 'SIPCOT Industrial Growth Centre, Pochampalli, Krishnagiri, Tamil Nadu, India', city: 'Krishnagiri', state: 'Tamil Nadu', notes: 'Scooter + pack + Li-ion cell manufacturing. Major source of production scrap + potential CAM/salts buyer once cell line ramps.' },
    directors: [{ name: 'Bhavish Aggarwal', title: 'Founder & CEO' }, { name: 'Arun Sarin', title: 'Chairman' }],
  },
  {
    code: 'EVOEM-KA-002', waste_type: 'ev-oem',
    company: { slug: 'ather-energy-limited', legal_name: 'Ather Energy Limited', cin: 'L29306KA2013PLC103046', website: 'https://www.atherenergy.com', registered_address: '3rd Floor, Tower D, IBC Knowledge Park, 4/1 Bannerghatta Road, Bengaluru, Karnataka – 560029, India', registered_state: 'Karnataka', description: 'BSE/NSE-listed (2024). Premium electric 2-wheeler OEM. 450X, Rizta. Pack + scooter assembly at Hosur TN. Strong battery IP.' },
    facility: { company_name: 'Ather Energy Limited', unit_name: 'Hosur Plant', address: 'SIPCOT Industrial Park, Hosur, Krishnagiri district, Tamil Nadu, India', city: 'Hosur', state: 'Tamil Nadu', notes: 'Factory 2 + pack assembly line. Battery management system IP. Source of scrap + EOL packs.' },
    directors: [{ name: 'Tarun Mehta', title: 'Co-Founder & CEO' }, { name: 'Swapnil Jain', title: 'Co-Founder & CTO' }],
  },
  {
    code: 'EVOEM-DL-001', waste_type: 'ev-oem',
    company: { slug: 'hero-motocorp-limited', legal_name: 'Hero MotoCorp Limited', cin: 'L35911DL1984PLC027651', website: 'https://www.heromotocorp.com', registered_address: '34, Community Centre, Basant Lok, Vasant Vihar, New Delhi – 110057, India', registered_state: 'Delhi', description: 'World\'s largest 2-wheeler OEM. EV brand: VIDA (VIDA V1). Pack + scooter at Chittoor AP + Gurugram.' },
    facility: { company_name: 'Hero MotoCorp Limited', unit_name: 'VIDA Chittoor Plant', address: 'Chittoor, Andhra Pradesh, India', city: 'Chittoor', state: 'Andhra Pradesh', notes: 'VIDA EV assembly. Source of production scrap + warranty packs. Future buyer of recycled CAM.' },
    directors: [{ name: 'Pawan Munjal', title: 'Executive Chairman' }, { name: 'Niranjan Gupta', title: 'CEO' }],
  },
  {
    code: 'EVOEM-PN-001', waste_type: 'ev-oem',
    company: { slug: 'bajaj-auto-limited', legal_name: 'Bajaj Auto Limited', cin: 'L65993PN2007PLC130076', website: 'https://www.bajajauto.com', registered_address: 'Mumbai-Pune Road, Akurdi, Pune, Maharashtra – 411035, India', registered_state: 'Maharashtra', description: 'Bajaj Group 2/3-wheeler major. EV: Chetak Electric. Pack + scooter at Akurdi + Chakan MH.' },
    facility: { company_name: 'Bajaj Auto Limited', unit_name: 'Akurdi Chetak Plant', address: 'Mumbai-Pune Road, Akurdi, Pune, Maharashtra – 411035, India', city: 'Pune', state: 'Maharashtra', notes: 'Chetak EV assembly + pack. Source of production scrap + warranty-return packs.' },
    directors: [{ name: 'Niraj Bajaj', title: 'Chairman' }, { name: 'Rajiv Bajaj', title: 'Managing Director' }],
  },
  {
    code: 'EVOEM-TN-001', waste_type: 'ev-oem',
    company: { slug: 'tvs-motor-company', legal_name: 'TVS Motor Company Limited', cin: 'L29212TN1992PLC022845', website: 'https://www.tvsmotor.com', registered_address: 'Jayalakshmi Estates, 29 Haddows Road, Chennai, Tamil Nadu – 600006, India', registered_state: 'Tamil Nadu', description: 'TVS Group flagship. EV: iQube, X. Pack + scooter at Hosur TN.' },
    facility: { company_name: 'TVS Motor Company Limited', unit_name: 'Hosur EV Plant', address: 'Post Box No. 4, Harita, Hosur, Krishnagiri, Tamil Nadu – 635109, India', city: 'Hosur', state: 'Tamil Nadu', notes: 'iQube + X assembly + pack. Major Tamil Nadu EV manufacturing cluster alongside Ather + Ola.' },
    directors: [{ name: 'Venu Srinivasan', title: 'Chairman Emeritus' }, { name: 'Sudarshan Venu', title: 'Managing Director' }],
  },
  {
    code: 'EVOEM-GJ-001', waste_type: 'ev-oem',
    company: { slug: 'mg-motor-india', legal_name: 'MG Motor India Private Limited', cin: 'U34100GJ2017FTC096814', website: 'https://www.mgmotor.co.in', registered_address: 'Halol, Panchmahals, Gujarat – 389351, India', registered_state: 'Gujarat', description: 'SAIC Motor (China) subsidiary — now JSW MG Motor JV. EV: ZS EV, Comet EV, Windsor EV. Halol Gujarat plant.' },
    facility: { company_name: 'MG Motor India Private Limited', unit_name: 'Halol Plant', address: 'Halol, Panchmahals, Gujarat – 389351, India', city: 'Halol', state: 'Gujarat', notes: 'India EV assembly. Source of production scrap + warranty-return packs.' },
    directors: [{ name: 'Emeritus Rajeev Chaba', title: 'Chairman (JSW MG)' }, { name: 'Anurag Mehrotra', title: 'Managing Director' }],
  },
  {
    code: 'EVOEM-TN-002', waste_type: 'ev-oem',
    company: { slug: 'hyundai-motor-india', legal_name: 'Hyundai Motor India Limited', cin: 'U34103TN1996PLC032677', website: 'https://www.hyundai.com/in/en', registered_address: 'Plot H-1, SIPCOT Industrial Park, Irrungattukottai, Sriperumbudur, Tamil Nadu – 602105, India', registered_state: 'Tamil Nadu', description: 'Hyundai Group India subsidiary. BSE/NSE-listed 2024. EV: Kona Electric, IONIQ 5, Creta Electric. Sriperumbudur plant.' },
    facility: { company_name: 'Hyundai Motor India Limited', unit_name: 'Sriperumbudur Plant', address: 'Plot H-1, SIPCOT Industrial Park, Irrungattukottai, Sriperumbudur, Tamil Nadu – 602105, India', city: 'Sriperumbudur', state: 'Tamil Nadu', notes: 'EV assembly + imported pack integration. Source of post-service packs.' },
    directors: [{ name: 'Unsoo Kim', title: 'Managing Director & CEO' }],
  },
  {
    code: 'EVOEM-TN-003', waste_type: 'ev-oem',
    company: { slug: 'ashok-leyland-limited', legal_name: 'Ashok Leyland Limited', cin: 'L34101TN1948PLC000105', website: 'https://www.ashokleyland.com', registered_address: '1, Sardar Patel Road, Guindy, Chennai, Tamil Nadu – 600032, India', registered_state: 'Tamil Nadu', description: 'Hinduja Group CV major. EV via Switch Mobility (UK subsidiary). BEV buses + LCV trucks. Ennore + Hosur plants.' },
    facility: { company_name: 'Ashok Leyland Limited', unit_name: 'Ennore EV Bus Plant', address: 'Ennore, Chennai, Tamil Nadu, India', city: 'Chennai', state: 'Tamil Nadu', notes: 'Switch Mobility EV bus assembly. Pack sourced from Ashok Leyland + partners. Source of production scrap + EOL packs.' },
    directors: [{ name: 'Dheeraj Hinduja', title: 'Executive Chairman' }, { name: 'Shenu Agarwal', title: 'Managing Director & CEO' }],
  },

  // ── Battery pack / Li-ion cell / CAM specialists ────────────────────
  {
    code: 'BPACK-WB-001', waste_type: 'battery-pack',
    company: { slug: 'exide-industries-limited', legal_name: 'Exide Industries Limited', cin: 'L31402WB1947PLC014919', website: 'https://www.exideindustries.com', registered_address: 'Exide House, 59E Chowringhee Road, Kolkata, West Bengal – 700020, India', registered_state: 'West Bengal', description: 'India\'s largest lead-acid battery maker, entering Li-ion via subsidiary Exide Energy Solutions (Bengaluru). BSE/NSE-listed. Multiple plants (lead-acid) across IN + SL.' },
    facility: { company_name: 'Exide Industries Limited', unit_name: 'Exide House — HQ + R&D', address: 'Exide House, 59E Chowringhee Road, Kolkata, West Bengal – 700020, India', city: 'Kolkata', state: 'West Bengal', notes: 'Parent entity. Li-ion subsidiary Exide Energy Solutions building 12 GWh gigafactory at Bengaluru.' },
    directors: [{ name: 'Bharat Dhirajlal Shah', title: 'Chairman' }, { name: 'Subir Chakraborty', title: 'MD & CEO' }, { name: 'Asish Kumar Mukherjee', title: 'Director — Finance & CFO' }],
  },
  {
    code: 'BPACK-AP-001', waste_type: 'battery-pack',
    company: { slug: 'amara-raja-energy-mobility', legal_name: 'Amara Raja Energy & Mobility Limited', cin: 'L31402AP1985PLC005305', website: 'https://www.amararaja.com', registered_address: 'Terminal A, Renigunta-Cuddapah Road, Karakambadi, Tirupati, Andhra Pradesh – 517520, India', registered_state: 'Andhra Pradesh', description: 'Formerly Amara Raja Batteries. BSE/NSE-listed. Amaron + PowerZone lead-acid + Amara Raja Giga Corridor Li-ion gigafactory (Divitipalli, Mahbubnagar TS).' },
    facility: { company_name: 'Amara Raja Energy & Mobility Limited', unit_name: 'Giga Corridor — Divitipalli Li-ion', address: 'Divitipalli, Mahbubnagar, Telangana, India', city: 'Mahbubnagar', state: 'Telangana', notes: 'Upcoming Li-ion cell + pack gigafactory. Major future buyer of recycled CAM.' },
    directors: [{ name: 'Jayadev Galla', title: 'Chairman' }, { name: 'Harshavardhana Gourineni', title: 'Managing Director' }],
  },
  {
    code: 'CELL-GJ-001', waste_type: 'cell-maker',
    company: { slug: 'reliance-new-energy-battery', legal_name: 'Reliance New Energy Battery Limited', cin: null, website: 'https://www.ril.com/businesses/new-energy-materials-business', registered_address: 'Jamnagar Dhirubhai Ambani Green Energy Giga Complex, Jamnagar, Gujarat, India', registered_state: 'Gujarat', description: 'Reliance Industries subsidiary for Li-ion cells. ACC PLI winner (5 GWh). Faradion sodium-ion acquisition. Jamnagar gigafactory.' },
    facility: { company_name: 'Reliance New Energy Battery Limited', unit_name: 'Jamnagar Giga Complex — Cell Plant', address: 'Dhirubhai Ambani Green Energy Giga Complex, Jamnagar, Gujarat, India', city: 'Jamnagar', state: 'Gujarat', notes: 'Under construction Li-ion + sodium-ion cell gigafactory. Biggest single-site potential CAM + metal salts buyer in India.' },
    directors: [{ name: 'Mukesh D. Ambani', title: 'Chairman (parent RIL)' }],
  },
  {
    code: 'CELL-KA-001', waste_type: 'cell-maker',
    company: { slug: 'log9-materials-scientific-pvt-ltd', legal_name: 'Log9 Materials Scientific Private Limited', cin: 'U24290KA2015PTC085106', website: 'https://www.log9materials.com', registered_address: '#17, 2nd Floor, 6th Main Road, Vasanth Nagar, Bengaluru, Karnataka – 560052, India', registered_state: 'Karnataka', description: 'LTO + LFP cell manufacturing + pack integration. Rapid-EV brand. Indigenous battery IP.' },
    facility: { company_name: 'Log9 Materials Scientific Private Limited', unit_name: 'Jigani Li-ion Cell Line', address: 'Jigani Industrial Area, Bengaluru, Karnataka, India', city: 'Bengaluru', state: 'Karnataka', notes: 'Commercial Li-ion cell manufacturing (LTO/LFP). Source of R&D + production scrap.' },
    directors: [{ name: 'Akshay Singhal', title: 'Founder & CEO' }, { name: 'Pankaj Sharma', title: 'Co-Founder & COO' }],
  },
  {
    code: 'BPACK-UP-001', waste_type: 'battery-pack',
    company: { slug: 'livguard-energy-technologies', legal_name: 'Livguard Energy Technologies Private Limited', cin: 'U31908UP2014PTC065521', website: 'https://www.livguard.com', registered_address: 'Plot No. 50, Sector 135, Noida, Gautam Buddha Nagar, Uttar Pradesh – 201304, India', registered_state: 'Uttar Pradesh', description: 'SAR Group subsidiary — residential inverter + Li-ion battery packs + EV packs. Noida HQ, plants in Haridwar UK + Pantnagar UK.' },
    facility: { company_name: 'Livguard Energy Technologies Private Limited', unit_name: 'Noida Pack Plant', address: 'Plot No. 50, Sector 135, Noida, Uttar Pradesh – 201304, India', city: 'Noida', state: 'Uttar Pradesh', notes: 'Li-ion pack + BMS + inverter combo. Generator of EOL packs + potential CAM buyer.' },
    directors: [{ name: 'Rakesh Malhotra', title: 'Founder & Chairman (SAR Group)' }, { name: 'Navneet Kapoor', title: 'CEO' }],
  },
];

for (const e of ENTRIES) {
  const companyId = await upsertCompany({
    slug: e.company.slug,
    legal_name: e.company.legal_name,
    trade_name: e.company.trade_name ?? null,
    parent_company_id: null,
    is_group_holding: false,
    cin: e.company.cin ?? null,
    website: e.company.website,
    registered_address: e.company.registered_address,
    registered_state: e.company.registered_state,
    description: e.company.description,
  });

  const contacts = e.directors.map(d => ({
    name: d.name, title: d.title, department: null, email: null, phone: null, source: MCA, first_seen: TODAY,
  }));

  const url = e.company.website;
  const host = url ? new URL(url).host : null;

  const r = await upsertRecycler({
    recycler_code: e.code,
    company_name: e.facility.company_name,
    contact_person: e.directors[0]?.name ? `${e.directors[0].name} (${e.directors[0].title})` : 'Corporate Contact',
    email: `${e.code.toLowerCase()}@placeholder.in`,
    phone: null,
    website: url,
    address: e.facility.address,
    city: e.facility.city,
    state: e.facility.state,
    waste_type: e.waste_type,
    service_radius_km: 500,
    is_active: true,
    is_verified: false,
    notes: e.facility.notes,
    company_id: companyId,
    unit_name: e.facility.unit_name,
    contacts_all: contacts,
    websites_all: url ? [{ url, source: host ?? MCA, first_seen: TODAY }] : [],
  });
  console.log(`${r.op.padEnd(8)} ${e.code.padEnd(14)} ${e.company.legal_name.slice(0, 55)}`);
}

console.log('\nDone.');
