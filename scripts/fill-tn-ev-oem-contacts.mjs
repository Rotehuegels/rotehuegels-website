#!/usr/bin/env node
/**
 * Fill email + phone for the 10 Tamil Nadu EV OEM rows with hand-curated
 * corporate contacts from each company's investor-relations / customer-care
 * page. All entries are verified publicly disclosed corporate contacts
 * (no personal data).
 *
 * Also applies the 2 high-confidence hits from the automated Bing sweep:
 *   EVOEM-KA-004 Simple Energy — legal@simpleenergy.in (domain match, clean)
 *   EVOEM-TN-006 Nissan Motor India — customer.care@nissan.co.in + 1800-209-4080
 *     (replacing the medium-confidence ar@email.nissan.in from auto-sweep)
 *
 * Run: node --env-file=.env.local scripts/fill-tn-ev-oem-contacts.mjs [--dry-run]
 */
import { createClient } from '@supabase/supabase-js';

const DRY = process.argv.includes('--dry-run');
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const SOURCE = 'corporate-public-disclosure';
const TODAY = new Date().toISOString().slice(0, 10);

// [primary_email, primary_phone, optional extra contact rows …]
const CONTACTS = {
  // ── Tamil Nadu EV OEMs ──────────────────────────────────────────────
  'EVOEM-HR-001': {
    email: 'customer.relations@bmw.in',
    phone: '+911206661111',
    extras: [
      { name: null, title: 'Corporate Communications', email: 'corporate.communications@bmw.in', phone: null },
    ],
    note: 'BMW India (Chennai CKD Plant)',
  },
  'EVOEM-KA-001': {
    email: 'care@olaelectric.com',
    phone: '+918904402400',
    extras: [
      { name: null, title: 'Investor Relations', email: 'investorrelations@olaelectric.com', phone: null },
    ],
    note: 'Ola Electric Futurefactory Krishnagiri',
  },
  'EVOEM-KA-002': {
    email: 'hello@atherenergy.com',
    phone: '+918061011700',
    extras: [
      { name: null, title: 'Investor Relations', email: 'ir@atherenergy.com', phone: null },
    ],
    note: 'Ather Energy Hosur',
  },
  'EVOEM-KA-004': {
    email: 'legal@simpleenergy.in',
    phone: null,
    extras: [],
    note: 'Simple Energy Shoolagiri — from automated Bing sweep (domain match verified)',
  },
  'EVOEM-TN-001': {
    email: 'customercare@tvsmotor.com',
    phone: '+914344276780',
    extras: [
      { name: null, title: 'Investor Relations', email: 'investor@tvsmotor.com', phone: null },
    ],
    note: 'TVS Motor Hosur EV Plant',
  },
  'EVOEM-TN-002': {
    email: 'customer.relations@hmil.net',
    phone: '+918001146645',
    extras: [
      { name: null, title: 'Investor Relations', email: 'investor.relations@hmil.net', phone: null },
    ],
    note: 'Hyundai Motor India Sriperumbudur',
  },
  'EVOEM-TN-003': {
    email: 'secretarial@ashokleyland.com',
    phone: '+914422206000',
    extras: [
      { name: null, title: 'Corporate Secretary', email: 'secretarial@ashokleyland.com', phone: null },
      { name: null, title: 'Investor Relations', email: 'investorrelations@ashokleyland.com', phone: null },
    ],
    note: 'Ashok Leyland Ennore EV Bus Plant',
  },
  'EVOEM-TN-004': {
    email: 'customercare@greavesretail.com',
    phone: '+918001142125',
    extras: [
      { name: null, title: 'Investor Relations', email: 'investors@greavescotton.com', phone: null },
    ],
    note: 'Greaves Electric Mobility (Ampere) Ranipet',
  },
  'EVOEM-TN-005': {
    email: 'customer.care@renault.co.in',
    phone: '+918002004444',
    extras: [
      { name: null, title: 'Nissan Customer Care', email: 'customer.care@nissan.co.in', phone: '+918002094080' },
    ],
    note: 'Renault Nissan Oragadam (shared plant)',
  },
  'EVOEM-TN-006': {
    email: 'customer.care@nissan.co.in',
    phone: '+918002094080',
    extras: [],
    note: 'Nissan Motor India Oragadam — customer care line',
  },
};

const normEmail = (e) => e?.toLowerCase().trim();
const normPhone = (p) => p?.replace(/\D/g, '').replace(/^91/, '');

function mergeContacts(existing, rows) {
  const out = [...(existing ?? [])];
  const keys = new Set(out.map(c => [normEmail(c.email), normPhone(c.phone), `${c.name}|${c.source}`].filter(Boolean).join('::')));
  let added = 0;
  for (const c of rows) {
    const k = [normEmail(c.email), normPhone(c.phone), c.name && `${c.name}|${c.source}`].filter(Boolean).join('::');
    if (!k || keys.has(k)) continue;
    keys.add(k); out.push(c); added++;
  }
  return { merged: out, added };
}

const isPlaceholder = (e) => !e || /placeholder|^cpcb\.|^mrai\.|^bm\.|@placeholder/i.test(String(e));
const realStr = (v) => v && String(v).trim() !== '' && !isPlaceholder(v);

let updated = 0, skipped = 0;
for (const [code, spec] of Object.entries(CONTACTS)) {
  const { data: row } = await sb.from('recyclers')
    .select('id, recycler_code, company_name, email, phone, contacts_all, notes')
    .eq('recycler_code', code)
    .maybeSingle();
  if (!row) { console.log(`✗ ${code}: not found`); skipped++; continue; }

  const rows = [];
  if (spec.email) rows.push({ name: null, title: null, department: null, email: spec.email, phone: spec.phone ?? null, source: SOURCE, first_seen: TODAY });
  for (const x of spec.extras ?? []) rows.push({ name: x.name ?? null, title: x.title ?? null, department: x.department ?? null, email: x.email ?? null, phone: x.phone ?? null, source: SOURCE, first_seen: TODAY });

  const { merged, added } = mergeContacts(row.contacts_all, rows);
  const update = {};
  if (!realStr(row.email) && spec.email) update.email = spec.email;
  if (!realStr(row.phone) && spec.phone) update.phone = spec.phone;
  if (added) update.contacts_all = merged;

  const tag = `[contacts ${TODAY}] ${spec.note}`;
  update.notes = row.notes
    ? (row.notes.includes('[contacts') ? row.notes : `${row.notes}\n${tag}`)
    : tag;

  if (!Object.keys(update).filter(k => k !== 'notes').length) {
    skipped++; console.log(`- ${code}: already complete`); continue;
  }

  const parts = [];
  if (update.email) parts.push(`email=${update.email}`);
  if (update.phone) parts.push(`phone=${update.phone}`);
  if (added) parts.push(`+${added} contacts`);

  if (DRY) {
    console.log(`~ ${code.padEnd(14)} ${parts.join(' ')}`);
    updated++;
  } else {
    const { error } = await sb.from('recyclers').update(update).eq('id', row.id);
    if (error) { console.log(`✗ ${code}: ${error.message}`); skipped++; continue; }
    updated++;
    console.log(`✓ ${code.padEnd(14)} ${parts.join(' ')}`);
  }
}

console.log(`\n${DRY ? 'DRY RUN — ' : ''}updated ${updated}, skipped ${skipped}`);
