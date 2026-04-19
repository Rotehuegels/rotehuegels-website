#!/usr/bin/env node
/**
 * One-off: enrich Jain Metal Group rows with data confirmed from
 * jainmetalgroup.com + MCA / ZaubaCorp / Tofler public filings.
 *
 * Sources:
 *  - https://www.jainmetalgroup.com/contact
 *  - https://www.zaubacorp.com/company/JAIN-RESOURCE-RECYCLING-PRIVATE-LIMITED/U27320TN2022PTC150206
 *  - https://www.tofler.in/jain-resource-recycling-limited/company/U27320TN2022PLC150206
 */
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const TODAY = new Date().toISOString().slice(0, 10);
const normEmailKey = (e) => e?.toLowerCase().trim();
const normPhoneKey = (p) => p?.replace(/\D/g, '').replace(/^91/, '');

function mergeContacts(existing, rows) {
  const out = [...(existing ?? [])];
  const keys = new Set(out.map(c => [normEmailKey(c.email), normPhoneKey(c.phone), c.name && `${c.name.toLowerCase()}|${c.source}`].filter(Boolean).join('::')));
  let added = 0;
  for (const c of rows) {
    const k = [normEmailKey(c.email), normPhoneKey(c.phone), c.name && `${c.name.toLowerCase()}|${c.source}`].filter(Boolean).join('::');
    if (!k || keys.has(k)) continue;
    keys.add(k); out.push(c); added++;
  }
  return { merged: out, added };
}
function mergeWebsites(existing, rows) {
  const out = [...(existing ?? [])];
  const urls = new Set(out.map(w => (w.url ?? '').toLowerCase()));
  let added = 0;
  for (const w of rows) {
    const u = (w.url ?? '').toLowerCase();
    if (!u || urls.has(u)) continue;
    urls.add(u); out.push(w); added++;
  }
  return { merged: out, added };
}

// ── Jain Resource Recycling Limited — public parent entity (METAL-TN-001) ─
const SRC_WEB = 'jainmetalgroup.com';
const SRC_MCA = 'MCA / ZaubaCorp 2026-04-19';

const jrrContacts = [
  { name: 'Kamlesh Jain',            title: 'Chairman & Managing Director', department: null, email: null, phone: null, source: SRC_MCA, first_seen: TODAY },
  { name: 'Hemant Shantilal Jain',   title: 'Executive Director & CFO',     department: 'Finance', email: null, phone: null, source: SRC_MCA, first_seen: TODAY },
  { name: 'Sanchit Jain',            title: 'Executive Director',           department: null, email: null, phone: null, source: SRC_MCA, first_seen: TODAY },
  { name: 'Hrithik Jain',            title: 'Managing Director',            department: null, email: null, phone: null, source: SRC_MCA, first_seen: TODAY },
  { name: 'Shreyansh Jain',          title: 'Director',                     department: null, email: null, phone: null, source: SRC_MCA, first_seen: TODAY },
  { name: 'Mayank Pareek',           title: 'Director',                     department: null, email: null, phone: null, source: SRC_MCA, first_seen: TODAY },
  { name: 'Dr. Kandaswamy Paramasivan', title: 'Independent Director',      department: null, email: null, phone: null, source: SRC_MCA, first_seen: TODAY },
  { name: null, title: 'General',     department: null, email: 'info@jainmetalgroup.com', phone: '+91 44 43409494', source: SRC_WEB, first_seen: TODAY },
  { name: null, title: 'General',     department: null, email: null,                       phone: '+91 44 42130100', source: SRC_WEB, first_seen: TODAY },
];

const jrrWebsites = [
  { url: 'https://www.jainmetalgroup.com', source: SRC_WEB, first_seen: TODAY },
];

// ── Jain Recycling Private Limited — plastics arm (METAL-TN-002) ──────────
const jrContacts = [
  { name: null, title: 'General', department: null, email: 'info@jainmetalgroup.com', phone: '+91 44 43409494', source: SRC_WEB, first_seen: TODAY },
  { name: null, title: 'General', department: null, email: 'jainrecycling@gmail.com', phone: null,               source: 'existing',  first_seen: TODAY },
];

async function updateRow(code, updates) {
  const { data: row } = await sb.from('recyclers').select('id, recycler_code, company_name, contacts_all, websites_all, email, phone, address, contact_person').eq('recycler_code', code).maybeSingle();
  if (!row) { console.log(`✗ ${code} — not found`); return; }

  const { merged: mergedContacts, added: addedContacts } = mergeContacts(row.contacts_all, updates.contacts ?? []);
  const { merged: mergedWebsites, added: addedWebsites } = mergeWebsites(row.websites_all, updates.websites ?? []);

  const patch = {};
  if (updates.gstin) patch.gstin = updates.gstin;
  if (updates.cin)   patch.cin = updates.cin;
  if (updates.address) patch.address = updates.address;
  if (updates.website && !row.website) patch.website = updates.website;
  if (updates.contact_person && (!row.contact_person || /registered facility|facility contact/i.test(row.contact_person))) patch.contact_person = updates.contact_person;
  if (updates.phone && !row.phone) patch.phone = updates.phone;
  if (addedContacts > 0) patch.contacts_all = mergedContacts;
  if (addedWebsites > 0) patch.websites_all = mergedWebsites;

  if (Object.keys(patch).length === 0) { console.log(`${code} — no changes`); return; }

  const { error } = await sb.from('recyclers').update(patch).eq('id', row.id);
  if (error) { console.log(`✗ ${code} — db: ${error.message}`); return; }
  console.log(`✓ ${code} — ${row.company_name}`);
  for (const k of Object.keys(patch)) {
    if (k === 'contacts_all') console.log(`   + contacts_all: +${addedContacts} (${mergedContacts.length} total)`);
    else if (k === 'websites_all') console.log(`   + websites_all: +${addedWebsites} (${mergedWebsites.length} total)`);
    else console.log(`   + ${k}: ${JSON.stringify(patch[k])}`);
  }
}

await updateRow('METAL-TN-001', {
  gstin: '33AAFCJ5145B1Z1',
  cin: 'U27320TN2022PLC150206',
  address: 'The Lattice, 4th Floor, Old No. 7/1, New No. 20, Bishop Ezra Sarugunam Road, Kilpauk, Chennai – 600010, Tamil Nadu, India',
  website: 'https://www.jainmetalgroup.com',
  contact_person: 'Kamlesh Jain (Chairman & MD)',
  phone: '+91 44 43409494',
  contacts: jrrContacts,
  websites: jrrWebsites,
});

await updateRow('METAL-TN-002', {
  cin: 'U27200TN2020PTC133771',
  website: 'https://www.jainmetalgroup.com',
  contact_person: 'Kamlesh Jain (Chairman & MD)',
  phone: '+91 44 43409494',
  address: 'The Lattice, 4th Floor, Old No. 7/1, New No. 20, Bishop Ezra Sarugunam Road, Kilpauk, Chennai – 600010, Tamil Nadu, India',
  contacts: jrContacts,
  websites: jrrWebsites,
});

console.log('\nDone.');
