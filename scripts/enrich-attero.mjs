#!/usr/bin/env node
/**
 * Attero Recycling deep enrichment.
 * Creates the company row, links the one facility we have (Roorkee),
 * and fills contacts_all + plant details.
 *
 * Sources: attero.in (homepage), ZaubaCorp / Tofler / IndiaFilings,
 * Bloomberg, Business India corporate report, Dun & Bradstreet,
 * prior Phase 2 validator results (13 state branches confirmed via
 * gstincheck.co.in for PAN AAGCA8859A).
 */
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const TODAY = new Date().toISOString().slice(0, 10);
const S_ZC = 'ZaubaCorp / Tofler / MCA';
const S_WEB = 'attero.in';
const S_BB = 'Bloomberg profile';
const S_DB = 'Dun & Bradstreet';
const S_PV = 'gstincheck.co.in validator 2026-04-19';

const normEmail = (e) => e?.toLowerCase().trim();
const normPhone = (p) => p?.replace(/\D/g, '').replace(/^91/, '');
function merge(existing, rows) {
  const out = [...(existing ?? [])];
  const keys = new Set(out.map(c => [normEmail(c.email), normPhone(c.phone), c.name && `${c.name.toLowerCase()}|${c.source}`].filter(Boolean).join('::')));
  let added = 0;
  for (const c of rows) {
    const k = [normEmail(c.email), normPhone(c.phone), c.name && `${c.name.toLowerCase()}|${c.source}`].filter(Boolean).join('::');
    if (!k || keys.has(k)) continue; keys.add(k); out.push(c); added++;
  }
  return { merged: out, added };
}

// ── 1. Create or update Attero company row ──────────────────────
const companyPayload = {
  slug: 'attero-recycling-pvt-ltd',
  legal_name: 'Attero Recycling Private Limited',
  trade_name: 'Attero',
  parent_company_id: null,
  is_group_holding: false,
  cin: 'U28931UR2008PTC032573',
  website: 'https://www.attero.in',
  registered_address: '2, Green Park, Saharanpur Road, Dehradun, Uttarakhand – 248001, India',
  registered_state: 'Uttarakhand',
  description: 'India\'s leading e-waste + lithium-ion battery recycling company (founded 2008). Incorporated in Uttarakhand, HQ in Noida, flagship plant in Roorkee. GSTIN validation confirms 13 state-branch registrations under PAN AAGCA8859A — covering UK, UP, DL, HR, KA, TN, GJ, MH, WB, KL, TG, TN and more.',
};

let companyId;
const { data: existingCo } = await sb.from('companies').select('id').eq('slug', companyPayload.slug).maybeSingle();
if (existingCo) {
  await sb.from('companies').update(companyPayload).eq('id', existingCo.id);
  companyId = existingCo.id;
  console.log(`✓ Attero company updated — ${companyId}`);
} else {
  const { data: inserted } = await sb.from('companies').insert(companyPayload).select('id').single();
  companyId = inserted.id;
  console.log(`✓ Attero company inserted — ${companyId}`);
}

// ── 2. Link the one facility we have ──────────────────────────────
const { data: uk } = await sb.from('recyclers').select('id, contacts_all, websites_all').eq('recycler_code', 'CPCB-UK-001').single();
const atteroContacts = [
  { name: 'Nitin Gupta',            title: 'Managing Director & Co-Founder',  department: null, email: null, phone: null, source: S_BB,  first_seen: TODAY },
  { name: 'Rohan Gupta',            title: 'Director & Co-Founder',           department: null, email: null, phone: null, source: S_ZC,  first_seen: TODAY },
  { name: 'Satya Sunder Tripathi',  title: 'Director',                        department: null, email: null, phone: null, source: S_ZC,  first_seen: TODAY },
];
const atteroWebsites = [
  { url: 'https://www.attero.in', source: S_WEB, first_seen: TODAY },
];
const { merged: mergedContacts, added: addedContacts } = merge(uk.contacts_all, atteroContacts);
const wExist = uk.websites_all ?? [];
const wUrls = new Set(wExist.map(w => (w.url ?? '').toLowerCase()));
const mergedWebsites = [...wExist, ...atteroWebsites.filter(w => !wUrls.has(w.url.toLowerCase()))];

await sb.from('recyclers').update({
  company_id: companyId,
  unit_name: 'Roorkee Plant — E-Waste + Li-Ion Battery (Flagship)',
  address: '173, Raipur Industrial Area, Bhagwanpur, Roorkee, Uttarakhand – 247661, India',
  city: 'Roorkee',
  pincode: '247661',
  website: 'https://www.attero.in',
  contact_person: 'Nitin Gupta (MD & Co-Founder)',
  contacts_all: mergedContacts,
  websites_all: mergedWebsites,
  notes: 'Flagship facility — one of India\'s largest e-waste recycling units. Lithium-ion battery recycling capacity added in 2019. Parent entity (Attero Recycling Pvt Ltd) has 13 state-branch GSTINs confirmed via validator.',
}).eq('id', uk.id);
console.log(`✓ CPCB-UK-001 enriched — contacts +${addedContacts}, linked to company, plant address set`);

console.log('\nDone.');
