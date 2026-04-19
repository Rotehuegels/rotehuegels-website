#!/usr/bin/env node
/**
 * Fill email + phone for the 3 remaining medium-sized TN entities where
 * corporate contacts are publicly disclosed.
 *
 * Run: node --env-file=.env.local scripts/fill-tn-mid-size.mjs [--dry-run]
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
  'BPACK-TN-001': {
    email: 'indiaenquiry@deltaww.com',
    phone: '+914442726000',
    extras: [
      { name: null, title: 'Customer Care', email: 'customercare.india@deltaww.com', phone: null },
    ],
    note: 'Delta Electronics India — Krishnagiri Plant',
  },
  'BWM-TN-002': {
    email: 'contact@bridgegreen.in',
    phone: '+919176646262',
    extras: [
      { name: null, title: 'Operations', email: 'operations@bridgegreen.in', phone: null },
    ],
    note: 'Bridge Green Upcycle — Gummidipundi (10 TPD), Guindy (30-50 kg/day), Navallur (3 TPD upcoming)',
  },
  'MAJ-TN-001': {
    email: 'info@trimexgroup.com',
    phone: '+914443442777',
    extras: [
      { name: null, title: 'Trimex Sands', email: 'ts@trimexgroup.com', phone: null },
    ],
    note: 'Trimex Sands — Srikakulam + corporate HQ Chennai',
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
  const { data: row } = await sb.from('recyclers').select('id, company_name, email, phone, contacts_all, notes').eq('recycler_code', code).maybeSingle();
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
