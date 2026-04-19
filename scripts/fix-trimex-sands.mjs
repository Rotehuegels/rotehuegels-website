#!/usr/bin/env node
/**
 * Correct the Trimex Sands (MAJ-TN-001) contacts with verified data from
 * trimexsands.com/contact. The earlier entry guessed a trimexgroup.com
 * domain that doesn't belong to this entity.
 *
 * Verified from https://www.trimexsands.com/contact.php :
 *   Registered Office: Trimex Tower, 1 Subbaraya Avenue, CP Ramaswamy Road,
 *                      Alwarpet, Chennai 600018
 *     Phone  +91-44-24988822
 *     Fax    +91-44-24986047
 *     Email  info@trimexsands.com
 *     Sales  sales@trimexsands.com
 *   Site Office: Vatsavalasa Village, Gara Mandal, Srikakulam 532404, AP
 *     Phone  +91 08942 283755
 */
import { createClient } from '@supabase/supabase-js';

const DRY = process.argv.includes('--dry-run');
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const TODAY = new Date().toISOString().slice(0, 10);
const SOURCE = 'corporate-public-disclosure';

const CORRECT = {
  email: 'info@trimexsands.com',
  phone: '+914424988822',  // Chennai registered office landline
  contacts: [
    { name: null, title: 'Registered Office — Chennai',   department: null, email: 'info@trimexsands.com',  phone: '+914424988822', source: SOURCE, first_seen: TODAY },
    { name: null, title: 'Sales & Marketing',             department: null, email: 'sales@trimexsands.com', phone: null,            source: SOURCE, first_seen: TODAY },
    { name: null, title: 'Site Office — Srikakulam AP',   department: null, email: null,                    phone: '+918942283755', source: SOURCE, first_seen: TODAY },
  ],
  note: 'Trimex Sands Pvt Ltd — verified from trimexsands.com/contact (corrected from earlier trimexgroup.com guess). Registered office Alwarpet Chennai; mining at Srikurmam/Srikakulam AP.',
};

const { data: row } = await sb.from('recyclers')
  .select('id, company_name, email, phone, contacts_all, notes')
  .eq('recycler_code', 'MAJ-TN-001')
  .maybeSingle();
if (!row) { console.error('✗ MAJ-TN-001 not found'); process.exit(1); }

console.log('Before:');
console.log(`  email: ${row.email}`);
console.log(`  phone: ${row.phone}`);
console.log(`  contacts_all: ${JSON.stringify(row.contacts_all, null, 2)}`);

// Purge any previous trimexgroup.com entries, then append the verified rows.
const existing = Array.isArray(row.contacts_all) ? row.contacts_all : [];
const cleaned = existing.filter(c => {
  const email = (c.email ?? '').toLowerCase();
  const phone = (c.phone ?? '').replace(/\D/g, '');
  return !email.includes('trimexgroup')
      && phone !== '4443442777'
      && phone !== '914443442777';
});

// Merge the 3 verified entries (dedup by email|phone|name+source key).
const normE = (e) => e?.toLowerCase().trim();
const normP = (p) => p?.replace(/\D/g, '').replace(/^91/, '');
const keys = new Set(cleaned.map(c => [normE(c.email), normP(c.phone), `${c.name}|${c.source}`].filter(Boolean).join('::')));
for (const c of CORRECT.contacts) {
  const k = [normE(c.email), normP(c.phone), c.name && `${c.name}|${c.source}`].filter(Boolean).join('::');
  if (k && !keys.has(k)) { keys.add(k); cleaned.push(c); }
}

const update = {
  email: CORRECT.email,   // overwrite the wrong trimexgroup.com primary
  phone: CORRECT.phone,   // overwrite the wrong phone
  contacts_all: cleaned,
  notes: (row.notes ?? '') + `\n[contacts ${TODAY}] ${CORRECT.note}`,
};

if (DRY) {
  console.log('\nDRY RUN — would update to:');
  console.log(`  email: ${update.email}`);
  console.log(`  phone: ${update.phone}`);
  console.log(`  contacts_all count: ${cleaned.length}`);
  process.exit(0);
}

const { error } = await sb.from('recyclers').update(update).eq('id', row.id);
if (error) { console.error('✗ update failed:', error.message); process.exit(1); }
console.log('\n✓ MAJ-TN-001 updated');
console.log(`  email: ${update.email}`);
console.log(`  phone: ${update.phone}`);
console.log(`  contacts_all count: ${cleaned.length}`);
