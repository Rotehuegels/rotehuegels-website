#!/usr/bin/env node
/**
 * Second-tier bulk enrichment — another 10 groups from the multi-facility
 * cluster list. Same idempotent merge logic as enrich-top-groups.mjs.
 *
 * Covers public-company filings (Gravita, J.G. Chemicals, GNG Electronics,
 * Re Sustainability) + private-ltd entries (Trishyiraya, Nav Bharat,
 * ICMC, Elifecycle, EnviroKare) + one partnership firm (Moogambigai).
 *
 * S.K. Enterprises, Maharashtra Enterprises, Shreem Mythri — skipped
 * (proprietorship/too small for public registry data).
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
    slugs: ['trishyiraya-recycling-india', 'trishyiraya-recycling-india-pvt-ltd', 'trishyiraya-recycling'],
    canonical: 'Trishyiraya Recycling India Private Limited',
    cin: 'U37100TN2000PTC046023',
    website: null,
    registered_address: '28/21, Vengeeswarar Nagar, 1st Main Road, Vadapalani, Chennai, Tamil Nadu – 600026, India',
    registered_state: 'Tamil Nadu',
    description: 'E-waste recycling — incorporated 2000 at Chennai, facilities across KA (Doddaballapur) and TN (Chennai). Uses the SIMS Lifecycle name in Bangalore.',
    email: null, phone: null,
    directors: [
      { name: 'Puthen Variyam Eswari Amma Subash', title: 'Director' },
      { name: 'Ravichandran',                     title: 'Director' },
    ],
  },
  {
    slugs: ['gravita-india-limited', 'gravita-india'],
    canonical: 'Gravita India Limited',
    cin: 'L29308RJ1992PLC006870',
    website: 'https://www.gravitaindia.com',
    registered_address: 'Saurabh, Harsulia Mod, P.O. Harsulia, Diggi-Malpura Road, Phagi, Rajasthan – 303904, India',
    registered_state: 'Rajasthan',
    description: 'BSE/NSE-listed lead + aluminium + plastics + rubber recycler — Gravita Tower, A-27B Shanti Path, Tilak Nagar, Jaipur 302004. Incorporated 1992. Multiple plants across India + UAE, Ghana, Senegal, Mozambique, Sri Lanka.',
    email: null, phone: null,
    directors: [
      { name: 'Rajat Agrawal',        title: 'Director' },
      { name: 'Yogesh Malhotra',      title: 'Director' },
      { name: 'Satish Kumar Agrawal', title: 'Director' },
      { name: 'Ashok Jain',           title: 'Director' },
      { name: 'Sunil Kansal',         title: 'Director' },
    ],
  },
  {
    slugs: ['re-sustainability-limited', 're-sustainability', 'ramky-enviro-engineers'],
    canonical: 'Re Sustainability Limited',
    cin: 'U74140TG1994PLC018833',
    website: 'https://resustainability.com',
    registered_address: 'Level 11B, Aurobindo Galaxy, Hyderabad Knowledge City, Hitech City Road, Hyderabad, Telangana, India',
    registered_state: 'Telangana',
    description: 'Formerly Ramky Enviro Engineers Limited. Integrated environment-management major — waste management, recycling, landfill, e-waste, hazardous waste. Incorporated 1994.',
    email: 'cs.reel@resustainability.com', phone: null,
    directors: [
      { name: 'Masood Alam Mallick',       title: 'Director' },
      { name: 'Pankaj Maharaj',            title: 'Director' },
      { name: 'Goutham Reddy Mereddy',     title: 'Director' },
      { name: 'Simrun Mehta',              title: 'Director' },
      { name: 'Rohan Rakesh Suri',         title: 'Director' },
      { name: 'Hwee Hua Lim',              title: 'Director' },
      { name: 'Govind Singh',              title: 'Director' },
      { name: 'Shantharaju Bangalore Siddaiah', title: 'Director' },
      { name: 'Suveer Kumar Sinha',        title: 'Director' },
      { name: 'Narayan Keelveedhi Seshadri', title: 'Director' },
    ],
  },
  {
    slugs: ['gng-electronics', 'gng-electronics-pvt-ltd', 'gng-electronics-private-limited'],
    canonical: 'GNG Electronics Limited',
    cin: 'L72900MH2006PLC165194',
    website: 'https://www.gnggroup.in',
    registered_address: 'Unit No 415, Hubtown Solaris, N. S. Phadke Marg, Andheri (East), Mumbai, Maharashtra – 400069, India',
    registered_state: 'Maharashtra',
    description: 'Refurbished IT assets + e-waste + refurbisher arm. BSE-listed (converted PTC → PLC). Parent of Yaantra (refurb smartphones).',
    email: null, phone: null,
    directors: [
      { name: 'Sharad Khandelwal',            title: 'Director' },
      { name: 'Vidhi Sharad Khandelwal',      title: 'Director' },
      { name: 'Ajay Kumar Parasmal Pancholi', title: 'Additional Director' },
    ],
  },
  {
    slugs: ['nav-bharat-metallicoxide-industries', 'nav-bharat-metallic-oxide-industries'],
    canonical: 'Nav Bharat Metallic Oxide Industries Private Limited',
    cin: 'U13200MH1983PTC030102',
    website: 'http://www.navbharat.co.in',
    registered_address: '501, 5th Floor, Avior, Nirmal Galaxy, L. B. S. Marg, Mulund (West), Mumbai, Maharashtra – 400080, India',
    registered_state: 'Maharashtra',
    description: 'Zinc oxide manufacturer from zinc scrap / skimmings. Incorporated 1983, Mumbai-registered, production units in Daman.',
    email: null, phone: null,
    directors: [
      { name: 'Namrata Umesh Thakkar',   title: 'Director' },
      { name: 'Umesh Krishnadas Thakkar', title: 'Director' },
      { name: 'Mukund Umesh Thakkar',    title: 'Director' },
      { name: 'Rasila Umesh Thakkar',    title: 'Director' },
      { name: 'Nisha Mukund Thakkar',    title: 'Director' },
      { name: 'Krishna Mahavir Vaid',    title: 'Director' },
      { name: 'Mahavir Ramavtar Vaid',   title: 'Director' },
    ],
  },
  {
    slugs: ['icmc-corporation-limited', 'icmc-corporation'],
    canonical: 'ICMC Corporation Limited',
    cin: 'U24294TN1995PLC029929',
    website: 'https://www.icmcgroup.com',
    registered_address: '#36 Ambattur Industrial Estate, Chennai, Tamil Nadu – 600058, India',
    registered_state: 'Tamil Nadu',
    description: 'Agro-based chemicals + non-ferrous reprocessing. Originally established 1971 at Trichy, now Chennai-registered. Facilities in Villupuram and Trichy.',
    email: 'kannan@icmcgroup.com', phone: null,
    directors: [
      { name: 'Kannan Bhuvana',              title: 'Director' },
      { name: 'Mahadevan Ganapathy Subramaniam', title: 'Director' },
      { name: 'Mahadevan Kannan',            title: 'Director' },
    ],
  },
  {
    slugs: ['moogambigai-metal-refineries'],
    canonical: 'Moogambigai Metal Refineries',
    cin: null, // partnership firm
    gstin: '29AASFM0124F1ZB',
    website: 'https://www.mmrmetal.com',
    registered_address: 'Plot No. 132, Baikampady Industrial Area, Mangalore, Karnataka – 575011, India',
    registered_state: 'Karnataka',
    description: 'Non-ferrous metal scrap refining — aluminium, copper, alloys. Partnership firm (Arumugam family). Facilities at Mangalore (KA), Coimbatore + Perundurai (TN). Related entity Moogambigai Materials Recycling (India) Pvt Ltd (CIN U24200KA2024PTC192074) being set up 2024.',
    email: null, phone: '+91 824 240 7851',
    directors: [
      { name: 'Balasubramanian Arumugam', title: 'Partner' },
      { name: 'Ayyappan Arumugam',        title: 'Partner' },
      { name: 'Shyam Kumar',              title: 'Key Personnel' },
    ],
  },
  {
    slugs: ['elifecycle-management', 'elifecycle-management-private-limited'],
    canonical: 'Elifecycle Management Private Limited',
    cin: 'U37100TG2021PTC157067',
    website: 'https://www.elima.in',
    registered_address: 'Flat No. 502, 5th Floor, Siri Sampada Arcade III, Khajaguda, Gachibowli, Hyderabad, Telangana – 500089, India',
    registered_state: 'Telangana',
    description: 'Waste management + recycling solutions. Incorporated 2021 at Hyderabad. E-waste + dismantling arm.',
    email: 'kishan@elima.in', phone: null,
    directors: [
      { name: 'Abhishek Agashe Sanjiv',       title: 'Director' },
      { name: 'Devulapally Venkata Kashyap',  title: 'Director' },
      { name: 'Mohit Kumar Vanamala',         title: 'Director' },
    ],
  },
  {
    slugs: ['envirokare-recycling-solutions', 'envirokare-recycling-solutions-pvt-ltd'],
    canonical: 'EnviroKare Recycling Solutions Private Limited',
    cin: 'U72900TG2020PTC143289',
    website: 'https://www.envirokare.in',
    registered_address: 'Plot No. 77/1, 1st Floor, Geetha Nagar Colony, Old Safilguda, Hyderabad, Telangana – 500056, India',
    registered_state: 'Telangana',
    description: 'E-waste recycling + refurbisher arm. Incorporated 2020 at Hyderabad.',
    email: null, phone: null,
    directors: [
      { name: 'Naresh Sushma',         title: 'Director' },
      { name: 'Bharath Venugopal',     title: 'Director' },
      { name: 'Sarangpani Naresh Raj', title: 'Director' },
    ],
  },
  {
    slugs: ['j-g-chemicals-pvt-ltd', 'j-g-chemicals', 'j-g-chemicals-limited'],
    canonical: 'J.G. Chemicals Limited',
    cin: 'L24100WB2001PLC093380',
    website: 'https://jgchem.com',
    registered_address: 'Adventz Infinity @ 5, 15th Floor, Unit 1511, Plot 5, Block BN, Sector V, Salt Lake Electronics Complex, Bidhan Nagar, North 24 Parganas, West Bengal – 700091, India',
    registered_state: 'West Bengal',
    description: 'Zinc oxide manufacturer (since 1975), BSE/NSE-listed. Part of BDJ Group (Jhunjhunwala family). Subsidiary BDJ Oxides Pvt Ltd.',
    email: 'info@jgchem.com', phone: null,
    directors: [
      { name: 'Suresh Jhunjhunwala', title: 'Director' },
      { name: 'Anuj Jhunjhunwala',   title: 'Director' },
    ],
  },
];

async function resolveCompany(slugs, canonical) {
  for (const slug of slugs) {
    const { data } = await sb.from('companies').select('id, slug, legal_name').eq('slug', slug).maybeSingle();
    if (data) return data;
  }
  const { data: fuzzy } = await sb.from('companies').select('id, slug, legal_name').ilike('legal_name', `%${canonical.split(' ').slice(0, 2).join(' ')}%`).limit(1);
  return fuzzy?.[0] ?? null;
}

for (const g of GROUPS) {
  const co = await resolveCompany(g.slugs, g.canonical);
  if (!co) { console.log(`✗ ${g.canonical} — company row not found (expected slugs: ${g.slugs.join(', ')})`); continue; }

  const coUpdates = { description: g.description, legal_name: g.canonical };
  if (g.cin) coUpdates.cin = g.cin;
  if (g.gstin) coUpdates.gstin = g.gstin;
  if (g.website) coUpdates.website = g.website;
  if (g.registered_address) coUpdates.registered_address = g.registered_address;
  if (g.registered_state) coUpdates.registered_state = g.registered_state;
  await sb.from('companies').update(coUpdates).eq('id', co.id);
  console.log(`\n✓ ${g.canonical}`);
  console.log(`   CIN: ${g.cin ?? '(n/a)'} | site: ${g.website ?? '(n/a)'}`);

  const contactRows = [];
  for (const d of g.directors) {
    contactRows.push({ name: d.name, title: d.title, department: null, email: null, phone: null, source: MCA, first_seen: TODAY });
  }
  if (g.email || g.phone) {
    contactRows.push({
      name: null, title: 'General', department: null,
      email: g.email ?? null, phone: g.phone ?? null,
      source: g.website ? new URL(g.website).host : MCA,
      first_seen: TODAY,
    });
  }

  const { data: facs } = await sb.from('recyclers').select('id, recycler_code, email, phone, website, contacts_all, websites_all').eq('company_id', co.id);
  for (const r of facs ?? []) {
    const patch = {};
    if (g.email && isPlaceholderEmail(r.email)) patch.email = g.email;
    if (g.phone && !r.phone) patch.phone = g.phone;
    if (g.website && !r.website) patch.website = g.website;
    const { merged: mc, added: ac } = mergeContacts(r.contacts_all, contactRows);
    if (ac > 0) patch.contacts_all = mc;
    if (g.website) {
      const { merged: mw, added: aw } = mergeWebsites(r.websites_all, [{ url: g.website, source: MCA, first_seen: TODAY }]);
      if (aw > 0) patch.websites_all = mw;
    }
    if (Object.keys(patch).length) {
      await sb.from('recyclers').update(patch).eq('id', r.id);
      console.log(`   + ${r.recycler_code}: ${Object.keys(patch).join(', ')}`);
    }
  }
}

console.log('\nDone.');
