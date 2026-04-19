#!/usr/bin/env node
/**
 * Second batch of EV OEMs + battery pack / cell / CAM / swap operators.
 * 12 more companies — public-filings-sourced.
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
  // ── EV OEMs (tier 2) ──────────────────────────────────────────────
  {
    code: 'EVOEM-AP-001', waste_type: 'ev-oem',
    company: { slug: 'kia-india-pvt-ltd', legal_name: 'Kia India Private Limited', cin: 'U29309AP2017FTC105878', website: 'https://www.kia.com/in', registered_address: 'NH-44, Sy.No.151-2, Erramanchi, Penukonda Mandal, Anantapur, Andhra Pradesh, India', registered_state: 'Andhra Pradesh', description: 'Kia Corporation (Korea) subsidiary. EV portfolio: EV6, EV9, Niro EV, Carens EV coming. Anantapur plant (AP).' },
    facility: { company_name: 'Kia India Private Limited', unit_name: 'Anantapur Plant', address: 'NH-44, Sy.No.151-2, Erramanchi, Penukonda Mandal, Anantapur, Andhra Pradesh – 515164, India', city: 'Anantapur', state: 'Andhra Pradesh', notes: 'EV + ICE assembly. EV pack imported / integrated. Source of service/warranty EOL packs.' },
    directors: [{ name: 'Hee Young Mun', title: 'Director' }, { name: 'Gwang Gu Lee', title: 'Director' }, { name: 'Seung Jun Kim', title: 'Director' }, { name: 'Woo Jeong Joo', title: 'Director' }, { name: 'Sureshbabu Potturi Venkata', title: 'Company Secretary' }, { name: null, title: 'Legal Secretariat', department: null, email: 'legalsec@kiaindia.net', phone: null }],
  },
  {
    code: 'EVOEM-MH-003', waste_type: 'ev-oem',
    company: { slug: 'mercedes-benz-india', legal_name: 'Mercedes-Benz India Private Limited', cin: 'U34102PN1994PTC083160', website: 'https://www.mercedes-benz.co.in', registered_address: 'E-3, MIDC Chakan, Phase III, Chakan Industrial Area, Kuruli & Nighoje, Khed, Pune, Maharashtra – 410501, India', registered_state: 'Maharashtra', description: 'Mercedes-Benz Group subsidiary. EV portfolio: EQS, EQE, EQB, EQS SUV. 100-acre Chakan plant, incl. Li-ion assembly line.' },
    facility: { company_name: 'Mercedes-Benz India Private Limited', unit_name: 'Chakan Plant + Li-ion Line', address: 'E-3, MIDC Chakan, Phase III, Kuruli & Nighoje, Khed, Pune, Maharashtra – 410501, India', city: 'Pune', state: 'Maharashtra', notes: 'India\'s first luxury OEM to assemble EV packs locally. Chakan plant incl. EQS pack line. Source of production scrap + warranty packs.' },
    directors: [{ name: 'Santosh Iyer', title: 'Managing Director & CEO' }, { name: 'Amit Atre', title: 'Company Secretary', email: 'amit.atre@daimler.com' }, { name: null, title: 'General', department: null, email: 'amit.atre@daimler.com', phone: '+91 20 2135 67300' }],
  },
  {
    code: 'EVOEM-DL-002', waste_type: 'ev-oem',
    company: { slug: 'revolt-intellicorp-pvt-ltd', legal_name: 'Revolt Intellicorp Private Limited', cin: 'U34203DL2017PTC420572', website: 'https://www.revoltmotors.com', registered_address: '5th Floor, Tower-B, Worldmark 1, Aerocity, New Delhi – 110037, India', registered_state: 'Delhi', description: 'Founded by Rahul Sharma (Micromax). Electric motorcycles (RV400). Part of RattanIndia Enterprises. Gurugram operations.' },
    facility: { company_name: 'Revolt Intellicorp Private Limited', unit_name: 'Manesar Plant', address: 'Plot No. 40, Sector-3, IMT Manesar, Gurugram, Haryana – 122050, India', city: 'Gurugram', state: 'Haryana', notes: 'Electric motorcycle + pack assembly. Production scrap + EOL pack source.' },
    directors: [{ name: 'Sandeep Kumar', title: 'Director' }, { name: 'Amit Jain', title: 'Director' }, { name: 'Vaibhav Poonia', title: 'Director' }, { name: 'Rahul Mutreja', title: 'Director' }],
  },
  {
    code: 'EVOEM-TN-004', waste_type: 'ev-oem',
    company: { slug: 'greaves-electric-mobility', legal_name: 'Greaves Electric Mobility Private Limited', cin: 'U51900TN2008PTC151470', website: 'https://greaveselectricmobility.com', registered_address: 'Plot No. 72, Ranipet Industrial Park, Ranipet, Tamil Nadu, India', registered_state: 'Tamil Nadu', description: 'Greaves Cotton subsidiary. Brands: Ampere (electric scooters), ELE commercial. Ranipet (main) + Coimbatore plants.' },
    facility: { company_name: 'Greaves Electric Mobility Private Limited', unit_name: 'Ranipet Plant (Ampere)', address: 'Plot No. 72, Ranipet Industrial Park, Ranipet, Tamil Nadu, India', city: 'Ranipet', state: 'Tamil Nadu', notes: 'Ampere electric scooter + pack assembly. Also Coimbatore facility. Scrap + EOL source.' },
    directors: [{ name: 'Nagesh Basavanhalli', title: 'Managing Director' }, { name: 'Karan Thapar', title: 'Chairman' }, { name: 'Chandrasekar Thyagarajan', title: 'Director' }, { name: 'Vijayamahantesh Khannur', title: 'Director' }, { name: 'Kunnakavil Vijaya Kumar', title: 'Director' }, { name: 'Raja Venkataraman', title: 'Director' }, { name: 'Venkataramani Sumantran', title: 'Director' }, { name: 'Jayanthi Yeshwant Kumar', title: 'Director' }, { name: 'Tevilyan Yudhistira Rusli', title: 'Director' }],
  },
  {
    code: 'EVOEM-TS-001', waste_type: 'ev-oem',
    company: { slug: 'olectra-greentech-limited', legal_name: 'Olectra Greentech Limited', cin: 'L34100TG2000PLC035451', website: 'https://www.olectra.com', registered_address: 'S-22, 3rd Floor, Technocrat Industrial Estate, Balanagar, Hyderabad, Telangana – 500037, India', registered_state: 'Telangana', description: 'BSE/NSE-listed. Megha Engineering Infrastructures Ltd (MEIL) group. EV bus + truck + composite polymer insulators. JV with BYD.' },
    facility: { company_name: 'Olectra Greentech Limited', unit_name: 'Hyderabad EV Bus Plant', address: 'Seetharampur Village, Cherial Road, Pashamylaram, Sangareddy District, Telangana, India', city: 'Sangareddy', state: 'Telangana', notes: 'Electric bus + truck assembly. Major pack integrator for public-transit fleets. Source of warranty + post-service packs.' },
    directors: [{ name: 'Hanuman Prasad Paritala', title: 'Chairman' }, { name: 'Sharat Chandra Bolusani', title: 'Director' }, { name: 'Boppudi Apparao', title: 'Director' }, { name: 'Gopala Krishna Muddusetty', title: 'Director' }, { name: 'Venkateswara Pradeep Karumuru', title: 'Director' }, { name: 'Rajesh Reddy Peketi', title: 'Director' }, { name: 'Laksmi Kumari Chintalapudi', title: 'Director' }],
  },

  // ── Battery pack + cell makers (tier 2) ───────────────────────────
  {
    code: 'CELL-KA-002', waste_type: 'cell-maker',
    company: { slug: 'exide-energy-solutions-limited', legal_name: 'Exide Energy Solutions Limited', cin: 'U31100WB2022PLC252459', website: 'https://www.exideenergy.in', registered_address: '59E Chowringhee Road, Kolkata, West Bengal – 700020, India', registered_state: 'West Bengal', description: '100% subsidiary of Exide Industries Ltd (parent). 12 GWh Li-ion cell gigafactory at Bengaluru (Phase I 6 GWh, Phase II 6 GWh). Commercial production FY26-end.', parent_slug: 'exide-industries-limited' },
    facility: { company_name: 'Exide Energy Solutions Limited', unit_name: 'Bengaluru Li-ion Gigafactory', address: 'Haraluru Road, near Bengaluru, Karnataka, India', city: 'Bengaluru', state: 'Karnataka', notes: '6 GWh Phase-1 Li-ion (NMC) cell manufacturing, commercial from end-FY26. Major future CAM + metal-salts buyer.' },
    directors: [{ name: 'Rajan Beharilal Raheja', title: 'Director' }, { name: 'Asish Kumar Mukherjee', title: 'Director' }, { name: 'Avik Kumar Roy', title: 'Director' }],
  },
  {
    code: 'CELL-KA-003', waste_type: 'cell-maker',
    company: { slug: 'rajesh-exports-limited', legal_name: 'Rajesh Exports Limited', cin: 'L36911KA1995PLC017077', website: 'https://www.rajeshindia.com', registered_address: 'No. 4, Batavia Chambers, Kumara Krupa Road, Kumara Park East, Bengaluru, Karnataka – 560001, India', registered_state: 'Karnataka', description: 'BSE/NSE-listed gold refiner. ACC PLI winner (5 GWh Li-ion cell factory in Karnataka via wholly-owned subsidiary "ACC Energy Storage Pvt Ltd"). Tripartite MoU with MHI + Karnataka Govt signed Jan 2023.' },
    facility: { company_name: 'Rajesh Exports Limited', unit_name: 'Karnataka 5 GWh Li-ion Plant (Planned)', address: 'Karnataka, India (exact site TBD)', city: null, state: 'Karnataka', notes: 'ACC PLI beneficiary — 5 GWh Li-ion cell facility via subsidiary ACC Energy Storage. Planning stage 2026. Future CAM + salts buyer.' },
    directors: [{ name: 'Rajesh Jaswanth Rai Mehta', title: 'Executive Chairman' }, { name: 'Suresh Kumar', title: 'Managing Director' }, { name: 'Asha Mehta', title: 'Independent Director' }, { name: 'Prashant Harjivandas Sagar', title: 'Independent Director' }, { name: 'Vijaya Lakshmi', title: 'Director' }, { name: 'Vijendra Rao', title: 'Director' }, { name: 'Joseph Devassy Thattakath', title: 'Director' }],
  },
  {
    code: 'BPACK-MH-001', waste_type: 'battery-pack',
    company: { slug: 'waaree-energies-limited', legal_name: 'Waaree Energies Limited', cin: 'L29248MH1990PLC059463', website: 'https://waaree.com', registered_address: '602, 6th Floor, Western Edge - I, Western Express Highway, Borivali (East), Mumbai, Maharashtra – 400066, India', registered_state: 'Maharashtra', description: 'BSE/NSE-listed clean-energy major. 5.4 GW solar cell gigafactory (Chikhli GJ) + Li-ion via Waaree Technologies Ltd (battery packs + ESS). IPO 2024.' },
    facility: { company_name: 'Waaree Energies Limited', unit_name: 'Mumbai HQ + Waaree Tech Li-ion', address: '602, 6th Floor, Western Edge - I, Western Express Highway, Borivali (East), Mumbai – 400066, India', city: 'Mumbai', state: 'Maharashtra', notes: 'Solar + Li-ion battery packs + ESS. Production scrap + CAM buyer for Li-ion line.' },
    directors: [{ name: 'Hitesh Chimanlal Doshi', title: 'Chairman & Managing Director' }, { name: 'Viren Doshi Chimanlal', title: 'Director' }, { name: 'Rajesh Ghanshyam Gaur', title: 'Director' }, { name: 'Jayesh Dhirajlal Shah', title: 'Director' }, { name: 'Hitesh Pranjivan Mehta', title: 'Director' }, { name: 'Sujit Kumar Varma', title: 'Director' }, { name: 'Rajender Mohan Malla', title: 'Independent Director' }, { name: 'Arvind Ananthanarayanan', title: 'Independent Director' }, { name: 'Amit Ashok Paithankar', title: 'Independent Director' }, { name: 'Richa Manoj Goyal', title: 'Independent Director' }],
  },
  {
    code: 'CELL-MH-001', waste_type: 'cell-maker',
    company: { slug: 'jsw-neo-energy-battery', legal_name: 'JSW Neo Energy (Battery Arm)', cin: null, website: 'https://www.jsw.in/energy', registered_address: 'JSW Centre, Bandra Kurla Complex, Bandra (East), Mumbai, Maharashtra – 400051, India', registered_state: 'Maharashtra', description: 'JSW Group\'s renewable + battery arm. 50 GWh Li-ion battery manufacturing capacity planned by 2028-30. Bid for ACC PLI 10 GWh. Rs 25,000 Cr Nagpur Li-ion initiative via JSW Energy PSP Eleven Ltd. Also Rs 40,000 Cr EV+battery plan moved from Odisha to Maharashtra.' },
    facility: { company_name: 'JSW Neo Energy Battery Arm', unit_name: 'Nagpur Li-ion Giga (Planned)', address: 'Nagpur, Maharashtra, India (exact site TBD)', city: 'Nagpur', state: 'Maharashtra', notes: 'Planning-stage 50 GWh gigafactory (by 2030). Largest pipeline bet in JSW\'s EV + battery play. Future CAM + salts buyer.' },
    directors: [{ name: 'Sajjan Jindal', title: 'Chairman (JSW Group)' }, { name: 'Prashant Jain', title: 'Joint MD & CEO (JSW Energy)' }],
  },
  {
    code: 'CAM-KA-001', waste_type: 'cell-maker',
    company: { slug: 'epsilon-advanced-materials', legal_name: 'Epsilon Advanced Materials Private Limited', cin: 'U24110MH2014PTC258718', website: 'https://www.epsilonam.com', registered_address: 'Plot No. 46, Upadrasta House, Dr. V.B. Gandhi Marg, Kala Ghoda, Fort, Mumbai, Maharashtra – 400001, India', registered_state: 'Maharashtra', description: 'Graphite anode + LFP cathode battery materials. Epsilon Group commit: INR 15,350 Cr Karnataka CAM + testing facility. CAM plant at Bellari, 100 kt target by 2030. Anode plant at Vijayanagar. Part of JSW Group ecosystem.' },
    facility: { company_name: 'Epsilon Advanced Materials Pvt Ltd', unit_name: 'Bellari CAM + Vijayanagar Anode', address: 'Vijayanagar + Bellari, Karnataka, India', city: 'Bellari', state: 'Karnataka', notes: 'Anode material customer-qualification line (Vijayanagar) + CAM plant (Bellari). India\'s flagship indigenous CAM producer — critical buyer of recycled nickel/cobalt/manganese salts + Li2CO3.' },
    directors: [{ name: 'Vikram Handa', title: 'Managing Director' }, { name: 'Sunit Kapur', title: 'CEO — Epsilon Advanced Materials Inc' }, { name: 'Sagar Mitra', title: 'Director' }, { name: 'Vinod Nowal', title: 'Director' }, { name: 'Rakesh Bhartia', title: 'Director' }, { name: 'Natarajan Chinnasamy', title: 'Director' }, { name: 'Anil Srivastava', title: 'Director' }, { name: 'Pooja Abhijit Mandave', title: 'Director' }, { name: 'Radhika Madhukar Dudhat', title: 'Director' }],
  },
  {
    code: 'CAM-WB-001', waste_type: 'cell-maker',
    company: { slug: 'himadri-speciality-chemical', legal_name: 'Himadri Speciality Chemical Limited', cin: 'L27106WB1987PLC042756', website: 'https://www.himadri.com', registered_address: '23A, Netaji Subhas Road, 8th Floor, Suite No. 15, Kolkata, West Bengal – 700001, India', registered_state: 'West Bengal', description: 'BSE/NSE-listed. Pioneer Li-ion anode material producer in India. Also LFP cathode + coal tar pitch + carbon black. Plants in WB + other states.' },
    facility: { company_name: 'Himadri Speciality Chemical Limited', unit_name: 'Kolkata HQ + Anode + LFP Plants', address: '23A, Netaji Subhas Road, 8th Floor, Kolkata, West Bengal – 700001, India', city: 'Kolkata', state: 'West Bengal', notes: 'Anode (graphite) + LFP cathode materials. Already recycling-focused. Direct buyer of recycled raw material feedstock.' },
    directors: [{ name: 'Anurag Choudhary', title: 'Chairman & Managing Director' }, { name: 'Girish Vanvari', title: 'Independent Director' }, { name: 'Amitabh Srivastava', title: 'Independent Director' }, { name: 'Gopal Ajay Malpani', title: 'Director' }, { name: 'Rita Bhattacharya', title: 'Independent Director' }, { name: null, title: 'Business Development', department: null, email: 'monika@himadri.com', phone: null }, { name: null, title: 'General', department: null, email: 'blsharma@himadri.com', phone: null }],
  },
  {
    code: 'BPACK-DL-001', waste_type: 'battery-pack',
    company: { slug: 'upgrid-solutions-battery-smart', legal_name: 'UPGRID Solutions Private Limited', trade_name: 'Battery Smart', cin: 'U31904DL2019PTC357706', website: 'https://www.batterysmart.in', registered_address: 'New Delhi, India', registered_state: 'Delhi', description: 'India\'s largest battery-swapping network for 2/3-wheeler EVs (Battery Smart brand). Founded 2019 by Pulkit Khurana + Siddharth Sikka. Owns + services battery packs at swap stations. Sister entity UPGRID Electrilease Pvt Ltd (CIN U71290DL2021PTC390888).' },
    facility: { company_name: 'UPGRID Solutions Private Limited (Battery Smart)', unit_name: 'Gurugram Operations HQ', address: 'Gurugram, Haryana, India', city: 'Gurugram', state: 'Haryana', notes: 'Battery-swapping network operator. Owns thousands of Li-ion packs in rotation — enormous future EOL pack source. Direct buyer of refurbished cells.' },
    directors: [{ name: 'Pulkit Khurana', title: 'Co-Founder' }, { name: 'Siddharth Sikka', title: 'Co-Founder' }, { name: 'Tejasav Khattar', title: 'Ops', email: 'tejasav.khattar@batterysmart.in' }],
  },
];

for (const e of ENTRIES) {
  // Handle parent_company_id for subsidiaries (e.g. Exide Energy Solutions → Exide Industries)
  let parentId = null;
  if (e.company.parent_slug) {
    const { data: p } = await sb.from('companies').select('id').eq('slug', e.company.parent_slug).maybeSingle();
    parentId = p?.id ?? null;
  }
  const companyId = await upsertCompany({
    slug: e.company.slug,
    legal_name: e.company.legal_name,
    trade_name: e.company.trade_name ?? null,
    parent_company_id: parentId,
    is_group_holding: false,
    cin: e.company.cin ?? null,
    website: e.company.website,
    registered_address: e.company.registered_address,
    registered_state: e.company.registered_state,
    description: e.company.description,
  });

  const contacts = e.directors.map(d => ({
    name: d.name, title: d.title, department: d.department ?? null,
    email: d.email ?? null, phone: d.phone ?? null,
    source: d.email || d.phone ? (e.company.website ? new URL(e.company.website).host : MCA) : MCA,
    first_seen: TODAY,
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
  console.log(`${r.op.padEnd(8)} ${e.code.padEnd(14)} ${e.company.legal_name.slice(0, 55)}${parentId ? ' (subsidiary)' : ''}`);
}

console.log('\nDone.');
