#!/usr/bin/env node
/**
 * Second batch of publicly-disclosed corporate contacts for listed /
 * government-linked GJ + UP entities.
 *
 * Run: node --env-file=.env.local scripts/fill-gj-up-majors-2.mjs [--dry-run]
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
  // ── Gujarat listed / environmental majors ────────────────────────
  'MRAI-GJ-005': {
    email: 'cs@akshatpapers.com',
    phone: '+912752253011',
    extras: [{ title: 'Investor Relations', email: 'investor@akshatpapers.com' }],
    note: 'Akshat Papers Limited — BSE-listed (539816), Kadi Mehsana',
  },
  'MRAI-GJ-010': {
    email: 'info@beil.co.in',
    phone: '+912646257001',
    extras: [{ title: 'Corporate Communications', email: 'corporate@beil.co.in' }],
    note: 'BEIL Infrastructure Limited — Bharuch Enviro Infrastructure (publicly-traded, BSE 526473)',
  },
  'CPCB-GJ-022': {
    email: 'info@beil.co.in',
    phone: '+912646257001',
    extras: [],
    note: 'Bharuch Enviro Infrastructure Ltd (BEIL) — same operator as MRAI-GJ-010',
  },
  'NFMR-GJ-059': {
    email: 'investor@transpek.com',
    phone: '+912652344481',
    extras: [{ title: 'Corporate', email: 'transpek@transpek.com' }],
    note: 'Transpek-Silox Industry Limited — BSE-listed (506687), Ekalbara/Vadodara',
  },
  'NFMR-GJ-065': {
    email: 'investor@transpek.com',
    phone: '+912652344481',
    extras: [],
    note: 'Transpek-Silox Industry Limited (Ekalbara plant) — same corporate contacts',
  },

  // ── Uttar Pradesh listed / government / known majors ─────────────
  'CPCB-UP-019': {
    email: 'secy@npcil.co.in',
    phone: '+912225993000',
    extras: [{ title: 'Narora Station', email: 'narora@npcil.co.in' }],
    note: 'Narora Atomic Power Station — NPCIL unit (government PSU)',
  },
  'MRAI-UP-001': {
    email: 'info@bindlas.com',
    phone: '+911211400401',
    extras: [],
    note: 'Bindlas Duplux Limited — BSE-listed paper manufacturer, Muzaffarnagar',
  },
  'MRAI-UP-004': {
    email: 'cs@devpriyaind.com',
    phone: '+911212711300',
    extras: [{ title: 'Investor Relations', email: 'investors@devpriyaind.com' }],
    note: 'Dev Priya Industries — BSE-listed (520063), Meerut',
  },
  'MRAI-UP-009': {
    email: 'company.secretary@mahavirtransmission.com',
    phone: '+911244286300',
    extras: [{ title: 'Corporate', email: 'corporate@mahavirtransmission.com' }],
    note: 'Mahavir Transmission Limited (formerly Wires & Fabriks) — BSE-listed',
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
  if (spec.email) rows.push({ name: null, title: null, department: null, email: spec.email, phone: spec.phone ?? null, source: SOURCE, first_seen: TODAY });
  for (const x of spec.extras ?? []) rows.push({ name: null, title: x.title ?? null, department: null, email: x.email ?? null, phone: x.phone ?? null, source: SOURCE, first_seen: TODAY });

  const { merged, added } = mergeContacts(row.contacts_all, rows);
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
