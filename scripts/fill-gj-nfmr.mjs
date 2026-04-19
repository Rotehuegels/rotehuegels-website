#!/usr/bin/env node
/**
 * Apply contacts from Gujarat NFMR Jamnagar cluster (Agent F, round 2).
 * Note: NFMR-GJ-037 Siyaram Impex Pvt Ltd shares contacts with NFMR-GJ-007
 * Siyaram Metal — agent confirmed same corporate entity.
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
  'NFMR-GJ-003': { email: 'info@madhavextrusions.com', phone: null,            note: 'Madhav Extrusions — IndiaMart madhavextrusions/aboutus' },
  'NFMR-GJ-004': { email: null,                        phone: '+919427772689', note: 'Ambica Recycling Jamnagar — IndiaMart ambicarecycling/aboutus' },
  'NFMR-GJ-007': { email: 'info@siyaramimpex.com',     phone: '+919825220500', note: 'Siyaram Metal Pvt Ltd — siyaramimpex.com' },
  'NFMR-GJ-019': { email: null,                        phone: '+919820267270', note: 'D&G Metal Inc — bharatibiz.com listing' },
  'NFMR-GJ-020': { email: 'info@senormetals.in',       phone: '+912882730251', note: 'Senor Metals Pvt Ltd — senormetals.in/contact' },
  'NFMR-GJ-021': { email: null,                        phone: '+912882560988', note: 'Mahalaxmi Extrusions — mahalaxmiextrusions.in' },
  'NFMR-GJ-022': { email: 'info@marvelmetalimpex.com', phone: null,            note: 'Marvel Metal Corporation — marvelmetalimpex.com/contact' },
  'NFMR-GJ-023': { email: 'info@sterling-ent.com',     phone: '+912882563772', note: 'Sterling Enterprises — sterling-ent.com' },
  'NFMR-GJ-025': { email: 'info@pranamimetal.com',     phone: '+918866550044', note: 'Pranami Metal — pranamimetal.com/contact' },
  'NFMR-GJ-035': { email: 'aksharexport@gmail.com',    phone: '+912882730587', note: 'Akshar Exports — aksharexports.com/contact' },
  'NFMR-GJ-037': { email: 'info@siyaramimpex.com',     phone: '+919825220500', note: 'Siyaram Impex Pvt Ltd — same corporate entity as Siyaram Metal' },
  'NFMR-GJ-038': { email: 'info@meridianimp.com',      phone: '+912882567520', note: 'Meridian Impex — IndiaMart meridianimp/aboutus' },
  'NFMR-GJ-041': { email: null,                        phone: '+912882730334', note: 'Divine Impex — IndiaMart divine-impex-inc/aboutus' },
  'NFMR-GJ-056': { email: 'kbi37@satyam.net.in',       phone: '+912882560849', note: 'Khandelwal Brass Industries — khandelwalbrass.com/contact_us' },
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
