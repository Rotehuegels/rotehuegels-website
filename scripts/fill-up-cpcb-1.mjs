#!/usr/bin/env node
/**
 * Apply contacts from UP CPCB-1 research pass (Agent D).
 * 5 new hits + 1 refinement on Narora (agent found more specific landline + HR email).
 */
import { createClient } from '@supabase/supabase-js';

const DRY = process.argv.includes('--dry-run');
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const SOURCE = 'research-agent';
const TODAY = new Date().toISOString().slice(0, 10);

const CONTACTS = {
  'CPCB-UP-019': {
    // Narora local landline + HR email (already has NPCIL HQ email from earlier pass).
    email: null,
    phone: '+915734223759',
    extras: [{ title: 'HR Contact', email: 'maheshrath@npcil.co.in' }],
    note: 'Narora Atomic Power Station — local landline + HR contact (from NPCIL stations page)',
  },
  'CPCB-UP-020': {
    email: 'admin@metalalloy.co.in',
    phone: '+919415303044',
    note: 'Metal Alloys Varanasi — E-46 Industrial Area Ramnagar (CPCB/DPCC authorised list)',
  },
  'CPCB-UP-033': {
    email: 'ddeepak1966@gmail.com',
    phone: null,
    note: 'V.R. Techno Enviro Services Pvt Ltd Lucknow — MCA-registered director email (CIN U74900UP2011PTC045202)',
  },
  'CPCB-UP-046': {
    email: 'info@rudraaenterprises.com',
    phone: null,
    note: 'Rudra Enterprises — Tronica City Loni Ghaziabad (rudraaenterprises.com/contact)',
  },
  'CPCB-UP-047': {
    email: 'avgree.recycling@gmail.com',
    phone: null,
    note: 'Avgree Recycling Pvt Ltd — MCA-registered email (CIN U74999DL2017PTC326941; note: registered office Delhi, plant may differ from CPCB address)',
  },
  'CPCB-UP-054': {
    email: 'info@rdrecycler.com',
    phone: '+919999470052',
    note: 'R.D. Recyclers — Khasra 46 Shakharpur Hapur Road Meerut (contact Reyazuddin Malik)',
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
  const { data: row } = await sb.from('recyclers').select('id, email, phone, contacts_all, notes').eq('recycler_code', code).maybeSingle();
  if (!row) { console.log(`✗ ${code}: not found`); skipped++; continue; }

  const rows = [];
  if (spec.email || spec.phone) rows.push({ name: null, title: null, department: null, email: spec.email, phone: spec.phone, source: SOURCE, first_seen: TODAY });
  for (const x of spec.extras ?? []) rows.push({ name: null, title: x.title ?? null, department: null, email: x.email ?? null, phone: x.phone ?? null, source: SOURCE, first_seen: TODAY });

  const { merged, added } = mergeContacts(row.contacts_all, rows);
  const update = {};
  if (!realStr(row.email) && spec.email) update.email = spec.email;
  if (!realStr(row.phone) && spec.phone) update.phone = spec.phone;
  if (added) update.contacts_all = merged;
  update.notes = row.notes
    ? (row.notes.includes(spec.note.slice(0, 30)) ? row.notes : `${row.notes}\n[contacts ${TODAY}] ${spec.note}`)
    : `[contacts ${TODAY}] ${spec.note}`;

  if (!Object.keys(update).filter(k => k !== 'notes').length) { skipped++; console.log(`- ${code}: complete`); continue; }
  if (DRY) { console.log(`~ ${code}`); updated++; continue; }
  const { error } = await sb.from('recyclers').update(update).eq('id', row.id);
  if (error) { console.log(`✗ ${code}: ${error.message}`); skipped++; continue; }
  updated++;
  const parts = [];
  if (update.email) parts.push(`email=${update.email}`);
  if (update.phone) parts.push(`phone=${update.phone}`);
  if (added) parts.push(`+${added} contacts`);
  console.log(`✓ ${code.padEnd(14)} ${parts.join(' ')}`);
}
console.log(`\n${DRY ? 'DRY RUN — ' : ''}updated ${updated}, skipped ${skipped}`);
