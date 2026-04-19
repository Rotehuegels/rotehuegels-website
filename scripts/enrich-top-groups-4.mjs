#!/usr/bin/env node
/**
 * Fourth-tier enrichment — more majors, including the three big
 * primary-metal listed companies (HZL, Hindalco) and Cero/Mahindra MSTC.
 */
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const TODAY = new Date().toISOString().slice(0, 10);
const MCA = 'ZaubaCorp / Tofler / MCA 2026-04-19';
const normEmail = (e) => e?.toLowerCase().trim();
const normPhone = (p) => p?.replace(/\D/g, '').replace(/^91/, '');
const isPlaceholderEmail = (e) => !e || /placeholder|^cpcb\.|^mrai\./i.test(e);

function mergeContacts(existing, rows) {
  const out = [...(existing ?? [])];
  const keys = new Set(out.map(c => [normEmail(c.email), normPhone(c.phone), c.name && `${c.name.toLowerCase()}|${c.source}`].filter(Boolean).join('::')));
  let added = 0;
  for (const c of rows) {
    const k = [normEmail(c.email), normPhone(c.phone), c.name && `${c.name.toLowerCase()}|${c.source}`].filter(Boolean).join('::');
    if (!k || keys.has(k)) continue; keys.add(k); out.push(c); added++;
  }
  return { merged: out, added };
}
function mergeWebsites(existing, rows) {
  const out = [...(existing ?? [])];
  const urls = new Set(out.map(w => (w.url ?? '').toLowerCase()));
  let added = 0;
  for (const w of rows) {
    const u = (w.url ?? '').toLowerCase();
    if (!u || urls.has(u)) continue; urls.add(u); out.push(w); added++;
  }
  return { merged: out, added };
}

const GROUPS = [
  {
    slug: 'mahindra-mstc-recycling-pvt-ltd',
    canonical: 'Mahindra MSTC Recycling Private Limited',
    cin: 'U37100MH2016PTC288535',
    website: 'https://cerorecycling.com',
    registered_address: 'Mahindra Towers, P. K. Kurne Chowk, Worli, Mumbai, Maharashtra – 400018, India',
    registered_state: 'Maharashtra',
    description: 'India\'s first authorised recycler of motor vehicles — JV of Mahindra Accelo + MSTC Ltd (GOI PSU). Brand: Cero. Multiple vehicle-scrapping centres across India.',
    email: null, phone: '1800 267 6000',
    recycler_codes: ['MAJ-UP-001', 'MAJ-MH-001'],
    directors: [
      { name: 'Sumit Issar',                      title: 'Director' },
      { name: 'Vijay Arora',                      title: 'Director' },
      { name: 'Subrata Sarkar',                   title: 'Director' },
      { name: 'Venkata Satya Vijay Kumar Yegireddi', title: 'Director' },
      { name: 'Surinder Kumar Gupta',             title: 'Independent Director' },
      { name: 'Padmanabh Ramchandra Barpande',    title: 'Independent Director' },
      { name: 'Bansh Bahadur Singh',              title: 'Independent Director' },
    ],
  },
  {
    slug: 'hindustan-zinc-limited',
    canonical: 'Hindustan Zinc Limited',
    cin: 'L27204RJ1966PLC001208',
    website: 'https://www.hzlindia.com',
    registered_address: 'Yashad Bhavan, Yashadgarh, Udaipur, Rajasthan – 313004, India',
    registered_state: 'Rajasthan',
    description: 'Vedanta Group company — world\'s 2nd-largest integrated zinc producer. Listed on BSE/NSE. 4 smelter complexes: Chanderiya (lead-zinc), Dariba, Debari, Pantnagar.',
    email: 'hzl.secretarial@vedanta.co.in', phone: '0294 6604000',
    recycler_codes: ['PMP-RJ-001', 'PMP-RJ-002', 'PMP-RJ-003', 'PMP-UK-001'],
    directors: [
      { name: 'Arun Misra',              title: 'CEO & Whole-time Director' },
      { name: 'Sandeep Modi',            title: 'CFO' },
      { name: 'Priya Agarwal',           title: 'Non-Executive Director' },
      { name: 'Navin Agarwal',           title: 'Non-Executive Director' },
      { name: 'Akhilesh Joshi',          title: 'Independent Director' },
      { name: 'Pallavi Joshi Bakhru',    title: 'Independent Director' },
      { name: 'Kannan Ramamirtham',      title: 'Independent Director' },
      { name: 'Nirupama Kotru',          title: 'Nominee Director (GoI)' },
      { name: 'Harsha Vishal Kedia',     title: 'Independent Director' },
      { name: 'Veena Kumari Dermal',     title: 'Independent Director' },
    ],
  },
  {
    slug: 'hindalco-industries-limited',
    canonical: 'Hindalco Industries Limited',
    cin: 'L27020MH1958PLC011238',
    website: 'https://www.hindalco.com',
    registered_address: 'Century Bhavan, 3rd Floor, Dr. Annie Besant Road, Worli, Mumbai, Maharashtra – 400030, India',
    registered_state: 'Maharashtra',
    description: 'Aditya Birla Group flagship — integrated aluminium + copper major. Incorporated 1958, BSE/NSE-listed. Novelis subsidiary for global rolled products. Plants at Renukoot, Mahan, Aditya, Birla Copper (Dahej).',
    email: 'geetika.anand@adityabirla.com', phone: null,
    recycler_codes: ['PMP-OR-001', 'PMP-GJ-001', 'PMP-UP-001', 'PMP-MP-001'],
    directors: [
      { name: 'Kumar Mangalam Birla',      title: 'Chairman' },
      { name: 'Rajashree Birla',           title: 'Non-Executive Director' },
      { name: 'Ananyashree Birla',         title: 'Non-Executive Director' },
      { name: 'Aryaman Vikram Birla',      title: 'Non-Executive Director' },
      { name: 'Satish Pai',                title: 'Managing Director' },
      { name: 'Praveen Kumar Maheshwari',  title: 'CFO & Whole-time Director' },
      { name: 'Geetika Raghunandan Anand', title: 'Company Secretary' },
      { name: 'Anjani Agrawal',            title: 'Independent Director' },
      { name: 'Sushil Agarwal',            title: 'Non-Executive Director' },
      { name: 'Askaran Agarwala',          title: 'Independent Director' },
      { name: 'Kailash Nath Bhandari',     title: 'Independent Director' },
      { name: 'Vikas Balia',               title: 'Independent Director' },
      { name: 'Alka Marezban Bharucha',    title: 'Independent Director' },
      { name: 'Yazdi Dandiwala',           title: 'Independent Director' },
      { name: 'Sudhir Mital',              title: 'Independent Director' },
      { name: 'Anant Maheshwari',          title: 'Independent Director' },
      { name: 'Sukanya Kripalu',           title: 'Independent Director' },
      { name: 'Arun Adhikari Kumar',       title: 'Independent Director' },
    ],
  },
  {
    slug: 'namo-ewaste-management-limited',
    canonical: 'Namo eWaste Management Limited',
    cin: 'L74140DL2014PLC263441',
    website: 'https://namoewaste.com',
    registered_address: 'B-91, Private No. A-6, Basement, Main Road, Kalkaji, South Delhi, New Delhi – 110019, India',
    registered_state: 'Delhi',
    description: 'BSE/NSE-listed (NAMOEWASTE) e-waste management + recycling. Incorporated 2014. Operational at Faridabad Haryana.',
    email: null, phone: null,
    recycler_codes: [], // not in our DB yet — flagged
    directors: [
      { name: 'Sandeep Agarwal',          title: 'Director' },
      { name: 'Parikshit Satish Deshmukh', title: 'Director' },
      { name: 'Saurabh Shashwat',         title: 'Director' },
      { name: 'Rojina Thapa',             title: 'Director' },
      { name: 'Sanjeev Kumar Srivastava', title: 'Director' },
      { name: 'Sarita',                   title: 'Director' },
      { name: 'Akshay Jain',              title: 'Director' },
      { name: 'Ujjwal Kumar',             title: 'Director' },
    ],
  },
  {
    slug: 'remine-india-pvt-ltd',
    canonical: 'Remine India Private Limited',
    cin: null, // not directly captured; needs MCA lookup
    website: null,
    registered_address: 'Eldeco, SIIDCUL Industrial Area, Sitarganj, Udham Singh Nagar, Uttarakhand, India',
    registered_state: 'Uttarakhand',
    description: 'Li-ion battery + e-waste commercial recycler using indigenous technology. TDB-supported project (Mar 2024) — ₹7.5 Cr assistance of ₹15 Cr total. Plant at Sitarganj UK.',
    email: null, phone: null,
    recycler_codes: ['BM-MH-004'],   // will move state to UK via address, but keep code
    directors: [],
  },
  {
    slug: 'greentek-reman-pvt-ltd',
    canonical: 'GreenTek Reman Private Limited',
    cin: null,
    website: 'https://greentekreman.com',
    registered_address: 'Greater Noida, Uttar Pradesh, India',
    registered_state: 'Uttar Pradesh',
    description: 'APAC\'s first R2v3-certified ITAD + e-waste management company. Greater Noida plant. Handles IT + telecom hardware + batteries.',
    email: null, phone: null,
    recycler_codes: ['CPCB-UP-058', 'BM-OR-002'],
    directors: [
      { name: 'Subir Bajaj', title: 'Director' },
    ],
  },
];

for (const g of GROUPS) {
  const { data: canon } = await sb.from('companies').select('id').eq('slug', g.slug).maybeSingle();
  let companyId = canon?.id ?? null;
  const payload = {
    slug: g.slug,
    legal_name: g.canonical,
    is_group_holding: false,
    cin: g.cin ?? null,
    website: g.website,
    registered_address: g.registered_address,
    registered_state: g.registered_state,
    description: g.description,
  };
  if (companyId) await sb.from('companies').update(payload).eq('id', companyId);
  else {
    const { data: ins, error } = await sb.from('companies').insert(payload).select('id').single();
    if (error) { console.log(`✗ ${g.slug}: ${error.message}`); continue; }
    companyId = ins.id;
  }
  console.log(`\n✓ ${g.canonical} (${g.cin ?? 'no CIN'})`);

  const rows = [];
  for (const d of g.directors) rows.push({ name: d.name, title: d.title, department: null, email: null, phone: null, source: MCA, first_seen: TODAY });
  if (g.email || g.phone) rows.push({ name: null, title: 'General', department: null, email: g.email, phone: g.phone, source: g.website ? new URL(g.website).host : MCA, first_seen: TODAY });

  for (const code of g.recycler_codes) {
    const { data: r } = await sb.from('recyclers').select('id, email, phone, website, contacts_all, websites_all').eq('recycler_code', code).maybeSingle();
    if (!r) { console.log(`   ! ${code} not found`); continue; }
    const patch = { company_id: companyId };
    if (g.email && isPlaceholderEmail(r.email)) patch.email = g.email;
    if (g.phone && !r.phone) patch.phone = g.phone;
    if (g.website && !r.website) patch.website = g.website;
    const { merged: mc, added: ac } = mergeContacts(r.contacts_all, rows);
    if (ac > 0) patch.contacts_all = mc;
    if (g.website) {
      const { merged: mw, added: aw } = mergeWebsites(r.websites_all, [{ url: g.website, source: MCA, first_seen: TODAY }]);
      if (aw > 0) patch.websites_all = mw;
    }
    await sb.from('recyclers').update(patch).eq('id', r.id);
    console.log(`   + ${code}: ${Object.keys(patch).filter(k => k !== 'company_id').join(', ')}${Object.keys(patch).includes('company_id') ? ' (linked)' : ''}`);
  }
  if (!g.recycler_codes.length) {
    console.log(`   (no linked facilities yet — company row created for future linking)`);
  }
}
console.log('\nDone.');
