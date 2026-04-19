#!/usr/bin/env node
/**
 * Apply contacts from UP round-2 research pass (Agent E).
 * Skips:
 *   - MRAI-UP-007 Eodis (agent found sales@eodis.biz but noted it's a spices
 *     company — wrong entity, don't apply).
 *   - CPCB-UP-107 phone 8048xxxxx (IndiaMart virtual routing number).
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
  'CPCB-UP-080': { email: 'sales@sheetalawaste.com', phone: '+919643764441', note: 'Sheetala Waste Management — sheetalawaste.com/contact' },
  'CPCB-UP-081': { email: null,                      phone: '+919990927652', note: 'Spreco Resource Recyclers — sprecoresourcerecyclers.com' },
  'CPCB-UP-082': { email: 'info@hindrecycling.co.in', phone: null,           note: 'Hind Recycling Pvt Ltd — hindrecycling.com/contact' },
  'CPCB-UP-086': { email: 'inquiry@limrrecycling.com', phone: '+919990902850', note: 'LIMR Recycling Pvt Ltd — limrrecycling.com' },
  'CPCB-UP-098': { email: null,                      phone: '+917487889659', note: 'Sun E-Waste Recycling Mathura — Justdial listing' },
  'CPCB-UP-103': { email: 'sourcing@jsdewaste.com',   phone: '+919999461999', note: 'JSD Enterprises — jsdewaste.com/contact' },
  'MRAI-UP-003': { email: 'chopra027@gmail.com',      phone: null,           note: 'CMU Metals Pvt Ltd — MCA-registered director email (CIN U28990DL2020PTC369722, Delhi-registered)' },
  'MRAI-UP-006': { email: 'accounts@elconalloys.com', phone: null,           note: 'Elcon Alloys Pvt Ltd — elconalloys.com + Zaubacorp MCA' },
  'NFMR-UP-012': { email: 'lohiabrass@gmail.com',     phone: null,           note: 'Lohia Brass Pvt Ltd — IndiaMart indiamart.com/lohia-brass (CIN U27201UP1988PTC009574)' },
  'NFMR-UP-014': { email: 'info@chadhaexports.com',   phone: null,           note: 'Chadha Brass Limited — Zaubacorp MCA (CIN U27201UP1993PLC015362)' },
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
