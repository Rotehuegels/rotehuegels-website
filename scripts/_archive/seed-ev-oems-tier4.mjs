#!/usr/bin/env node
/**
 * Tier-4 EV/battery-chain seed — 12 more companies.
 * Also links Tata AutoComp Gotion + Okaya EV as subsidiaries of
 * their parent entities for a proper OrgChart.
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
  // ── EV OEMs (tier-4) ──────────────────────────────────────────────
  {
    code: 'EVOEM-MH-004', waste_type: 'ev-oem',
    company: { slug: 'skoda-auto-volkswagen-india', legal_name: 'Skoda Auto Volkswagen India Private Limited', cin: 'U70102PN2007FTC133117', website: 'https://www.skoda-auto.co.in', registered_address: 'E-1, MIDC Industrial Area Phase III, Village Nigoje, Mhalunge Kharabwadi, Chakan, Pune, Maharashtra – 410501, India', registered_state: 'Maharashtra', description: 'Volkswagen Group India unified entity — Skoda + VW + Audi + Porsche India. EV portfolio: Enyaq iV (Skoda), ID.4, Taigun EV, Audi Q8 e-tron. Chakan Pune plant.' },
    facility: { company_name: 'Skoda Auto Volkswagen India Private Limited', unit_name: 'Chakan Plant (Skoda + VW + Audi)', address: 'E-1, MIDC Industrial Area Phase III, Village Nigoje, Mhalunge Kharabwadi, Chakan, Pune, Maharashtra – 410501, India', city: 'Chakan', state: 'Maharashtra', notes: 'CKD assembly of multiple VW Group EVs. Pack integration + service + warranty returns.' },
    directors: [{ name: 'Piyush Shailendra Arora', title: 'Managing Director & CEO' }, { name: 'Sachin Arvindrao Kulkarni', title: 'Director' }, { name: 'Nalin Nirmal Jain', title: 'Director' }, { name: 'Jan Bures', title: 'Director' }, { name: 'Vallari Kedar Gupte', title: 'Director' }, { name: 'Jiri Masin', title: 'Director' }, { name: 'Stepan Lacina', title: 'Director' }],
  },
  {
    code: 'EVOEM-HR-003', waste_type: 'ev-oem',
    company: { slug: 'volvo-auto-india', legal_name: 'Volvo Auto India Private Limited', cin: 'U74140HR2009FTC039243', website: 'https://www.volvocars.com/in', registered_address: 'First Floor, Tower A, DLF Cyber Park, 405-B, Sector 20, Udyog Vihar Phase III, Gurugram, Haryana – 122016, India', registered_state: 'Haryana', description: 'Volvo Cars India (passenger car + EV). EV portfolio: XC40 Recharge, C40 Recharge, EX30, EX90.' },
    facility: { company_name: 'Volvo Auto India Private Limited', unit_name: 'Gurugram HQ (Sales + Aftermarket)', address: 'First Floor, Tower A, DLF Cyber Park, 405-B, Sector 20, Udyog Vihar Phase III, Gurugram, Haryana – 122016, India', city: 'Gurugram', state: 'Haryana', notes: 'CBU/CKD imports + local service network. Source of warranty + service EOL packs.' },
    directors: [{ name: 'Jyoti Malhotra', title: 'Managing Director' }, { name: 'Pernilla Maria Heidenvall', title: 'Director' }, { name: 'Carl Oscar Bertilsson Olsborg', title: 'Director' }],
  },
  {
    code: 'EVOEM-HR-004', waste_type: 'ev-oem',
    company: { slug: 'jsw-mg-motor-india', legal_name: 'JSW MG Motor India Private Limited', cin: 'U34100HR2017FTC072429', website: 'https://www.mgmotor.co.in', registered_address: '10th Floor, Milestone Experion Centre, Sector-15 Part II, Gurugram, Haryana – 122001, India', registered_state: 'Haryana', description: 'SAIC Motor + JSW Group JV (from Nov 2023). SAIC 49%, JSW Group 35%, IndoEdge 8%, dealers+ESOP 8%. EV portfolio: ZS EV, Comet EV, Windsor EV, Cyberster. Halol GJ plant (80k/yr).' },
    facility: { company_name: 'JSW MG Motor India Private Limited', unit_name: 'Halol Plant (JV)', address: 'Halol, Panchmahals, Gujarat – 389351, India', city: 'Halol', state: 'Gujarat', notes: 'Halol plant (ex-GM India). EV assembly + local pack integration. Cyberster + Windsor EV assembly. JV structure since Nov 2023.' },
    directors: [{ name: 'Sajjan Jindal', title: 'Chairman (JSW)' }, { name: 'Parth Sajjan Jindal', title: 'Director' }, { name: 'Anurag Mehrotra', title: 'Managing Director' }, { name: 'Dhanpal Arvind Jhaveri', title: 'Director' }, { name: 'De Yu', title: 'Director (SAIC)' }, { name: 'Zuoping Yao', title: 'Director (SAIC)' }],
  },

  // ── Battery pack / Cell / CAM (tier-4) ────────────────────────────
  {
    code: 'BPACK-MH-002', waste_type: 'battery-pack',
    company: { slug: 'tata-autocomp-systems', legal_name: 'Tata AutoComp Systems Limited', cin: 'U34100PN1995PLC158999', website: 'https://www.tataautocomp.com', registered_address: 'TACO House, Plot No. 20/B FPN085, V.G. Damle Path, Off Law College Road, Erandwane, Pune, Maharashtra – 411004, India', registered_state: 'Maharashtra', description: 'Tata Group auto-component major. Tata Green Batteries (lead-acid), Tata AutoComp Gotion (Li-ion JV with Gotion China), EV pack assembly for Tata + others.' },
    facility: { company_name: 'Tata AutoComp Systems Limited', unit_name: 'Pune HQ + Battery Division', address: 'TACO House, Plot No. 20/B FPN085, V.G. Damle Path, Off Law College Road, Erandwane, Pune, Maharashtra – 411004, India', city: 'Pune', state: 'Maharashtra', notes: 'Parent entity — Tata Green Batteries + Tata AutoComp Gotion Li-ion JV. Multi-plant operations in Pune + Pantnagar + Dharwad.' },
    directors: [{ name: 'Arvind Hari Goel', title: 'Managing Director' }, { name: 'Manoj Rajendra Kolhatkar', title: 'Director' }, { name: 'Thierry Yves Henri Bollore', title: 'Director' }, { name: 'Milind Madhav Shahane', title: 'Director' }, { name: 'Ankur Verma', title: 'Director' }],
  },
  {
    code: 'CELL-MH-002', waste_type: 'cell-maker',
    company: { slug: 'tata-autocomp-gotion', legal_name: 'Tata AutoComp Gotion Green Energy Solutions Private Limited', cin: 'U29304PN2020PTC190510', website: 'https://www.tataautocomp.com', registered_address: 'TACO House, Plot No. 20/B FPN085, V.G. Damle Path, Off Law College Road, Erandwane, Pune, Maharashtra – 411004, India', registered_state: 'Maharashtra', description: 'JV between Tata AutoComp Systems + Gotion High-Tech (China). Li-ion pack + cell assembly. Established 2020.', parent_slug: 'tata-autocomp-systems' },
    facility: { company_name: 'Tata AutoComp Gotion Green Energy Solutions Pvt Ltd', unit_name: 'Pune Li-ion Pack Assembly (JV)', address: 'Chakan Industrial Area, Pune, Maharashtra, India', city: 'Pune', state: 'Maharashtra', notes: 'Tata + Gotion Li-ion JV — pack assembly for Tata passenger EVs + 3rd-party customers. ajinkya.dharangaonkar@tataautocomp.com.' },
    directors: [{ name: 'Ravi Narayana Chidambar', title: 'Director' }, { name: 'Fei Hou', title: 'Director (Gotion)' }, { name: 'Chen Li', title: 'Director (Gotion)' }, { name: 'Arvind Hari Goel', title: 'Director (Tata)' }, { name: 'Ajit Jindal', title: 'Director' }, { name: null, title: 'General', department: null, email: 'ajinkya.dharangaonkar@tataautocomp.com', phone: null }],
  },
  {
    code: 'BPACK-HR-001', waste_type: 'battery-pack',
    company: { slug: 'ipower-batteries-pvt-ltd', legal_name: 'iPower Batteries Private Limited', cin: 'U74999DL2019PTC359433', website: 'https://ipowerbatteries.in', registered_address: 'M-6, Office Balram House, Karampura, West Delhi, Delhi – 110015, India', registered_state: 'Delhi', description: 'Li-ion battery manufacturer — e-bike, e-rickshaw, e-scooter packs + home/office ESS. Delhi-registered, Kundli HR plant.' },
    facility: { company_name: 'iPower Batteries Private Limited', unit_name: 'Kundli Plant', address: 'Kundli Industrial Area, Haryana, India', city: 'Kundli', state: 'Haryana', notes: 'Li-ion pack assembly for 2/3-wheeler EVs + residential ESS. Aggarwal family-owned.' },
    directors: [{ name: 'Vikas Aggarwal', title: 'Director' }, { name: 'Chhavi Aggarwal', title: 'Director' }, { name: 'Abhay Aggarwal', title: 'Director' }],
  },
  {
    code: 'BPACK-DL-002', waste_type: 'battery-pack',
    company: { slug: 'okaya-power-pvt-ltd', legal_name: 'Okaya Power Private Limited', cin: 'U74899DL1987PTC028737', website: 'https://www.okayapower.com', registered_address: 'H-19, Udyog Nagar, Rohtak Road, New Delhi – 110041, India', registered_state: 'Delhi', description: 'Okaya Group flagship — lead-acid + Li-ion inverter batteries + EV charging + EV division (Okaya EV). Multiple plants in Baddi HP + Haryana.' },
    facility: { company_name: 'Okaya Power Private Limited', unit_name: 'Delhi HQ + Baddi Plants', address: 'H-19, Udyog Nagar, Rohtak Road, New Delhi – 110041, India', city: 'New Delhi', state: 'Delhi', notes: 'Parent entity. Lead-acid + Li-ion batteries + EV chargers + EV scooter subsidiary (Okaya EV Pvt Ltd). Anil Gupta founder.' },
    directors: [{ name: 'Anil Gupta', title: 'Managing Director & Founder' }, { name: 'Naresh Kumar Singhal', title: 'Director' }, { name: 'Arush Gupta', title: 'Director' }, { name: 'Anshul Gupta', title: 'Director' }, { name: 'Saurabh Gupta', title: 'Director' }, { name: 'Rajesh Harishankar Bansal', title: 'Director' }],
  },
  {
    code: 'EVOEM-DL-004', waste_type: 'ev-oem',
    company: { slug: 'okaya-ev-pvt-ltd', legal_name: 'Okaya EV Private Limited', cin: 'U31909DL2020PTC363609', website: 'https://www.okayaev.com', registered_address: 'H-19, Udyog Nagar, Rohtak Road, New Delhi – 110041, India', registered_state: 'Delhi', description: 'Okaya Power subsidiary — electric scooters + Li-ion pack assembly. Baddi HP plant.', parent_slug: 'okaya-power-pvt-ltd' },
    facility: { company_name: 'Okaya EV Private Limited', unit_name: 'Baddi Scooter + Pack Plant', address: 'Baddi, Solan, Himachal Pradesh, India', city: 'Baddi', state: 'Himachal Pradesh', notes: 'Electric scooter + pack assembly under Okaya brand.' },
    directors: [{ name: 'Anshul Gupta', title: 'Director' }, { name: 'Arush Gupta', title: 'Director' }],
  },
  {
    code: 'CELL-TN-002', waste_type: 'cell-maker',
    company: { slug: 'panasonic-carbon-india', legal_name: 'Panasonic Carbon India Co. Limited', cin: 'L29142TN1982PLC009560', website: 'https://www.panasoniccarbon.in', registered_address: 'Pottipati Plaza, 77 Nungambakkam High Road, Third Floor, Nungambakkam, Chennai, Tamil Nadu – 600034, India', registered_state: 'Tamil Nadu', description: 'BSE-listed. Panasonic Corporation India subsidiary. Carbon electrode + anode material manufacturer — precursor for Li-ion anodes and graphite.' },
    facility: { company_name: 'Panasonic Carbon India Co. Limited', unit_name: 'Chennai Plant + Anode Material', address: 'Pottipati Plaza, 77 Nungambakkam High Road, Third Floor, Nungambakkam, Chennai, Tamil Nadu – 600034, India', city: 'Chennai', state: 'Tamil Nadu', notes: 'Carbon-based electrode + anode precursor material. Listed entity. info@panasoniccarbon.in, +91 44 28275216/226.' },
    directors: [{ name: 'Akinori Isomura', title: 'Managing Director' }, { name: 'Hidefumi Fujii', title: 'Director' }, { name: 'Subramanian Meenakshi Vinayagam', title: 'Independent Director' }, { name: 'Subramanian Kalyanaraman', title: 'Director' }, { name: 'Shiva Prasad Padhy', title: 'Director' }, { name: 'Kola Paul Jayakar', title: 'Director' }, { name: 'Rajashree Santhanam', title: 'Director' }, { name: 'Ramaiah Senthilkumar', title: 'Company Secretary', email: 'cs.pcin@outlook.com' }, { name: null, title: 'General', department: null, email: 'info@panasoniccarbon.in', phone: '+91 44 28275216' }],
  },
  {
    code: 'BPACK-TN-001', waste_type: 'battery-pack',
    company: { slug: 'delta-electronics-india', legal_name: 'Delta Electronics India Private Limited', cin: 'U32109TN2008FTC120482', website: 'https://deltaelectronicsindia.com', registered_address: 'Rudraksh, Survey No. 96/1, Plot No. 32A, Mutharam, Sompeta Village, Hosur-Krishnagiri Road, Krishnagiri, Tamil Nadu – 635115, India', registered_state: 'Tamil Nadu', description: 'Delta Electronics Taiwan subsidiary. Power electronics + EV charging infrastructure + inverters + BMS. Krishnagiri TN plant.' },
    facility: { company_name: 'Delta Electronics India Private Limited', unit_name: 'Krishnagiri Plant', address: 'Rudraksh, Survey No. 96/1, Plot No. 32A, Mutharam, Sompeta Village, Hosur-Krishnagiri Road, Krishnagiri, Tamil Nadu – 635115, India', city: 'Krishnagiri', state: 'Tamil Nadu', notes: 'EV chargers + BMS + power electronics. Major ancillary supplier to OEMs. Source of PCB + Li-ion-related scrap.' },
    directors: [{ name: 'Om Prakash Ramamurthy', title: 'Managing Director' }, { name: 'Nipaporn Jiarajareevoong', title: 'Director' }, { name: 'Lin Cheng Pin', title: 'Director' }, { name: 'Sanjay Gupta', title: 'Director' }],
  },
  {
    code: 'CELL-TG-001', waste_type: 'cell-maker',
    company: { slug: 'bgr-mining-infra', legal_name: 'BGR Mining & Infra Limited', cin: 'U45400TG2011PLC115896', website: 'https://www.bgrmining.com', registered_address: 'Plot No. 8-2-596/R, Road No. 10, Banjara Hills, Hyderabad, Telangana – 500034, India', registered_state: 'Telangana', description: 'Hyderabad-based mining + infrastructure major. Coal + iron ore + lithium mining contracts. Announced Li-ion + battery material initiatives (2025).' },
    facility: { company_name: 'BGR Mining & Infra Limited', unit_name: 'Hyderabad HQ + Mine Sites', address: 'Plot No. 8-2-596/R, Road No. 10, Banjara Hills, Hyderabad, Telangana – 500034, India', city: 'Hyderabad', state: 'Telangana', notes: 'Mining + infra — coal, iron ore, lithium contract-mining. Future supplier of lithium feedstock + potential recycling customer.' },
    directors: [{ name: 'Sreenivasula Reddy Mallam', title: 'Managing Director' }, { name: 'Umapathyreddy Bathina', title: 'Director' }, { name: 'Sudhakara Reddy Induru', title: 'Director' }, { name: 'Vijayalakshmi Bathina', title: 'Director' }, { name: 'Chandra Sekhara Reddy Punugoti', title: 'Director' }],
  },

  // ── Swap-network operators (tier-4) ──────────────────────────────
  {
    code: 'BPACK-DL-003', waste_type: 'battery-pack',
    company: { slug: 'e-chargeup-solutions-chargeup', legal_name: 'E-Chargeup Solutions Private Limited', trade_name: 'Chargeup', cin: 'U74999DL2019PTC346208', website: 'https://www.echargeup.com', registered_address: 'Kh No. 300/3, First Floor, Village Sultanpur, New Delhi – 110030, India', registered_state: 'Delhi', description: 'Battery-as-a-service for e-rickshaws. Swap network across Delhi NCR + Noida + Gwalior. Founded 2019 by Varun Goenka + Ankur Madan.' },
    facility: { company_name: 'E-Chargeup Solutions Private Limited (Chargeup)', unit_name: 'Delhi HQ + Swap Network', address: 'Kh No. 300/3, First Floor, Village Sultanpur, New Delhi – 110030, India', city: 'New Delhi', state: 'Delhi', notes: 'Swap-as-a-service for commercial 3-wheelers. Thousands of lead-acid + Li-ion packs in rotation. Future EOL source.' },
    directors: [{ name: 'Varun Goenka', title: 'Co-Founder & CEO' }, { name: 'Ankur Madan', title: 'Co-Founder' }, { name: 'Satish Mittal', title: 'Director' }],
  },
  {
    code: 'BPACK-TG-001', waste_type: 'battery-pack',
    company: { slug: 'racenergy-pvt-ltd', legal_name: 'RACEnergy Private Limited', cin: null, website: 'https://www.racenergy.in', registered_address: 'Hyderabad, Telangana, India', registered_state: 'Telangana', description: 'Battery-swap network for 2/3-wheelers. Partnered with HPCL for Hyderabad swap stations. 10,000 sq ft production facility with 50 MWh line (~30,000 packs/yr).' },
    facility: { company_name: 'RACEnergy Private Limited', unit_name: 'Hyderabad Pack Plant + Swap Network', address: 'Hyderabad, Telangana, India', city: 'Hyderabad', state: 'Telangana', notes: 'In-house Li-ion pack assembly (50 MWh/yr). HPCL swap partnership. 30,000 packs/yr production. CIN pending public confirmation.' },
    directors: [{ name: 'Arun Sreyas Reddy', title: 'Co-Founder & CEO' }, { name: 'Gautham Maheswaran', title: 'Co-Founder & CTO' }],
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
  console.log(`${r.op.padEnd(8)} ${e.code.padEnd(14)} ${e.company.legal_name.slice(0, 55)}${parentId ? ' (subsidiary)' : ''}`);
}
console.log('\nDone.');
