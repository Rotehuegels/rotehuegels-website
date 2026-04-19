#!/usr/bin/env node
/**
 * Apply contacts from Gujarat CPCB+MRAI research pass (Agent C).
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
  'CPCB-GJ-004': { email: 'enquiry@eprocesshouse.com',  phone: '+912606532050', note: 'E-Process House Vapi — eprocesshouse.com/contact.html' },
  'CPCB-GJ-010': { email: 'galaxyrecycling@gmail.com',   phone: '+919328259627', note: 'Galaxy Recycling Rajkot — GPCB e-waste recyclers list' },
  'CPCB-GJ-018': { email: 'electro.wastesolutions@gmail.com', phone: '+919898357038', note: 'Electro Waste Solutions Panchmahal — GPCB e-waste recyclers list' },
  'CPCB-GJ-031': { email: 'info@reartrecycling.com',     phone: '+919409181636', note: 'Reart Recycling Rajkot — reartrecycling.com' },
  'CPCB-GJ-032': { email: 'niyati@shotformats.com',      phone: null,            note: 'Tvarita Phones Valsad — MCA via Zaubacorp (parent Shotformats Digital)' },
  'CPCB-GJ-033': { email: 'prakashnagora1822@gmail.com', phone: '+919998680123', note: 'Kalpana E-Recyclers Ahmedabad — GST+TheCompanyCheck record' },
  'CPCB-GJ-038': { email: 'hasan.khan28708@gmail.com',   phone: '+919825028708', note: 'New India Sales Corporation Bharuch — GPCB e-waste recyclers list' },
  'MRAI-GJ-001': { email: null,                          phone: '+918037402155', note: 'Aadarsh Filament Industries — IndiaMart profile (partner Ankit Rakholia)' },
  'MRAI-GJ-009': { email: 'deepakbaldi@gmail.com',       phone: '+919825212482', note: 'Baldi Metals & Alloys — IndiaMart (landline 0288-2561446 also)' },
  // Refinements — already filled in majors round 2, dedupe will skip duplicates
  'MRAI-GJ-005': { email: 'akshat@akshatpapers.com',     phone: null,            note: 'Akshat Papers — additional company mailbox from akshatpapers.com/contact-us' },
  'CPCB-GJ-022': { email: null,                          phone: '+919909994344', note: 'BEIL Bharuch — additional mobile contact from beil.co.in/contact-us' },
  'MRAI-GJ-010': { email: null,                          phone: '+919909994344', note: 'BEIL Infrastructure — same entity as CPCB-GJ-022' },
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

  const c = { name: null, title: null, department: null, email: spec.email, phone: spec.phone, source: SOURCE, first_seen: TODAY };
  const { merged, added } = mergeContacts(row.contacts_all, [c]);

  const update = {};
  if (!realStr(row.email) && spec.email) update.email = spec.email;
  if (!realStr(row.phone) && spec.phone) update.phone = spec.phone;
  if (added) update.contacts_all = merged;
  const noteTag = `[contacts ${TODAY}] ${spec.note}`;
  update.notes = row.notes
    ? (row.notes.includes(spec.note.slice(0, 30)) ? row.notes : `${row.notes}\n${noteTag}`)
    : noteTag;

  if (!Object.keys(update).filter(k => k !== 'notes').length) { skipped++; console.log(`- ${code}: already complete`); continue; }
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
