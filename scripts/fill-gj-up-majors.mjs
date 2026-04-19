#!/usr/bin/env node
/**
 * Publicly-disclosed corporate contacts for the listed majors in Gujarat
 * and Uttar Pradesh that are still missing email/phone.
 *
 * Run: node --env-file=.env.local scripts/fill-gj-up-majors.mjs [--dry-run]
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

const CONTACTS = {
  // ── Gujarat EV / cell / CAM majors ───────────────────────────────
  'CAM-GJ-001': {
    email: 'corporate.comm@tatachemicals.com',
    phone: '+912266545600',
    extras: [
      { title: 'Investor Relations', email: 'investor.tcl@tatachemicals.com' },
    ],
    note: 'Tata Chemicals — Dholera Li-ion Cell + CAM Plant',
  },
  'CELL-GJ-001': {
    email: 'investor.relations@ril.com',
    phone: '+912244757000',
    extras: [
      { title: 'New Energy Comms', email: 'newenergy@ril.com' },
    ],
    note: 'Reliance New Energy Battery — Jamnagar Giga Complex',
  },
  'EVOEM-GJ-001': {
    email: 'customercare.india@mgmotor.co.in',
    phone: '+911204842000',
    extras: [
      { title: 'Corporate', email: 'corporate.affairs@mgmotor.co.in' },
    ],
    note: 'MG Motor India — Halol Plant',
  },
  'EVOEM-GJ-002': {
    email: 'contact@maruti.co.in',
    phone: '+911246781000',
    extras: [],
    note: 'Suzuki Motor Gujarat — Hansalpur Plant (eVitara Line)',
  },
  'EVOEM-GJ-003': {
    email: 'hello@matter.in',
    phone: '+917948977777',
    extras: [
      { title: 'Careers', email: 'careers@matter.in' },
    ],
    note: 'Matter Motor Works — Khodiyar Ahmedabad',
  },
  'EVOEM-HR-004': {
    email: 'customercare.india@mgmotor.co.in',
    phone: '+911204842000',
    extras: [],
    note: 'JSW MG Motor India JV — Halol Plant (shares MG customer care)',
  },

  // ── Uttar Pradesh listed majors ──────────────────────────────────
  'BPACK-UP-001': {
    email: 'customercare@livguard.com',
    phone: '+911204628393',
    extras: [
      { title: 'Investor Relations', email: 'investor.relations@livguard.com' },
    ],
    note: 'Livguard Energy Technologies — Noida Pack Plant',
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
    .select('id, company_name, email, phone, contacts_all, notes')
    .eq('recycler_code', code)
    .maybeSingle();
  if (!row) { console.log(`✗ ${code}: not found`); skipped++; continue; }

  const rows = [];
  if (spec.email) rows.push({ name: null, title: null, department: null, email: spec.email, phone: spec.phone ?? null, source: SOURCE, first_seen: TODAY });
  for (const x of spec.extras ?? []) rows.push({ name: x.name ?? null, title: x.title ?? null, department: null, email: x.email ?? null, phone: x.phone ?? null, source: SOURCE, first_seen: TODAY });

  const { merged, added } = mergeContacts(row.contacts_all, rows);
  const update = {};
  if (!realStr(row.email) && spec.email) update.email = spec.email;
  if (!realStr(row.phone) && spec.phone) update.phone = spec.phone;
  if (added) update.contacts_all = merged;
  const tag = `[contacts ${TODAY}] ${spec.note}`;
  update.notes = row.notes
    ? (row.notes.includes('[contacts') ? row.notes : `${row.notes}\n${tag}`)
    : tag;

  if (!Object.keys(update).filter(k => k !== 'notes').length) { skipped++; console.log(`- ${code}: complete`); continue; }

  if (DRY) { console.log(`~ ${code.padEnd(14)}`); updated++; continue; }
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
