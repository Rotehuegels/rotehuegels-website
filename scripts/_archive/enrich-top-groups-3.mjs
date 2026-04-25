#!/usr/bin/env node
/**
 * Third-tier enrichment — 8 more major recyclers, mix of existing
 * clusters and singleton facilities that need a company row created.
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

async function upsertCompany(row) {
  const { data: ex } = await sb.from('companies').select('id').eq('slug', row.slug).maybeSingle();
  if (ex) { await sb.from('companies').update(row).eq('id', ex.id); return ex.id; }
  const { data: ins, error } = await sb.from('companies').insert(row).select('id').single();
  if (error) throw new Error(`company ${row.slug}: ${error.message}`);
  return ins.id;
}

const GROUPS = [
  {
    slug: '3r-recycler-pvt-ltd',
    existingSlugs: ['3r-recycler-unit-2'], // rename the wrongly-clustered row
    canonical: '3R Recycler Private Limited',
    cin: 'U72200DL2013PTC249356',
    website: 'https://3rrecycler.com',
    registered_address: 'Flat No. 57, Plot No. 111, AZAD CGHS, Patparganj, Delhi – 110092, India',
    registered_state: 'Delhi',
    description: 'E-waste recycling + EPR management. Delhi-registered, operating plants at UPSIDC Industrial Area, Sikandrabad (Bulandshahar) + Mussoorie Gulawathi Road, Hapur — both UP.',
    email: 'info@3rrecycler.com',
    phone: '1800 212 8632',
    recycler_codes: ['CPCB-UP-012', 'CPCB-UP-121'],
    directors: [
      { name: 'Mehraj Malik', title: 'Director' },
      { name: 'Balraj Bansal', title: 'Director' },
    ],
  },
  {
    slug: 'hydromet-india-limited',
    existingSlugs: ['hydrometltd'],
    canonical: 'Hydromet (India) Limited',
    cin: 'U37100TN2002PLC048922',
    website: 'https://www.hydrometindia.com',
    registered_address: 'Vedal Village, Rajakulam Post, Kancheepuram – 631561, Tamil Nadu, India',
    registered_state: 'Tamil Nadu',
    description: 'Copper alloy + copper cathode manufacturer via hydrometallurgical process. Incorporated 2002. Kancheepuram-based.',
    email: 'admin@hydrometindia.com', phone: null,
    recycler_codes: ['NFMR-TN-005', 'MRAI-TN-007'],
    directors: [
      { name: 'Venkat Subramani Muthukali',       title: 'Director' },
      { name: 'Angappan Sivanesan Sivasunder',    title: 'Director' },
      { name: 'Gautam Muthukali Venkatsubramani', title: 'Director' },
    ],
  },
  {
    slug: 'pondy-oxides-and-chemicals-limited',
    canonical: 'Pondy Oxides and Chemicals Limited',
    cin: 'L24294TN1995PLC030586',
    website: 'https://pocl.com',
    registered_address: 'KRM Centre, 4th Floor, #2 Harrington Road, Chetpet, Chennai, Tamil Nadu – 600031, India',
    registered_state: 'Tamil Nadu',
    description: 'BSE/NSE-listed LME-registered lead + zinc oxide + calcium alloy producer. Chennai-registered, incorporated 1995. Multiple reprocessing units.',
    email: 'info@pocl.com', phone: '+91 44 4296 5454',
    recycler_codes: ['NFMR-TN-002'],
    directors: [
      { name: 'Krishnamoorthi Kumaravel', title: 'Director' },
      { name: 'Anil Kumar Bansal',        title: 'Director' },
      { name: 'Vijay Anand',              title: 'Director' },
      { name: 'Ashish Bansal',            title: 'Director' },
      { name: 'Shoba Ramakrishnan',       title: 'Director' },
      { name: 'Balakrishnan Vijay',       title: 'Director' },
      { name: 'Ramasubramani',            title: 'Director' },
    ],
  },
  {
    slug: 'cerebra-integrated-technologies-limited',
    canonical: 'Cerebra Integrated Technologies Limited',
    cin: 'L85110KA1993PLC015091',
    website: 'https://www.cerebracomputers.com',
    registered_address: 'S5, Off 3rd Cross, Peenya Industrial Area, Peenya 1st Stage, Bengaluru, Karnataka – 560058, India',
    registered_state: 'Karnataka',
    description: 'BSE/NSE-listed IT hardware + e-waste recycler. Incorporated 1993. Peenya Bengaluru registered office, large Kolar plant.',
    email: null, phone: null,
    recycler_codes: ['CPCB-KA-009'],
    directors: [
      { name: 'Ranganathan Venkatraman',   title: 'Director' },
      { name: 'Vishwamurthy Phalanetra',   title: 'Director' },
      { name: 'Satish Chandra',            title: 'Director' },
      { name: 'Madan Bhalchandra Gosavi',  title: 'Director' },
      { name: 'Surbhi Jain',               title: 'Director' },
      { name: 'Uttam Prakash Agarwal',     title: 'Director' },
    ],
  },
  {
    slug: 'virogreen-india-pvt-ltd',
    canonical: 'Virogreen India Private Limited',
    cin: 'U52392TN2002PTC049211',
    website: 'https://virogreen.in',
    registered_address: 'S.No. 297/1B2, No. 49, Pappankuppam Village, S.R. Kandigai Road, Gummidipoondi, Tamil Nadu – 601201, India',
    registered_state: 'Tamil Nadu',
    description: 'E-waste management + recycling. Formerly Ultrust Solutions. Incorporated 2002. Gummidipoondi (TN) + Bengaluru operations.',
    email: null, phone: null,
    recycler_codes: ['CPCB-TN-011', 'CPCB-TN-013'],
    directors: [
      { name: 'Pandiyan Muthuramalingam', title: 'Director' },
      { name: 'Jayanthi Muthuramalingam', title: 'Director' },
    ],
  },
  {
    slug: 'bridge-green-upcycle-pvt-ltd',
    canonical: 'Bridge Green Upcycle Private Limited',
    cin: 'U38120TN2023PTC166263',
    website: 'https://bridgegreenupcycle.com',
    registered_address: '2nd Floor, 24/1, Subramaniyam Street, Abhiramapuram, Teynampet, Chennai, Tamil Nadu – 600018, India',
    registered_state: 'Tamil Nadu',
    description: 'Battery-waste recycling + upcycling. Incorporated Dec 2023. Auth. capital ₹15 Cr. Plants at Gummidipundi (10 TPD), Guindy Chennai (30-50 kg/day R&D), Maraimalai Nagar (3 TPD upcoming).',
    email: null, phone: null,
    recycler_codes: ['BWM-TN-002'],
    directors: [
      { name: 'Krishnamurthy Mani',      title: 'Director' },
      { name: 'Balakrishnan Gopalan Iyer', title: 'Director' },
      { name: 'Sivanand Rajalakshmi',    title: 'Director' },
    ],
  },
  {
    slug: 'batx-energies-pvt-ltd',
    canonical: 'BatX Energies Private Limited',
    cin: 'U31909HR2020PTC087281',
    website: 'https://batxenergies.com',
    registered_address: 'Office No. 7, 6th Floor, Enkay Tower, Udyog Vihar Phase V, Industrial Complex Dundahera, Gurugram, Haryana – 122022, India',
    registered_state: 'Haryana',
    description: 'Li-ion battery recycling + second-life battery company. Incorporated 2020. Gurugram HQ. Plants in HR + KA.',
    email: 'utkarsh@batx.in', phone: null,
    recycler_codes: ['BWM-MH-001', 'BM-KA-001'],
    directors: [
      { name: 'Vikrant Singh', title: 'Director & Co-Founder' },
      { name: 'Utkarsh Singh', title: 'Director & Co-Founder' },
    ],
  },
  {
    slug: 'lohum-cleantech-pvt-ltd',
    canonical: 'Lohum Cleantech Private Limited',
    cin: 'U74999DL2018PTC331175',
    website: 'https://www.lohum.com',
    registered_address: 'B-357/A, Shop No. 6, Ground Floor, Opp. Metro Pillar No. 157, New Ashok Nagar, East Delhi, Delhi – 110096, India',
    registered_state: 'Delhi',
    description: 'Lithium-ion battery recycling + second-life energy storage. Incorporated 2018. Delhi registered, operations largely at Noida UP.',
    email: 'rajat.verma@lohum.com', phone: null,
    recycler_codes: ['BWM-UP-001'],
    directors: [
      { name: 'Rajat Verma',       title: 'Co-Founder & CEO' },
      { name: 'Supriya Srivastava', title: 'Director' },
      { name: 'Tarun Singhal',     title: 'Director' },
      { name: 'Arul Kamal Mehra',  title: 'Director' },
      { name: 'Farhan Ahmad',      title: 'Director' },
    ],
  },
];

for (const g of GROUPS) {
  // Resolve canonical company, merging any legacy slugs
  let canonicalId = null;
  const { data: canon } = await sb.from('companies').select('id').eq('slug', g.slug).maybeSingle();
  if (canon) canonicalId = canon.id;
  for (const legacy of g.existingSlugs ?? []) {
    const { data: old } = await sb.from('companies').select('id').eq('slug', legacy).maybeSingle();
    if (old && !canonicalId) {
      // rename in-place instead of deleting
      canonicalId = old.id;
    } else if (old && canonicalId && old.id !== canonicalId) {
      // migrate facilities and delete dup
      await sb.from('recyclers').update({ company_id: canonicalId }).eq('company_id', old.id);
      await sb.from('companies').delete().eq('id', old.id);
    }
  }
  const payload = {
    slug: g.slug,
    legal_name: g.canonical,
    is_group_holding: false,
    cin: g.cin,
    website: g.website,
    registered_address: g.registered_address,
    registered_state: g.registered_state,
    description: g.description,
  };
  if (canonicalId) {
    await sb.from('companies').update(payload).eq('id', canonicalId);
  } else {
    const { data: ins, error } = await sb.from('companies').insert(payload).select('id').single();
    if (error) { console.log(`✗ ${g.slug}: ${error.message}`); continue; }
    canonicalId = ins.id;
  }
  console.log(`\n✓ ${g.canonical} (${g.cin ?? 'no CIN'})`);

  // Build contact rows
  const rows = [];
  for (const d of g.directors) rows.push({ name: d.name, title: d.title, department: null, email: null, phone: null, source: MCA, first_seen: TODAY });
  if (g.email || g.phone) rows.push({ name: null, title: 'General', department: null, email: g.email, phone: g.phone, source: g.website ? new URL(g.website).host : MCA, first_seen: TODAY });

  // Link and enrich each facility
  for (const code of g.recycler_codes) {
    const { data: r } = await sb.from('recyclers').select('id, email, phone, website, contacts_all, websites_all, company_id').eq('recycler_code', code).maybeSingle();
    if (!r) { console.log(`   ! ${code} not found`); continue; }
    const patch = { company_id: canonicalId };
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
    console.log(`   + ${code}: ${Object.keys(patch).join(', ')}`);
  }
}
console.log('\nDone.');
