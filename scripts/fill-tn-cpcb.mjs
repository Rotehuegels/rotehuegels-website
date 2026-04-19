#!/usr/bin/env node
/**
 * Apply contacts found by the CPCB-TN e-waste research pass (Agent A).
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
  'CPCB-TN-009':  { email: 'apac@aerworldwide.com', phone: null,             note: 'AER Worldwide India — apac@aerworldwide.com from aerworldwide.com/asia' },
  'CPCB-TN-013':  { email: null,                    phone: '+919940831313',  note: 'Envirogreen (Virogreen India) — IndiaMart profile corporate phone' },
  'CPCB-TN-032':  { email: 'enquiry@ascentrecyclers.com', phone: '+919940408394', note: 'Ascent Urban Recyclers — from ascentrecyclers.com/pages/contact' },
  'CPCB-TN-034':  { email: null,                    phone: '+914422326906',  note: 'BEL E-Process House — Chennai BEL unit (bel-india.in/manufacturing-units/chennai-unit-2)' },
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
  update.notes = row.notes
    ? (row.notes.includes('[contacts') ? row.notes : `${row.notes}\n[contacts ${TODAY}] ${spec.note}`)
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
