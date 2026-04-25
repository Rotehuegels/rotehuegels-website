#!/usr/bin/env node
/**
 * Add the third Jain Metal Group facility — Jain Green Technologies
 * Pvt Ltd (Facility 3, aluminium division) — as METAL-TN-003, linked
 * into the already-seeded Jain Green Technologies company node.
 *
 * Source: https://www.jainmetalgroup.com — "aluminium alloy for
 * diecastors and primary alloys".
 *
 * Address is the registered office (Kilpauk, Chennai) — actual plant
 * location needs on-site verification; flagged in notes.
 */
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const TODAY = new Date().toISOString().slice(0, 10);
const KILPAUK = 'The Lattice, 4th Floor, Old No. 7/1, New No. 20, Bishop Ezra Sarugunam Road, Kilpauk, Chennai – 600010, Tamil Nadu, India';

// Make sure we don't create a duplicate
const { data: existing } = await sb.from('recyclers').select('id, recycler_code, company_id').eq('recycler_code', 'METAL-TN-003').maybeSingle();
if (existing) { console.log(`METAL-TN-003 already exists (id=${existing.id}). Will update instead of insert.`); }

// Find the company id
const { data: co } = await sb.from('companies').select('id').eq('slug', 'jain-green-technologies-pvt-ltd').single();
if (!co) { console.error('Jain Green Technologies company not found — run seed-jain-metal-group.mjs first'); process.exit(1); }

const payload = {
  recycler_code: 'METAL-TN-003',
  company_name: 'Jain Green Technologies Pvt Ltd',
  contact_person: 'Kamlesh Jain (Chairman & MD)',
  email: 'info@jainmetalgroup.com',
  phone: '+91 44 43409494',
  website: 'https://www.jainmetalgroup.com',
  address: KILPAUK,
  city: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600010',
  waste_type: 'hazardous',
  capacity_per_month: null,
  service_radius_km: 100,
  is_active: true,
  is_verified: true,
  verified_at: new Date().toISOString(),
  notes: 'Aluminium division of Jain Metal Group — primary alloys + diecasting alloys (Facility 3). Plant location needs on-site verification; address currently pointing to registered office in Kilpauk.',
  company_id: co.id,
  unit_name: 'Facility 3 — Aluminium',
  contacts_all: [
    { name: 'Kamlesh Jain',          title: 'Chairman & Managing Director', department: null, email: null, phone: null, source: 'MCA / ZaubaCorp 2026-04-19', first_seen: TODAY },
    { name: 'Hemant Shantilal Jain', title: 'Executive Director & CFO',     department: 'Finance', email: null, phone: null, source: 'MCA / ZaubaCorp 2026-04-19', first_seen: TODAY },
    { name: null, title: 'General',  department: null, email: 'info@jainmetalgroup.com', phone: '+91 44 43409494', source: 'jainmetalgroup.com', first_seen: TODAY },
  ],
  websites_all: [
    { url: 'https://www.jainmetalgroup.com', source: 'jainmetalgroup.com', first_seen: TODAY },
  ],
};

let op;
if (existing) {
  const { error } = await sb.from('recyclers').update(payload).eq('id', existing.id);
  if (error) { console.error(error.message); process.exit(1); }
  op = 'updated';
} else {
  const { error } = await sb.from('recyclers').insert(payload);
  if (error) { console.error(error.message); process.exit(1); }
  op = 'inserted';
}

console.log(`✓ ${op} METAL-TN-003 — Jain Green Technologies Pvt Ltd, linked to company ${co.id}`);
