#!/usr/bin/env node
/**
 * Tier-3 EV / battery-chain seed — 12 more companies.
 * Brings the new-category directory to ~39 entries.
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

const ENTRIES = [
  // ── EV OEMs (tier-3, 7) ─────────────────────────────────────────────
  {
    code: 'EVOEM-HR-001', waste_type: 'ev-oem',
    company: { slug: 'bmw-india-pvt-ltd', legal_name: 'BMW India Private Limited', cin: 'U35991HR1997PTC037496', website: 'https://www.bmw.in', registered_address: '2nd Floor, Oberoi Centre, Building No. 11, DLF Cyber City, Phase-II, Gurugram, Haryana – 122002, India', registered_state: 'Haryana', description: 'BMW Group India subsidiary. EV portfolio: iX, i7, i5, iX1. Chennai plant (since 2007) for CKD assembly. Gurugram registered office.' },
    facility: { company_name: 'BMW India Private Limited', unit_name: 'Chennai Plant (CKD)', address: 'BMW Plant, Kancheepuram, Tamil Nadu – 602103, India', city: 'Kancheepuram', state: 'Tamil Nadu', notes: 'Local CKD assembly of iX + i5 + iX1. Source of service + warranty EOL pack flows.' },
    directors: [{ name: 'Vikram Pawah', title: 'President & CEO' }, { name: 'Vineet Agarwal', title: 'Director' }, { name: 'Thomas Walter Dose', title: 'Director' }, { name: 'Marianne Louise Campbell Holt', title: 'Director' }],
  },
  {
    code: 'EVOEM-TN-005', waste_type: 'ev-oem',
    company: { slug: 'renault-nissan-automotive-india', legal_name: 'Renault Nissan Automotive India Private Limited', cin: 'U34100TN2007PTC073002', website: 'https://www.renault.co.in', registered_address: 'Plot No. 1, SIPCOT Industrial Park, Oragadam, Mattur Post, Sriperumbudur, Tamil Nadu – 602105, India', registered_state: 'Tamil Nadu', description: 'Renault–Nissan–Mitsubishi Alliance JV. 600-acre Oragadam plant (Chennai). Shared platform for Renault + Nissan + future EVs.' },
    facility: { company_name: 'Renault Nissan Automotive India Private Limited', unit_name: 'Oragadam Chennai Plant', address: 'Plot No. 1, SIPCOT Industrial Park, Oragadam, Sriperumbudur, Tamil Nadu – 602105, India', city: 'Sriperumbudur', state: 'Tamil Nadu', notes: 'Alliance manufacturing hub. Future EV platform assembly. Source of production scrap + service parts.' },
    directors: [{ name: 'Venkataram Mamillapalle', title: 'Country CEO & MD — Renault India' }, { name: 'Guillaume Pierre Marie Cartier', title: 'Director' }, { name: 'Gnanavelu Arunmozhi', title: 'Director' }, { name: 'Francois Provost', title: 'Director' }, { name: 'Herbert Steiner', title: 'Director' }, { name: 'Massimiliano Messina', title: 'Director' }, { name: 'Keerthi Prakash Vedalaveni Mallikarjunappa', title: 'Director' }],
  },
  {
    code: 'EVOEM-TN-006', waste_type: 'ev-oem',
    company: { slug: 'nissan-motor-india-pvt-ltd', legal_name: 'Nissan Motor India Private Limited', cin: 'U34100TN2005PTC073897', website: 'https://www.nissan.in', registered_address: 'Plot No. 1A, SIPCOT Industrial Area, Oragadam, Mattur Post, Sriperumbudur, Tamil Nadu – 602105, India', registered_state: 'Tamil Nadu', description: 'Nissan Motor Japan subsidiary. Sales + distribution arm in India. Leaf was India pilot, future EV via Alliance platform.' },
    facility: { company_name: 'Nissan Motor India Private Limited', unit_name: 'Oragadam Sales HQ', address: 'Plot No. 1A, SIPCOT Industrial Park, Oragadam, Sriperumbudur, Tamil Nadu – 602105, India', city: 'Sriperumbudur', state: 'Tamil Nadu', notes: 'Sales + after-market arm. Source of post-service + warranty EOL packs for Nissan Leaf + future EVs.' },
    directors: [{ name: 'Saurabh Vatsa', title: 'Managing Director' }, { name: 'Leonardus Gertrudis Johannes Dorssers', title: 'Director' }],
  },
  {
    code: 'EVOEM-GJ-002', waste_type: 'ev-oem',
    company: { slug: 'suzuki-motor-gujarat', legal_name: 'Suzuki Motor Gujarat Private Limited', cin: 'U34200GJ2014FTC079460', website: 'https://www.marutisuzuki.com', registered_address: 'Block No. 334 & 335, Hansalpur, Near Village Becharaji, Mandal, Ahmedabad, Gujarat – 382130, India', registered_state: 'Gujarat', description: 'Suzuki Motor Corporation subsidiary — contract-manufactures for Maruti Suzuki. 1M/yr capacity. eVitara (Maruti\'s first EV) production site. Large Li-ion pack integration planned.' },
    facility: { company_name: 'Suzuki Motor Gujarat Private Limited', unit_name: 'Hansalpur Plant + eVitara Line', address: 'Block No. 334 & 335, Hansalpur, Near Village Becharaji, Mandal, Ahmedabad, Gujarat – 382130, India', city: 'Hansalpur', state: 'Gujarat', notes: 'Maruti eVitara EV assembly site. Pack integration + production scrap. Future major recycled-material buyer.' },
    directors: [{ name: 'Arnab Roy', title: 'Director' }, { name: 'Tetsuharu Hayasaka', title: 'Director' }, { name: 'Bhavesh L Shah', title: 'Director' }, { name: 'Manjaree Chowdhary', title: 'Director' }, { name: 'Shigetoshi Torii', title: 'Director' }, { name: 'Maheswar Sahu', title: 'Director' }, { name: 'Takahiro Muramatsu', title: 'Director' }],
  },
  {
    code: 'EVOEM-GJ-003', waste_type: 'ev-oem',
    company: { slug: 'matter-motor-works', legal_name: 'Matter Motor Works Private Limited', cin: 'U34300GJ2019PTC105854', website: 'https://matter.in', registered_address: '301, Parishram Building, 5B Rashmi Society, Near Mithakhali Six Roads, Navrangpura, Ahmedabad, Gujarat – 380009, India', registered_state: 'Gujarat', description: 'Founded 2019. Maker of India\'s first geared electric motorcycle (Aera) with liquid-cooled Li-ion pack. Backed by Lalbhai Group. Khodiyar (Ahmedabad) plant.' },
    facility: { company_name: 'Matter Motor Works Private Limited', unit_name: 'Khodiyar Pack + Bike Line', address: 'Domestic Container Terminal Gate No. 4, Shed No. 1, Khodiyar, Ahmedabad, Gujarat, India', city: 'Ahmedabad', state: 'Gujarat', notes: 'Geared electric motorcycle + liquid-cooled Li-ion pack assembly. Indigenous BMS + thermal IP.' },
    directors: [{ name: 'Mohal Rajivbhai Lalbhai', title: 'Co-Founder & MD' }, { name: 'Arun Pratap Singh', title: 'Co-Founder' }, { name: 'Arvind Sahay', title: 'Director' }, { name: 'Amit Dilip Shah', title: 'Director' }],
  },
  {
    code: 'EVOEM-HR-002', waste_type: 'ev-oem',
    company: { slug: 'okinawa-autotech', legal_name: 'Okinawa Autotech Private Limited', cin: 'U34103HR2015PTC055420', website: 'https://okinawascooters.com', registered_address: 'Unit No. 119, JMD Megapolis, Sector-48, Sohna Road, Gurugram, Haryana – 122018, India', registered_state: 'Haryana', description: 'Electric scooter OEM. Manufacturing at Bhiwadi RJ, registered office Gurugram. Jeetender Sharma founder-MD.' },
    facility: { company_name: 'Okinawa Autotech Private Limited', unit_name: 'Bhiwadi Plant', address: 'Plot No. 4, Industrial Area, Bhiwadi, Rajasthan – 301019, India', city: 'Bhiwadi', state: 'Rajasthan', notes: 'Electric scooter + Li-ion pack assembly. Source of production scrap + warranty EOL packs.' },
    directors: [{ name: 'Jeetender Sharma', title: 'Founder & Managing Director' }, { name: 'Rupali Sharma', title: 'Director' }, { name: 'Madhvendra Prakash', title: 'Director' }],
  },
  {
    code: 'EVOEM-DL-003', waste_type: 'ev-oem',
    company: { slug: 'euler-motors-pvt-ltd', legal_name: 'Euler Motors Private Limited', cin: 'U72900DL2015PTC275513', website: 'https://eulermotors.com', registered_address: 'B-99, Second Floor, Panchsheel Vihar, New Delhi – 110017, India', registered_state: 'Delhi', description: 'Electric commercial-vehicle maker — HiLoad EV (3-wheel cargo) + Storm EV (4-wheel cargo). Founded 2018 by Saurav Kumar. Plants at Palwal HR.' },
    facility: { company_name: 'Euler Motors Private Limited', unit_name: 'Palwal Plant', address: 'Palwal, Haryana, India', city: 'Palwal', state: 'Haryana', notes: 'EV commercial vehicle + pack assembly for last-mile logistics. Source of high-cycle-count EOL packs.' },
    directors: [{ name: 'Saurav Kumar', title: 'Founder & CEO' }, { name: 'Arpit Agarwal', title: 'Director' }, { name: 'Rutvik Doshi', title: 'Director' }, { name: 'Gaurav Kumar', title: 'Director' }, { name: 'Ashish Agarwal', title: 'Director' }],
  },

  // ── Cell / CAM makers (tier-3, 2) ───────────────────────────────────
  {
    code: 'CAM-TG-001', waste_type: 'cell-maker',
    company: { slug: 'altmin-private-limited', legal_name: 'Altmin Private Limited', cin: 'U13209TG2023PTC170229', website: 'https://www.altmin.in', registered_address: '5th Floor, K Komplex, 1st Left, 100ft Road, Madhapur, Shaikpet, Hyderabad, Telangana – 500081, India', registered_state: 'Telangana', description: 'Series-A startup (2023). Setting up India\'s first LFP cathode active material (CAM) gigafactory in Telangana. Direct buyer of recycled Li / Fe / P.' },
    facility: { company_name: 'Altmin Private Limited', unit_name: 'Telangana LFP CAM Gigafactory (planned)', address: 'Telangana, India (exact site TBD)', city: 'Hyderabad', state: 'Telangana', notes: 'LFP CAM gigafactory. Critical buyer of recycled Li2CO3 + FePO4 feedstock.' },
    directors: [{ name: 'Sreenivasa Reddy Kandula', title: 'Director' }, { name: 'Ankit Jain', title: 'Director' }, { name: 'Anjani Sri Mourya Sunkavalli', title: 'Co-Founder & Director' }, { name: 'Shanil Sujit Bhayani', title: 'Director' }, { name: 'Kiriti Varma Kalidindi', title: 'Co-Founder & Director' }],
  },
  {
    code: 'CAM-GJ-001', waste_type: 'cell-maker',
    company: { slug: 'tata-chemicals-limited', legal_name: 'Tata Chemicals Limited', cin: 'L24239MH1939PLC002893', website: 'https://www.tatachemicals.com', registered_address: 'Bombay House, 24 Homi Mody Street, Fort, Mumbai, Maharashtra – 400001, India', registered_state: 'Maharashtra', description: 'Tata Group chemicals major. ₹4,000 Cr commit for 10 GW Li-ion cell + CAM plant at Dholera SIR Gujarat (126 acres allotted). MoUs with ISRO, CSIR-CECRI, C-MET for tech. Also active Li-ion battery recycling since 2019.' },
    facility: { company_name: 'Tata Chemicals Limited', unit_name: 'Dholera Li-ion Cell + CAM Plant', address: 'Dholera Special Investment Region (DSIR), Gujarat, India', city: 'Dholera', state: 'Gujarat', notes: '126-acre allotment for 10 GW Li-ion cell + CAM manufacturing. Planning stage. Recycled Ni/Co/Mn salts + Li2CO3 buyer once operational.' },
    directors: [{ name: 'S. Padmanabhan', title: 'Chairman (Non-Executive)' }, { name: 'N. Chandrasekaran', title: 'Director (Tata Sons Chairman)' }, { name: 'R. Mukundan', title: 'Managing Director & CEO' }],
  },

  // ── Swap / pack operators (tier-3, 3) ────────────────────────────────
  {
    code: 'BPACK-KA-001', waste_type: 'battery-pack',
    company: { slug: 'sun-mobility-pvt-ltd', legal_name: 'SUN Mobility Private Limited', cin: 'U35100KA2016PTC124376', website: 'https://www.sunmobility.com', registered_address: '25, 1st Cross, 2nd Main Road, Doddanekundi Industrial Area 2, Phase 1, Doddanekkundi, Bengaluru, Karnataka – 560048, India', registered_state: 'Karnataka', description: 'Battery-swap infrastructure major. Pack design + Swap Points network for 2W/3W/commercial. JV between Chetan Maini (Reva founder) and SUN Group (Uday Khemka). 100+ swap points in Bengaluru + nationwide rollout.' },
    facility: { company_name: 'SUN Mobility Private Limited', unit_name: 'Doddanekundi Bengaluru HQ + Pack Design', address: '25, 1st Cross, 2nd Main Road, Doddanekundi Industrial Area 2, Phase 1, Bengaluru, Karnataka – 560048, India', city: 'Bengaluru', state: 'Karnataka', notes: 'Swappable Li-ion pack design + operation. Fleet of thousands of packs in rotation. Huge future EOL pool + CAM buyer.' },
    directors: [{ name: 'Chetan Maini', title: 'Co-Founder & Chairman' }, { name: 'Uday Khemka', title: 'Co-Founder & Vice Chairman' }, { name: null, title: 'General Enquiries', department: null, email: 'info@sunmobility.com', phone: null, source: 'sunmobility.com' }, { name: null, title: 'Partnerships', department: 'BD', email: 'partnerships@sunmobility.com', phone: null, source: 'sunmobility.com' }, { name: null, title: 'Media & PR', department: 'Communications', email: 'media@sunmobility.com', phone: null, source: 'sunmobility.com' }],
  },
  {
    code: 'EVOEM-KA-003', waste_type: 'ev-oem',
    company: { slug: 'wickedride-adventure-bounce-infinity', legal_name: 'Wickedride Adventure Services Private Limited', trade_name: 'Bounce Infinity', cin: null, website: 'https://bounceinfinity.com', registered_address: 'Abhaya Heights, No. 11, Service Road, J.P. Nagar 3rd Phase, Bengaluru, Karnataka – 560078, India', registered_state: 'Karnataka', description: 'Bounce Infinity brand — electric scooter OEM + swappable battery network. Founded by Vivekananda Hallekere. Bengaluru based.' },
    facility: { company_name: 'Wickedride Adventure Services Pvt Ltd (Bounce Infinity)', unit_name: 'Bengaluru HQ + Scooter Assembly', address: 'Abhaya Heights, No. 11, Service Road, J.P. Nagar 3rd Phase, Bengaluru, Karnataka – 560078, India', city: 'Bengaluru', state: 'Karnataka', notes: 'Electric scooter + battery-swap network operator. Scooter E.1 with removable pack. CIN pending public confirmation — flagged for follow-up.' },
    directors: [{ name: 'Vivekananda Hallekere', title: 'Co-Founder & CEO' }],
  },
  {
    code: 'EVOEM-KA-004', waste_type: 'ev-oem',
    company: { slug: 'simple-energy-pvt-ltd', legal_name: 'Simple Energy Private Limited', trade_name: 'Simple Energy', cin: null, website: 'https://www.simpleenergy.in', registered_address: 'Bengaluru, Karnataka, India (exact address pending)', registered_state: 'Karnataka', description: 'Electric 2-wheeler OEM — Simple One + Simple Dot One scooters. Founded 2019. Shoolagiri TN factory.' },
    facility: { company_name: 'Simple Energy Private Limited', unit_name: 'Shoolagiri Plant', address: 'Shoolagiri, Krishnagiri district, Tamil Nadu, India', city: 'Shoolagiri', state: 'Tamil Nadu', notes: 'Electric scooter OEM + in-house pack assembly. ₹85.6M raised. CIN pending public confirmation.' },
    directors: [{ name: 'Suhas Rajkumar', title: 'Founder & CEO' }, { name: 'Shreshth Mishra', title: 'Co-Founder' }, { name: 'Ankit Gupta', title: 'Co-Founder' }],
  },
];

for (const e of ENTRIES) {
  let parentId = null;
  if (e.company.parent_slug) {
    const { data: p } = await sb.from('companies').select('id').eq('slug', e.company.parent_slug).maybeSingle();
    parentId = p?.id ?? null;
  }
  const companyId = await upsertCompany({
    slug: e.company.slug, legal_name: e.company.legal_name, trade_name: e.company.trade_name ?? null,
    parent_company_id: parentId, is_group_holding: false,
    cin: e.company.cin ?? null, website: e.company.website,
    registered_address: e.company.registered_address, registered_state: e.company.registered_state,
    description: e.company.description,
  });

  const contacts = e.directors.map(d => ({
    name: d.name, title: d.title, department: d.department ?? null,
    email: d.email ?? null, phone: d.phone ?? null,
    source: d.source ?? (d.email || d.phone ? (e.company.website ? new URL(e.company.website).host : MCA) : MCA),
    first_seen: TODAY,
  }));

  const url = e.company.website;
  const host = url ? new URL(url).host : null;

  const r = await upsertRecycler({
    recycler_code: e.code,
    company_name: e.facility.company_name,
    contact_person: e.directors[0]?.name ? `${e.directors[0].name} (${e.directors[0].title})` : 'Corporate Contact',
    email: `${e.code.toLowerCase()}@placeholder.in`,
    phone: null, website: url,
    address: e.facility.address, city: e.facility.city, state: e.facility.state,
    waste_type: e.waste_type, service_radius_km: 500,
    is_active: true, is_verified: false,
    notes: e.facility.notes,
    company_id: companyId, unit_name: e.facility.unit_name,
    contacts_all: contacts,
    websites_all: url ? [{ url, source: host ?? MCA, first_seen: TODAY }] : [],
  });
  console.log(`${r.op.padEnd(8)} ${e.code.padEnd(14)} ${e.company.legal_name.slice(0, 55)}`);
}
console.log('\nDone.');
