#!/usr/bin/env node
/**
 * Fuzzy-match NFMR-parsed records (MoEF/CPCB Non-Ferrous Metal Waste
 * Reprocessors list, 2011) to active recyclers that are missing
 * capacity_per_month, and backfill capacity.
 *
 * Source: http://ciiwasteexchange.org/Data/Non-ferrous%20metal%20waste%20reprocessors.pdf
 *
 * Writes:
 *   recyclers.capacity_per_month = "<N> MTA"
 *   recyclers.notes += "\n[capacity YYYY-MM-DD from MoEF/CPCB NFMR 2011 — s.no <N>]"
 *
 * Run: node --env-file=.env.local scripts/match-nfmr-to-recyclers.mjs [--dry-run]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) { console.error('Missing env'); process.exit(1); }
const sb = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

const DRY = process.argv.includes('--dry-run');
const TODAY = new Date().toISOString().slice(0, 10);
const SOURCE = 'MoEF/CPCB NFMR 2011';

const nfmrRaw = JSON.parse(readFileSync(resolve('.buddy/nfmr-parsed.json'), 'utf8'));

const NOISE = new Set([
  'the','and','of','pvt','private','ltd','limited','llp','inc','corp','company',
  'co','p','group','india','metals','metal','industries','industry','enterprises',
  'enterprise','recyclers','recycler','recycling','scrap','traders','trader',
  'exports','export','imports','import','international','global','unit',
  // Generic descriptors that match too broadly:
  'alloys','alloy','chemicals','chemical','refineries','refinery',
  'resources','resource','products','product','works','plant',
]);

// The NFMR parser captured the whole first line, which contains the name
// plus the waste-type + validity columns separated by runs of whitespace.
// Split on 2+ spaces and take the first chunk as the company name.
function cleanName(raw) {
  return String(raw).split(/\s{2,}/)[0].trim();
}

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

const STATE_NORMALISE = (s) => String(s ?? '').trim().toLowerCase()
  .replace(/\s+/g, ' ')
  .replace(/^tamilnadu$/, 'tamil nadu')
  .replace(/^orissa$/, 'odisha')
  .replace(/^uttaranchal$/, 'uttarakhand');

// Preprocess NFMR: drop records without capacity; add clean name + tokens.
const nfmr = nfmrRaw
  .filter(r => r.capacity_mta != null && r.capacity_mta > 0)
  .map(r => {
    const name = cleanName(r.name);
    return { ...r, clean_name: name, tokens: tokens(name), state_norm: STATE_NORMALISE(r.state) };
  })
  .filter(r => r.tokens.length > 0);

console.log(`NFMR records with capacity: ${nfmr.length}`);

// Load active recyclers missing capacity.
const targets = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from('recyclers')
    .select('id, recycler_code, company_name, state, capacity_per_month, notes')
    .eq('is_active', true)
    .is('capacity_per_month', null)
    .range(from, from + 999);
  if (error) { console.error(error.message); process.exit(1); }
  if (!data || !data.length) break;
  targets.push(...data);
  if (data.length < 1000) break;
}
console.log(`active recyclers missing capacity: ${targets.length}`);

const log = [
  `# NFMR → recyclers capacity backfill`,
  `Generated ${new Date().toISOString()}${DRY ? ' · **DRY RUN**' : ''}`,
  '',
];

let matched = 0, updated = 0, skipped = 0;
const used = new Set(); // NFMR serial numbers already consumed, so we don't double-assign

for (const t of targets) {
  const tTok = tokens(t.company_name);
  const tState = STATE_NORMALISE(t.state);
  if (!tTok.length) { skipped++; continue; }

  // State-first matching: restrict candidates to same state when both sides have one.
  const candidates = nfmr.filter(n => !used.has(n.serial)
    && (!tState || !n.state_norm || n.state_norm === tState));

  let best = null;
  for (const n of candidates) {
    const s = overlap(tTok, n.tokens);
    if (!best || s > best.score) best = { n, score: s };
  }
  if (!best) { skipped++; continue; }

  // Need overlap on distinctive tokens. Either:
  //   (a) ≥2 shared tokens (normal fuzzy match), OR
  //   (b) exactly 1 shared token that's long (≥5 chars) AND state matches
  //       AND that single token is the only one on BOTH sides
  //       — handles short names where noise filtering left just the brand.
  const sharedTokens = tTok.filter(x => best.n.tokens.includes(x));
  const shared = sharedTokens.length;
  const singleLong = shared === 1
    && sharedTokens[0].length >= 5
    && tTok.length === 1
    && best.n.tokens.length === 1
    && tState && best.n.state_norm && tState === best.n.state_norm;
  if (shared < 2 && !singleLong) { skipped++; continue; }

  const required = Math.min(tTok.length, best.n.tokens.length) < 4 ? 0.85 : 0.66;
  if (best.score < required) { skipped++; continue; }

  matched++;
  used.add(best.n.serial);

  const cap = `${best.n.capacity_mta} MTA`;
  const noteTag = `[capacity ${TODAY} from ${SOURCE} — s.no ${best.n.serial}]`;
  const newNotes = t.notes
    ? (t.notes.includes(SOURCE) ? t.notes : `${t.notes}\n${noteTag}`)
    : noteTag;

  log.push(`## ${t.recycler_code} — ${t.company_name}`);
  log.push(`matched NFMR #${best.n.serial} "${best.n.clean_name}" (${best.n.state}) · score=${best.score.toFixed(2)}`);
  log.push(`- capacity: (null) → ${cap}`);
  log.push('');

  if (!DRY) {
    const { error } = await sb.from('recyclers')
      .update({ capacity_per_month: cap, notes: newNotes })
      .eq('id', t.id);
    if (error) log.push(`   ✗ db: ${error.message}`);
    else updated++;
  } else {
    updated++;
  }
}

const summary = [
  `## Summary`,
  `- target rows (capacity null):  **${targets.length}**`,
  `- matched:                      **${matched}**`,
  `- updated:                      **${updated}**`,
  `- skipped (no confident match): **${skipped}**`,
  `- NFMR records consumed:        **${used.size} / ${nfmr.length}**`,
  '',
];
log.unshift(...summary);

mkdirSync(resolve('.buddy'), { recursive: true });
writeFileSync(resolve('.buddy/nfmr-match-log.md'), log.join('\n'));
console.log(summary.join('\n'));
console.log('log: .buddy/nfmr-match-log.md');
