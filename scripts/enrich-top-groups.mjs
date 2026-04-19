#!/usr/bin/env node
/**
 * Bulk enrichment for the top 11 multi-facility groups in our DB.
 * Pulls CIN, registered address, group website/email/phone, and
 * directors' names + titles from public sources (ZaubaCorp, Tofler,
 * IndiaFilings, MCA, Tracxn, each company's own site).
 *
 * Writes:
 *  - companies.cin, companies.website, companies.registered_address,
 *    companies.description
 *  - recyclers.contacts_all (appends directors + group mailbox)
 *  - recyclers.website / recyclers.email if currently missing
 *  - recyclers.phone if currently empty
 *
 * Idempotent — safe to re-run.
 */
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const TODAY = new Date().toISOString().slice(0, 10);
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

const MCA = 'ZaubaCorp / Tofler / MCA 2026-04-19';

// ── Config: one entry per group (company slug must already exist) ─────
const GROUPS = [
  {
    slug: 'greenscape-eco-management-private-limited',
    cin: 'U93000DL2007PTC170264',
    website: 'https://www.greenscape-eco.com',
    registered_address: '512, Elegance Tower, Plot No. 8, Jasola Non-Hierarchical Commercial Centre, New Delhi – 110025, India',
    registered_state: 'Delhi',
    description: 'E-waste + integrated waste recycling. Delhi-registered; facilities across MH (Pune), KA (Bengaluru), RJ (Alwar ×2), DL, and MH dismantler. Incorporated 2007.',
    email: 'ashok@greenscape-eco.com',
    phone: null,
    directors: [
      { name: 'Ashok Kumar',   title: 'Director', department: null },
      { name: 'Jeevesh Kumar', title: 'Director', department: null },
      { name: 'Shubhra Kumar', title: 'Director', department: null },
      { name: 'Suman Kumar',   title: 'Director', department: null },
    ],
  },
  {
    slug: 'earth-sense-recycle-private-limited',
    cin: 'U74999TN2008PTC066002',
    website: 'https://www.earthsenserecycle.com',
    registered_address: 'No. 43/1, Besant Avenue, Adyar, Chennai, Tamil Nadu – 600020, India',
    registered_state: 'Tamil Nadu',
    description: 'WEEE recycling + asset management + value recovery. TN-registered; 5 facilities across KA, TN, TS, HR, MH.',
    email: 'info@earthsenserecycle.com',
    phone: '1800 419 0161',
    directors: [
      { name: 'Sanjay Kumar Radhakrishnan', title: 'Director', department: null },
      { name: 'Kumaran Kandasamy',          title: 'Director', department: null },
    ],
  },
  {
    slug: 'rubamin-limited',
    cin: 'U24299GJ1987PTC009942',
    website: 'https://rubamin.com',
    registered_address: 'ARK 4th Floor, Sub-plot No. 1 of Plot A/27-28 & B/29-32 (Part), Shri Krishna Industrial Estate, Opp. B I D C, Gorwa, Vadodara, Gujarat – 390016, India',
    registered_state: 'Gujarat',
    description: 'India\'s largest lithium-ion battery recycling company. Also handles zinc + other non-ferrous. Vadodara HQ, multiple plants across Gujarat. Incorporated 1987.',
    email: 'connect@rubamin.com',
    phone: '+91-265-2282078',
    directors: [
      { name: 'Atul Nandkishore Dalmia',        title: 'Director', department: null },
      { name: 'Kizhakkethil Ramachandran Suresh', title: 'Director', department: null },
      { name: 'Anil Ramanbhai Patel',           title: 'Director', department: null },
      { name: 'Soumitra Purkayastha',           title: 'Director', department: null },
      { name: 'Sanjay Kumar Dudhoria',          title: 'Director', department: null },
      { name: 'Achyutanand Koppala',            title: 'Director', department: null },
      { name: 'Ranjit Singh',                   title: 'Director', department: null },
      { name: 'Bhuwan Purohit',                 title: 'Director', department: null },
      { name: 'Milin Kaimas Mehta',             title: 'Director', department: null },
      { name: 'Priyanka Phirojsha Irani',       title: 'Director', department: null },
    ],
  },
  {
    slug: 'arsh-recycling-private-limited',
    cin: 'U37100DL2013PTC255142',
    website: null,
    registered_address: 'H. No. 89, Gali No. 2, Old Mustafabad, Delhi – 110094, India',
    registered_state: 'Delhi',
    description: 'Metal waste + scrap recycling. Delhi-registered; operations across UP (Ghaziabad) and MH (Pune, incl. dismantler arm). Incorporated 2013.',
    email: null,
    phone: null,
    directors: [
      { name: 'Sagir Ahmed',       title: 'Director', department: null },
      { name: 'Mohd Nadeem Malik', title: 'Director', department: null },
    ],
  },
  {
    slug: 'world-scrap-recycling-solutions-pvt-ltd',
    cin: 'U74999TN2017PTC116946',
    website: 'https://worldscraprecycling.com',
    registered_address: 'Kanchipuram, Tamil Nadu, India (with corporate office at Tirupati, Andhra Pradesh)',
    registered_state: 'Tamil Nadu',
    description: 'E-waste recycling + management. Registered in TN, corporate office Tirupati AP. 3 facilities: AP (Chittoor ×2), TN (Kanchipuram). Incorporated 2017.',
    email: 'baskaranscrap@rediffmail.com',
    phone: null,
    directors: [
      { name: 'Kumar Baskaran',   title: 'Director', department: null },
      { name: 'Kumar Padmavathi', title: 'Director', department: null },
      { name: 'Sushil Chaubey',   title: 'Director', department: null },
      { name: 'Kumar Karunakaran', title: 'Director', department: null },
      { name: 'Mohd Farookh',     title: 'Director', department: null },
    ],
  },
  {
    slug: 'eco-tantra-llp',
    cin: null,
    website: 'https://www.ecotantra.in',
    registered_address: 'Flat No. 4 & 6, Sukrut Apts, 70B-3, Prabhat Road, Pune, Maharashtra – 411004, India',
    registered_state: 'Maharashtra',
    description: 'E-waste + battery recycling LLP, incorporated 2018. Active across MH (Pune) — including refurbisher arm — plus battery recycling registration in Gujarat.',
    email: 'richa@ecotantra.in',
    phone: '+91 89814 73653',
    directors: [
      { name: 'Rati Dattaraya Devale',    title: 'Designated Partner', department: null },
      { name: 'Dattatraya Trimbak Devale', title: 'Designated Partner', department: null },
      { name: 'Richa Dattatraya Devale',  title: 'Designated Partner', department: null },
    ],
  },
  {
    slug: 'e-waste-recyclers-india',
    cin: null, // not found in search — MCA lookup needed
    website: 'https://www.ewri.in',
    registered_address: 'E-50, UPSIDC Industrial Area, 98 KM Stone, NH-2, Kosi Kotwan, Mathura, Uttar Pradesh, India',
    registered_state: 'Uttar Pradesh',
    description: 'E-waste recycling management. Operations concentrated in Mathura district, UP.',
    email: null,
    phone: '1800 10 25679',
    directors: [],
  },
  {
    slug: 'exigo-recycling-pvt-ltd',
    cin: 'U37200DL2012PTC244353',
    website: 'https://www.exigorecycling.in',
    registered_address: 'F-36, First Floor, East of Kailash, New Delhi – 110065, India',
    registered_state: 'Delhi',
    description: 'E-waste + electronic assets collection, recycling, and management. Delhi-registered; incorporated 2012.',
    email: null,
    phone: null,
    directors: [
      { name: 'Ashok Sharma', title: 'Director', department: null },
      { name: 'Raman Sharma', title: 'Director', department: null },
    ],
  },
  {
    slug: 'deshwal-waste-management-pvt-ltd',
    cin: 'U74900HR2013PTC049334',
    website: 'https://www.dwmpl.com',
    registered_address: 'Plot No. 15, Sector 5, IMT Manesar, Gurugram, Haryana – 122050, India',
    registered_state: 'Haryana',
    description: 'Electronic waste disposal + management. HR-registered with corporate office at Sec 34 Hero Honda Chowk, Gurugram. 3 facilities: HR (Gurugram ×2), MH (Pune).',
    email: 'info@dwmpl.com',
    phone: '1800 102 9077',
    directors: [
      { name: 'Raju Yadav',        title: 'Director', department: null },
      { name: 'Yogendra Singh',    title: 'Director', department: null },
      { name: 'Anil Kumar Narang', title: 'Director', department: null },
    ],
  },
  {
    slug: 'earthbox-ventures',
    cin: 'U74999TG2016PTC112088',
    website: 'https://www.earthboxventures.com',
    registered_address: 'E 1006, Ramky Towers, Gachibowli, Serilingampally, K. V. Rangareddy, Hyderabad, Telangana – 500032, India',
    registered_state: 'Telangana',
    description: 'Integrated waste management — paper, polymers, e-waste, garbage segregation, disposal. Telangana-based, incorporated 2016.',
    email: null,
    phone: null,
    directors: [],
  },
  {
    slug: 'tes-amm-india-pvt-ltd',
    cin: 'U74140TN2006PTC061303',
    website: 'https://www.tes-amm.net',
    registered_address: 'A-18, SIPCOT Industrial Growth Centre, Panrutti-A Village, Oragadam, Sriperumbudur Taluk, Kancheepuram, Tamil Nadu – 631604, India',
    registered_state: 'Tamil Nadu',
    description: 'E-waste recycling + recovery of precious metals from electronics. TN-registered, Kanchipuram/Oragadam unit + Telangana presence. Incorporated 2006.',
    email: 'admin@tes-amm.net',
    phone: '+91 44 4500 0353',
    directors: [
      { name: 'Srinivasan Ramesh Manoaj',   title: 'Director', department: null },
      { name: 'Viswanathan Ramachandran',   title: 'Director', department: null },
      { name: 'Krishanmurthy Srikanthan',   title: 'Director', department: null },
    ],
  },
];

// Slug fallbacks — the auto-clusterer produced slightly different slugs
// than what I wrote above for a few groups. Resolve by matching either.
async function resolveCompany(preferred) {
  const candidates = [
    preferred,
    preferred.replace(/-pvt-ltd$/, '-private-limited'),
    preferred.replace(/-private-limited$/, '-pvt-ltd'),
  ];
  for (const slug of candidates) {
    const { data } = await sb.from('companies').select('id, slug, legal_name').eq('slug', slug).maybeSingle();
    if (data) return data;
  }
  // Fallback: ILIKE on legal_name
  const looseName = preferred.replace(/-/g, ' ').replace(/\b(pvt|private|ltd|limited|co)\b/gi, '').trim();
  const { data: fuzzy } = await sb.from('companies').select('id, slug, legal_name').ilike('legal_name', `%${looseName.slice(0, 20)}%`).limit(1);
  return fuzzy?.[0] ?? null;
}

for (const g of GROUPS) {
  const co = await resolveCompany(g.slug);
  if (!co) { console.log(`✗ ${g.slug} — company row not found`); continue; }

  // Update company row
  const coUpdates = { description: g.description };
  if (g.cin) coUpdates.cin = g.cin;
  if (g.website) coUpdates.website = g.website;
  if (g.registered_address) coUpdates.registered_address = g.registered_address;
  if (g.registered_state) coUpdates.registered_state = g.registered_state;
  await sb.from('companies').update(coUpdates).eq('id', co.id);
  console.log(`\n✓ ${co.legal_name}`);
  console.log(`   CIN: ${g.cin ?? '(n/a)'} | site: ${g.website ?? '(n/a)'}`);

  // Build contact rows
  const contactRows = [];
  for (const d of g.directors) {
    contactRows.push({ name: d.name, title: d.title, department: d.department, email: null, phone: null, source: MCA, first_seen: TODAY });
  }
  if (g.email || g.phone) {
    contactRows.push({ name: null, title: 'General', department: null, email: g.email, phone: g.phone, source: new URL(g.website ?? 'https://example.com').host, first_seen: TODAY });
  }

  // Find all facilities linked to this company and propagate
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
