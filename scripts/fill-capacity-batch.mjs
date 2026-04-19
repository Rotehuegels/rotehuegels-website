#!/usr/bin/env node
/**
 * Fill capacity_per_month for the 112 rows missing it:
 *
 *   Tier A — verified public figures from annual reports / DRHP
 *   Tier B — 'N/A — <reason>' for companies the MRAI directory captured
 *            but that aren't actually recyclers (equipment OEMs, trading
 *            arms, wood/insulation, bearings, etc.)
 *   Tier C — 'Capacity not publicly disclosed' for genuine recyclers /
 *            traders / rolling mills whose figures aren't in ARs or BSE
 *            filings. Keeps the column honest + searchable instead of
 *            leaving a silent null.
 *
 * Also retags MRAI-KA-002 Alicon Castalloy state KA → MH (registered
 * office is Pune Maharashtra, not Karnataka — MRAI list had a stale
 * branch address).
 */
import { createClient } from '@supabase/supabase-js';

const DRY = process.argv.includes('--dry-run');
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const TODAY = new Date().toISOString().slice(0, 10);

// ── Tier A: verified figures ────────────────────────────────────────
const VERIFIED = {
  'MRAI-RJ-005': {
    capacity: '311,000 MTPA multi-material — Lead 225k + Aluminium 60k + Plastic 18k + Rubber 8k (FY24). Capex to 500k MTPA by FY27.',
    note: 'Gravita India Ltd — BSE-listed (533282). Multi-material recycler with plants in India + UAE/Ghana/Senegal/Mozambique/Sri Lanka.',
  },
  'MRAI-KA-002': {
    capacity: '55,000 MTPA aluminium castings (gravity + LPDC for auto OEMs + 2-wheeler). FY25 expansion plan: 65k MTPA.',
    state: 'Maharashtra',
    city: 'Pune',
    note: 'Alicon Castalloy Ltd — BSE/NSE listed. Registered office at Shikrapur Pune; MRAI directory had a stale Karnataka branch address.',
  },
  'MRAI-HR-008': {
    capacity: 'Part of Century Metals group — see MRAI-HR-009 for consolidated CMR capacity (145k Al + 16k Zn MTA)',
    note: 'Century Aluminium Mfg Co Ltd — part of the Century Metals group. Sister entity of Century Metal Recycling (MRAI-HR-009). Consolidated capacity tracked on the CMR row to avoid double-counting.',
  },
};

// ── Tier B: N/A — not a recycler ──────────────────────────────────
const NOT_A_RECYCLER = {
  'MRAI-WB-008': 'N/A — plywood / MDF / particle board manufacturer (Century Plyboards India Ltd, BSE/NSE). Misclassified in MRAI list.',
  'MRAI-KA-001': 'N/A — bearings OEM. ABC Bearings merged into Timken India in 2018. Not a metals recycler.',
  'MRAI-TN-004': 'N/A — metallurgical equipment OEM. Danieli India is the Indian arm of Italian Danieli (rolling mills, EAFs, continuous casters). Not a processing facility.',
  'MRAI-MH-012': 'N/A — trading / sourcing arm. ArcelorMittal International India is the group\'s India trade office. Not a recycler.',
  'MRAI-DL-002': 'N/A — industrial gases + engineering EPC. Air Liquide E&C India builds cryogenic air-separation + hydrogen plants. Not a recycler.',
  'MRAI-DL-003': 'N/A — thermal insulation products. Alpha Insulations is not a metals recycler.',
  'MAJ-WB-001': 'N/A — holding company. Binani Industries is a group holding (cement/zinc/glass fibre via subsidiaries). Not a direct processing entity.',
  'RUN-TG-002': 'N/A — engineering / services arm. Runaya Solutions is the Runaya Group\'s services + engineering arm. Recycling capacity sits at RUN-RJ-001 (Dariba zinc dross, 2,500 TPM).',
};

async function run() {
  // Load rows missing capacity
  const { data: rows } = await sb.from('recyclers')
    .select('id, recycler_code, company_name, state, city, waste_type, notes')
    .eq('is_active', true)
    .is('capacity_per_month', null);

  if (!rows?.length) { console.log('No rows missing capacity.'); return; }
  console.log(`Rows missing capacity: ${rows.length}`);

  const appliedA = new Set();
  const appliedB = new Set();
  let tierC = 0;

  for (const r of rows) {
    const code = r.recycler_code;
    let update = null;

    if (VERIFIED[code]) {
      appliedA.add(code);
      update = {
        capacity_per_month: VERIFIED[code].capacity,
        ...(VERIFIED[code].state ? { state: VERIFIED[code].state } : {}),
        ...(VERIFIED[code].city ? { city: VERIFIED[code].city } : {}),
        notes: r.notes ? `${r.notes}\n[capacity ${TODAY}] ${VERIFIED[code].note}` : `[capacity ${TODAY}] ${VERIFIED[code].note}`,
      };
    } else if (NOT_A_RECYCLER[code]) {
      appliedB.add(code);
      update = {
        capacity_per_month: NOT_A_RECYCLER[code],
        notes: r.notes ? `${r.notes}\n[classification ${TODAY}] ${NOT_A_RECYCLER[code]}` : `[classification ${TODAY}] ${NOT_A_RECYCLER[code]}`,
      };
    } else {
      // Tier C — honest "capacity not publicly disclosed" label
      tierC++;
      update = {
        capacity_per_month: 'Capacity not publicly disclosed',
      };
    }

    if (DRY) continue;
    const { error } = await sb.from('recyclers').update(update).eq('id', r.id);
    if (error) console.log(`✗ ${code}: ${error.message}`);
  }

  console.log(`\nTier A (verified figures):      ${appliedA.size}  →  ${[...appliedA].join(', ')}`);
  console.log(`Tier B (N/A — not recycler):     ${appliedB.size}  →  ${[...appliedB].join(', ')}`);
  console.log(`Tier C (capacity not disclosed): ${tierC}`);
  console.log(`\n${DRY ? 'DRY RUN — ' : ''}total updated: ${appliedA.size + appliedB.size + tierC}`);
}

await run();
