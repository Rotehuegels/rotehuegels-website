#!/usr/bin/env node
/**
 * Fuzzy-match MRAI-parsed records to recyclers and populate the full
 * contacts_all / websites_all arrays (and the primary email/phone/
 * contact_person/website columns when missing or placeholder).
 *
 * contacts_all row shape:
 *   { name, title, department, email, phone, source, first_seen }
 *
 * Re-run safe: the script dedupes contacts by normalised (email/phone/name)
 * so running again won't create duplicate entries.
 *
 * Run: node --env-file=.env.local scripts/match-mrai-to-recyclers.mjs [--dry-run]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('Missing env'); process.exit(1); }
const sb = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

const DRY = process.argv.includes('--dry-run');
const PARSED = resolve('.buddy/mrai-parsed.json');
const mrai = JSON.parse(readFileSync(PARSED, 'utf8'));
console.log(`MRAI records loaded: ${mrai.length}`);

const SOURCE = 'MRAI 2019-20';
const TODAY = new Date().toISOString().slice(0, 10);

const NOISE = new Set([
  'the','and','of','pvt','private','ltd','limited','llp','inc','corp','company',
  'co','p','group','india','metals','metal','industries','industry','enterprises',
  'enterprise','recyclers','recycler','recycling','scrap','traders','trader',
  'exports','export','imports','import','international','global',
]);

function tokens(name) {
  return String(name).toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(w => w.length >= 3 && !NOISE.has(w));
}

function overlap(a, b) {
  const A = new Set(a), B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / Math.min(A.size, B.size);
}

const isPlaceholderEmail = (e) => !e || /placeholder|^cpcb\.|^mrai\./i.test(e);
const isRealValue = (v) => v && v.trim() && !/placeholder/i.test(v);
const normEmail = (e) => e?.toLowerCase().trim();
const normPhone = (p) => p?.replace(/\D/g, '').replace(/^91/, '');

// Merge a new batch of contact entries into an existing array, dedupe by
// whichever of (email | phone | name+source) is present.
function mergeContacts(existing, incoming) {
  const out = [...(existing ?? [])];
  const keys = new Set(out.map(c => [normEmail(c.email), normPhone(c.phone), `${c.name}|${c.source}`].filter(Boolean).join('::')));
  for (const c of incoming) {
    const k = [normEmail(c.email), normPhone(c.phone), c.name && `${c.name}|${c.source}`].filter(Boolean).join('::');
    if (!k || keys.has(k)) continue;
    keys.add(k);
    out.push(c);
  }
  return out;
}

function mergeWebsites(existing, incoming) {
  const out = [...(existing ?? [])];
  const urls = new Set(out.map(w => (w.url ?? '').toLowerCase()));
  for (const w of incoming) {
    const u = (w.url ?? '').toLowerCase();
    if (!u || urls.has(u)) continue;
    urls.add(u);
    out.push(w);
  }
  return out;
}

// Build contact rows from one MRAI record. Strategy:
//  - If both a named contact_person AND emails/phones exist, associate the
//    FIRST email+phone with that named person; extras get their own rows
//    (name=null) so generic mailboxes are still captured.
//  - If only emails/phones (no name), each becomes a row with name=null.
function contactRowsFor(m) {
  const rows = [];
  const emails = (m.emails ?? []).map(normEmail).filter(Boolean);
  const phones = (m.phones ?? []).filter(Boolean);
  if (m.contact_person) {
    rows.push({
      name: m.contact_person,
      title: null,
      department: null,
      email: emails[0] ?? null,
      phone: phones[0] ?? null,
      source: SOURCE,
      first_seen: TODAY,
    });
    for (const e of emails.slice(1)) rows.push({ name: null, title: null, department: null, email: e, phone: null, source: SOURCE, first_seen: TODAY });
    for (const p of phones.slice(1)) rows.push({ name: null, title: null, department: null, email: null, phone: p, source: SOURCE, first_seen: TODAY });
  } else {
    const n = Math.max(emails.length, phones.length);
    for (let i = 0; i < n; i++) {
      rows.push({
        name: null, title: null, department: null,
        email: emails[i] ?? null,
        phone: phones[i] ?? null,
        source: SOURCE,
        first_seen: TODAY,
      });
    }
  }
  return rows.filter(r => r.email || r.phone || r.name);
}

// Load all active recyclers
const recyclers = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from('recyclers')
    .select('id, recycler_code, company_name, state, city, email, phone, website, contact_person, notes, contacts_all, websites_all')
    .eq('is_active', true)
    .range(from, from + 999);
  if (error) { console.error(error.message); process.exit(1); }
  if (!data || !data.length) break;
  recyclers.push(...data);
  if (data.length < 1000) break;
}
console.log(`active recyclers: ${recyclers.length}`);

const byTokens = recyclers.map(r => ({ r, t: tokens(r.company_name) }));

let matched = 0, skipped = 0, updated = 0;
let emailsPrimary = 0, phonesPrimary = 0, websitesPrimary = 0, contactPersonPrimary = 0;
let contactsRowsAdded = 0, websiteEntriesAdded = 0;
const log = [];
log.push(`# MRAI → recyclers match log  (v2, contacts_all)`);
log.push(`Generated ${new Date().toISOString()}${DRY ? ' · **DRY RUN**' : ''}`);
log.push('');

for (const m of mrai) {
  const mt = tokens(m.company_name);
  if (!mt.length) continue;

  let best = null;
  for (const { r, t } of byTokens) {
    if (!t.length) continue;
    const s = overlap(mt, t);
    if (!best || s > best.score) best = { r, t, score: s };
  }
  if (!best) { skipped++; continue; }
  const required = Math.min(mt.length, best.t.length) < 3 ? 0.85 : 0.66;
  if (best.score < required) { skipped++; continue; }

  matched++;
  const r = best.r;

  // Build new contact rows from this MRAI record and merge
  const newRows = contactRowsFor(m);
  const existingContacts = Array.isArray(r.contacts_all) ? r.contacts_all : [];
  const mergedContacts = mergeContacts(existingContacts, newRows);
  const newContactCount = mergedContacts.length - existingContacts.length;

  const existingWebsites = Array.isArray(r.websites_all) ? r.websites_all : [];
  const incomingWebsites = m.website ? [{ url: m.website, source: SOURCE, first_seen: TODAY }] : [];
  const mergedWebsites = mergeWebsites(existingWebsites, incomingWebsites);
  const newWebsiteCount = mergedWebsites.length - existingWebsites.length;

  // Primary fields — fill only if missing/placeholder (same rule as before)
  const updates = {};
  if (m.emails?.length && isPlaceholderEmail(r.email)) {
    const corp = m.emails.find(e => !/@(gmail|yahoo|hotmail|outlook|live|rediffmail)\./i.test(e));
    updates.email = (corp ?? m.emails[0]).toLowerCase();
    emailsPrimary++;
  }
  if (m.phones?.length && !isRealValue(r.phone)) {
    updates.phone = m.phones[0];
    phonesPrimary++;
  }
  if (m.website && !isRealValue(r.website)) {
    updates.website = m.website;
    websitesPrimary++;
  }
  const placeholderContact = !r.contact_person || /facility contact|contact person|—|\?/i.test(r.contact_person);
  if (m.contact_person && placeholderContact) {
    updates.contact_person = m.contact_person;
    contactPersonPrimary++;
  }

  if (newContactCount > 0) { updates.contacts_all = mergedContacts; contactsRowsAdded += newContactCount; }
  if (newWebsiteCount > 0) { updates.websites_all = mergedWebsites; websiteEntriesAdded += newWebsiteCount; }

  if (Object.keys(updates).length) {
    log.push(`## ${r.recycler_code} — ${r.company_name}`);
    log.push(`matched MRAI "${m.company_name}" · score=${best.score.toFixed(2)}`);
    if (updates.email) log.push(`- primary email: ${r.email ?? '(null)'} → ${updates.email}`);
    if (updates.phone) log.push(`- primary phone: (null) → ${updates.phone}`);
    if (updates.website) log.push(`- primary website: (null) → ${updates.website}`);
    if (updates.contact_person) log.push(`- primary contact: ${r.contact_person ?? '(null)'} → ${updates.contact_person}`);
    if (newContactCount > 0) log.push(`- contacts_all: +${newContactCount} row${newContactCount > 1 ? 's' : ''} (${mergedContacts.length} total)`);
    if (newWebsiteCount > 0) log.push(`- websites_all: +${newWebsiteCount}`);
    log.push('');
    if (!DRY) {
      const { error } = await sb.from('recyclers').update(updates).eq('id', r.id);
      if (error) log.push(`   ✗ db: ${error.message}`);
      else updated++;
    } else {
      updated++;
    }
  }
}

const summary = [
  `## Summary`,
  `- matched:                  **${matched}** (skipped ${skipped})`,
  `- rows updated:             **${updated}**`,
  `- primary email fills:      **${emailsPrimary}**`,
  `- primary phone fills:      **${phonesPrimary}**`,
  `- primary website fills:    **${websitesPrimary}**`,
  `- primary contact fills:    **${contactPersonPrimary}**`,
  `- contacts_all rows added:  **${contactsRowsAdded}**`,
  `- websites_all added:       **${websiteEntriesAdded}**`,
  '',
];
log.unshift(...summary);

mkdirSync(resolve('.buddy'), { recursive: true });
writeFileSync(resolve('.buddy/mrai-match-log.md'), log.join('\n'));

console.log(summary.join('\n'));
console.log('log: .buddy/mrai-match-log.md');
