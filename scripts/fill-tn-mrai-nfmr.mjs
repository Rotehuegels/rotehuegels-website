#!/usr/bin/env node
/**
 * Apply contacts found by the MRAI/NFMR/TNPCB research pass (Agent B).
 * Sources: company websites, Zaubacorp MCA records, IndiaMart listings.
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
  'MRAI-TN-006':  { email: 'padmanabhan@himalayatrading.in', phone: '+914443530301', note: 'Himalaya Trading — from himalayatrading.co.in/contact.htm' },
  'MRAI-TN-008':  { email: 'info@jcalloys.com',              phone: '+914224292300', note: 'Jayachandran Alloys — from jcalloys.com/contact-us.php' },
  'MRAI-TN-011':  { email: 'ksr2018.recyclers@gmail.com',     phone: null,            note: 'Kannappan Saai Recyclers — MCA via Zaubacorp (CIN U28999TZ2018PTC030917)' },
  'MRAI-TN-015':  { email: 'mail@sakthigroup.co',             phone: '+914423611826', note: 'Sakthi Ferro Alloys — from sakthisteels.com/contact-us' },
  'NFMR-TN-004':  { email: null,                              phone: '+914242223637', note: 'Sayee Chem Industries — from sayeechem.com/contact.php' },
  'NFMR-TN-006':  { email: 'pmarc@vsnl.net',                  phone: '+914426811280', note: 'Promptek Metal Alloys — from IndiaMart profile' },
  'NFMR-TN-008':  { email: null,                              phone: '+914312411394', note: 'Sylvan Farm Chemicals — Trichy corporate office (MCA CIN U24121TN1990PTC020103); Musiri is plant' },
  'NFMR-TN-009':  { email: 'caress@caressindustries.com',     phone: '+919842840275', note: 'Caress Industries — from caressindustries.com/contact-5' },
  'TNPCB-DM-015': { email: 'baskaranscrap@rediffmail.com',    phone: '+918778458025', note: 'World Scrap Stars Recycling Solutions — MCA via Zaubacorp' },
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
  const tag = `[contacts ${TODAY}] ${spec.note}`;
  update.notes = row.notes
    ? (row.notes.includes('[contacts') ? row.notes : `${row.notes}\n${tag}`)
    : tag;

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
