#!/usr/bin/env node
/**
 * Phase 3 final pass — Agent 3 confirmed most remaining MRAI members are
 * traders / indenting agents, NOT processors. Two new verified hits, plus
 * a bulk relabel of confirmed traders + misclassifications.
 */
import { createClient } from '@supabase/supabase-js';

const DRY = process.argv.includes('--dry-run');
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const TODAY = new Date().toISOString().slice(0, 10);

// ── New verified hit ──────────────────────────────────────────────────
const VERIFIED = {
  'MRAI-MH-004': {
    capacity: '3,000 TPA CI + SG iron castings (100% shell moulding process) — Abhishek Alloys, Belgaum',
    state: 'Karnataka',
    city: 'Belgaum',
    note: 'Abhishek Alloys Pvt Ltd — IndiaMart profile. Auto + industrial castings via shell-moulding. State corrected from Maharashtra → Karnataka (plant at Belgaum; MRAI directory had Mumbai admin address).',
  },
};

// ── Confirmed traders — relabel from 'not publicly disclosed' → honest ──
const TRADER = [
  'MRAI-DL-001',  // A.G. Metalloys — trader
  'MRAI-DL-004',  // ACE International — trader
  'MRAI-DL-010',  // Amita Enterprises — trader
  'MRAI-GJ-002',  // Aadi Imports — trader
  'MRAI-GJ-003',  // Accurate International — trader
  'MRAI-GJ-006',  // Alshafa International — trader
  'MRAI-GJ-009',  // Baldi Metals & Alloys — trader
  'MRAI-HR-002',  // Ankur Enterprises — trader
  'MRAI-HR-006',  // Buoyancy Traders — trader
  'MRAI-HR-007',  // Capital Sales — trader
  'MRAI-HR-010',  // Chuan Tian Hardware — trader
  'MRAI-KA-005',  // Aurum Metal Connections — trader
  'MRAI-KL-001',  // ALQ Exporters — trader
  'MRAI-KL-002',  // Core Care Trading — trader
  'MRAI-MH-001',  // A.R. International — trader
  'MRAI-MH-017',  // Anand Enterprises — trader
  'MRAI-PB-005',  // Bhagwati Trading — trader
  'MRAI-PB-006',  // Bimal Exports — trader
  'MRAI-TN-005',  // Goyal Metal Traders — trader
  'MRAI-TN-006',  // Himalaya Trading — trader
  'MRAI-TN-014',  // Mats India — trader
  'MRAI-TS-002',  // Loha Trade Links — trader
  'MRAI-UP-005',  // Eagle Trans Shipping — logistics, not recycler
];

// ── Misclassified (non-metals businesses in MRAI directory) ────────
const MISCLASSIFIED = {
  'MRAI-MH-014': 'N/A — aluminium aerosol can manufacturer. Aman Metalloy makes containers, not a scrap recycler. Misclassified in MRAI list.',
  'MRAI-MH-016': 'N/A — polyurethane / specialty chemicals manufacturer. Amrit Polychem is not a metals recycler. Misclassified in MRAI list.',
};

let updated = 0;

// Apply verified hit
for (const [code, spec] of Object.entries(VERIFIED)) {
  const { data: row } = await sb.from('recyclers').select('id, notes').eq('recycler_code', code).maybeSingle();
  if (!row) { console.log(`✗ ${code} not found`); continue; }
  const update = {
    capacity_per_month: spec.capacity,
    ...(spec.state ? { state: spec.state } : {}),
    ...(spec.city ? { city: spec.city } : {}),
    notes: row.notes ? `${row.notes}\n[capacity Phase 3 ${TODAY}] ${spec.note}` : `[capacity Phase 3 ${TODAY}] ${spec.note}`,
  };
  if (!DRY) await sb.from('recyclers').update(update).eq('id', row.id);
  updated++;
  console.log(`✓ ${code} → ${spec.capacity.slice(0, 60)}…`);
}

// Relabel traders
for (const code of TRADER) {
  const { data: row } = await sb.from('recyclers').select('id, company_name, notes, capacity_per_month').eq('recycler_code', code).maybeSingle();
  if (!row) { console.log(`✗ ${code} not found`); continue; }
  if (row.capacity_per_month !== 'Capacity not publicly disclosed') {
    console.log(`- ${code}: already has "${row.capacity_per_month?.slice(0, 30)}…" — skip`);
    continue;
  }
  const label = 'Trader / indenting agent — no processing capacity';
  const note = `[classification ${TODAY}] ${row.company_name} is a trader / indenting agent / broker, not a processor. No physical plant capacity to report.`;
  if (!DRY) {
    await sb.from('recyclers').update({
      capacity_per_month: label,
      notes: row.notes ? `${row.notes}\n${note}` : note,
    }).eq('id', row.id);
  }
  updated++;
  console.log(`✓ ${code} → trader label`);
}

// Relabel misclassified
for (const [code, label] of Object.entries(MISCLASSIFIED)) {
  const { data: row } = await sb.from('recyclers').select('id, notes').eq('recycler_code', code).maybeSingle();
  if (!row) continue;
  if (!DRY) {
    await sb.from('recyclers').update({
      capacity_per_month: label,
      notes: row.notes ? `${row.notes}\n[classification ${TODAY}] ${label}` : `[classification ${TODAY}] ${label}`,
    }).eq('id', row.id);
  }
  updated++;
  console.log(`✓ ${code} → misclassified label`);
}

console.log(`\n${DRY ? 'DRY RUN — ' : ''}updated ${updated} rows`);
