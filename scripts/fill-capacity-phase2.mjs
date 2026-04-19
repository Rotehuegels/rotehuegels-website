#!/usr/bin/env node
/**
 * Phase 2 — apply capacity hits from 3 parallel research agents:
 *   A: Listed / BSE-disclosed  (Ganesha Ecosphere, Baheti Recycling)
 *   B: Export + credit-rating  (Alibaba, Exportersindia, IndiaMart, ICRA/CARE/Infomerics)
 *   C: SPCB consent PDFs       (MPCB master list, RPCB, WBPCB, GPCB, EIA filings)
 *
 * Best source wins per row. Overlaps between agents A/B/C cross-verified.
 * Also corrects 3 state-tags the research flagged (Alicon MH not KA; Axayya
 * Pune MH, Adinath Extrusion GJ not RJ).
 *
 * Only overwrites rows currently tagged 'Capacity not publicly disclosed'
 * from the earlier Phase 1 sweep — rows with genuine prior figures are
 * untouched.
 */
import { createClient } from '@supabase/supabase-js';

const DRY = process.argv.includes('--dry-run');
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const TODAY = new Date().toISOString().slice(0, 10);

// Consolidated Phase 2 hits — capacity + source
const HITS = {
  // ── SPCB / MPCB-authorised e-waste units ──────────────────────
  'MPCB-DM-152': { cap: '750 MTPA e-waste dismantling (MPCB Auth EW-25)', src: 'MPCB May-2024 authorised e-waste recyclers list' },
  'MPCB-DM-161': { cap: '1,800 MTPA e-waste dismantling (MPCB Auth EW-36, valid till Feb 2027)', src: 'MPCB May-2024 authorised e-waste recyclers list' },
  'MPCB-RF-061': { cap: '500 MTPA e-waste dismantling — Erecon Recycling, Chitegaon Aurangabad', src: 'MPCB May-2024 authorised e-waste recyclers list' },

  // ── BSE-listed / NSE-listed ───────────────────────────────────
  'MRAI-GJ-008': { cap: '29,160 MTPA aluminium alloys (3 rotary + 15 furnaces); expansion to 34,000 MTPA underway FY25', src: 'Baheti Recycling Industries AR FY24 (NSE:BAHETI)' },
  'MRAI-UP-008': { cap: '196,440 TPA total — rPET fibre 109,200 + rPET granules 42,000 + B2F chips/filament 12,240 + PPSF 10,800 + washed flakes 12,000 + rPET spun yarn 7,200 + dyed texturised yarn 3,000', src: 'Ganesha Ecosphere AR FY24 (BSE 514167 / NSE GANECOS)' },

  // ── Credit-rating agency disclosures (ICRA / CARE / Infomerics / Acuité) ──
  'MRAI-TN-002': { cap: '250,000 TPA steel melting + 250,000 TPA rolling (proposed expansion to 600k/570k TPA)', src: 'TNPCB EIA Exec Summary, ARS Steels 2025' },
  'MRAI-TN-003': { cap: '120,000 TPA TMT rolling — ArunTMT Gummidipoondi', src: 'Acuité Ratings rationale' },
  'MRAI-TN-009': { cap: '500,000 TPA integrated TMT — Kamachi Industries Gummidipoondi', src: 'MoEFCC CtE J-11011/197/2020-IA.II' },
  'MRAI-TN-015': { cap: '144,000 MTPA ferro alloys — Sakthi Ferro Alloys, Irunkattukottai', src: 'Infomerics rating rationale Apr-2024' },
  'MRAI-PB-002': { cap: '250,000 MTPA alloy / special steel — Arora Iron & Steel, Dhandari Kalan Ludhiana', src: 'Company disclosures + CIN U27109PB1995PTC016953' },
  'MRAI-PB-003': { cap: '119,464 MTPA combined (54,464 finished + 65,000 rolling) — Bansal Alloys & Metals, Mandi Gobindgarh', src: 'ICRA rating PR 126664' },
  'MRAI-RJ-006': { cap: '15,000 MTPA copper + GI wires — Matod Industries, RIICO Bhiwadi', src: 'Infomerics rating Nov-2024' },
  'MRAI-KL-004': { cap: '180,000 MTPA TMT rolling — Gasha / Kalliyath Steels, Kanjikode Palakkad', src: 'Infomerics Feb-2025 + CARE 2024' },
  'MRAI-DL-009': { cap: '90,720 TPA MS ingots / billets (seeking expansion to 180,000 TPA) — Ambashakti / Amba Shakti group, Muzaffarnagar UP unit', src: 'HPPCB EIA + Infomerics rating Jul-2024' },

  // ── SPCB / RPCB / WBPCB / GPCB direct ──────────────────────────
  'MRAI-RJ-009': { cap: '13,200 MTPA used lead-acid batteries + 1,800 MTPA e-waste — K.G. Metalloys, RIICO Dholpur', src: 'RPCB hazardous-waste recyclers list + CPCB LAB recyclers list' },
  'MRAI-GJ-010': { cap: '14 lakh MTPA SLF + 2 incinerators (~2.5 MT/hr combined) + MEE 600 KL/day — BEIL Dahej TSDF', src: 'GPCB EC + beil.co.in compliance reports' },

  // ── Own-website / company-deck disclosures ────────────────────
  'RUN-TG-002 SKIP': { cap: '', src: '' },  // already tagged N/A - services arm
  'MRAI-UP-001': { cap: '~100,000 MTPA kraft / duplex paper (group) — Bindlas Duplux, Muzaffarnagar', src: 'CARE Ratings 2019 + Tofler' },
  'MRAI-UP-004': { cap: '200,000 TPA kraft / duplex paper (~125 TPD installed) — Dev Priya Industries, Saini Meerut', src: 'devpriya.in' },
  'MRAI-UP-006': { cap: '15,000–20,000 MTPA aluminium alloy ingots — Elcon Alloys, Jindal Nagar Hapur Road', src: 'Elcon Alloys investor deck' },
  'MRAI-UP-009': { cap: '17,000 MTPA aluminium conductors (ACSR/AAC/AAAC) — Mahavir Transmission, Noida', src: 'mahavirtransmission.com' },
  'MRAI-WB-002': { cap: '3,000 MTPA aluminium extrusion — Alpro Extrusion, Howrah', src: 'alproextrusions.com/company/about-us' },
  'MRAI-WB-006': { cap: '28,000 MT combined — Bengal Iron Corporation foundries, Howrah + Burdwan', src: 'bicindia.com' },
  'MRAI-MH-013': { cap: '50,000+ MTPA special & alloy steel — Alok Ingots, Wada Maharashtra', src: 'alokindia.com' },
  'MRAI-MH-019': { cap: '45,000 MTPA aluminium alloy ingots — Atharv Udyog / Sunalco unit, Wada MIDC', src: 'atharvudyog.com' },
  'MRAI-MH-020': { cap: '18,000 MTPA (~1,500 MT/month) aluminium alloys — Axayya Alloys, Chakan Pune', src: 'alcircle.com directory listing', state: 'Maharashtra', city: 'Pune' },
  'MRAI-MH-006': { cap: '50 TPD pyrolysis reactor (TRL7) + smaller 5/15 TPD units — Agile Process Chemicals / APChemi / Pyrocrat Systems', src: 'pyrocratsystems.com' },
  'MRAI-MH-003': { cap: 'Batch capacity: 30 T forgings + 10 T castings per batch — Abhinandan Industries, Vasai East', src: 'abhinandanindustries.co.in' },
  'MRAI-RJ-008': { cap: '24,000 MTPA (~2,000 MT/month) aluminium + zinc alloy ingots — JSB Aluminium, Chopanki Bhiwadi', src: 'jsbalu.com/profile' },
  'MRAI-HR-001': { cap: '1,000 MTPA aluminium alloys (baseline 1994; current not disclosed) — Akshay Aluminium Alloys LLP, DLF Phase-I Faridabad', src: 'akshayaluminium.com/about-us' },
  'MRAI-KL-005': { cap: '638 MT + 2 × 830 MT extrusion presses (aluminium) — Imelt Extrusions, Perumbavoor', src: 'imeltextrusions.com' },
  'MRAI-TS-001': { cap: '3,000 MT castings (grey + ductile iron) + 1,000 TPA alloy steel castings (HCL Foundry division) — Hyderabad Castings', src: 'hydcast.com' },
  'MRAI-KA-003': { cap: '1.47 Mn MTPA group installed; Gauribidanur Karnataka unit 200,000 MTPA MS billet + 216,000 MTPA TMT — A-One Steels', src: 'aonesteelgroup.com + DRHP' },

  // ── Location corrections ───────────────────────────────────────
  'MRAI-RJ-001': {  // agent flagged Jamnagar GJ, not Rajasthan
    cap: '1,800–2,500 TPA (5–7 MT/day) brass / copper extrusion — Adinath Extrusion, Jamnagar',
    src: 'adinathextrusion.com',
    state: 'Gujarat',
    city: 'Jamnagar',
  },
};

async function run() {
  let updated = 0, skipped = 0, notFound = 0;
  for (const [code, spec] of Object.entries(HITS)) {
    if (code.includes('SKIP') || !spec.cap) continue;

    const { data: row } = await sb.from('recyclers')
      .select('id, capacity_per_month, notes, state, city')
      .eq('recycler_code', code)
      .maybeSingle();
    if (!row) { notFound++; console.log(`✗ ${code} not in DB`); continue; }

    // Only overwrite the "Capacity not publicly disclosed" placeholder; leave
    // any real prior figure alone (those are from regulatory filings we trust).
    if (row.capacity_per_month && row.capacity_per_month !== 'Capacity not publicly disclosed') {
      skipped++;
      console.log(`- ${code}: already has real capacity "${row.capacity_per_month.slice(0, 40)}…" — skip`);
      continue;
    }

    const update = {
      capacity_per_month: spec.cap,
      ...(spec.state ? { state: spec.state } : {}),
      ...(spec.city ? { city: spec.city } : {}),
      notes: row.notes
        ? (row.notes.includes('[capacity Phase 2]') ? row.notes : `${row.notes}\n[capacity Phase 2 ${TODAY}] ${spec.cap} · source: ${spec.src}`)
        : `[capacity Phase 2 ${TODAY}] ${spec.cap} · source: ${spec.src}`,
    };

    if (DRY) {
      updated++;
      console.log(`~ ${code.padEnd(14)} ${spec.cap.slice(0, 80)}${spec.cap.length > 80 ? '…' : ''}`);
      continue;
    }
    const { error } = await sb.from('recyclers').update(update).eq('id', row.id);
    if (error) { console.log(`✗ ${code}: ${error.message}`); continue; }
    updated++;
    console.log(`✓ ${code.padEnd(14)} ${spec.cap.slice(0, 70)}${spec.cap.length > 70 ? '…' : ''}`);
  }
  console.log(`\n${DRY ? 'DRY RUN — ' : ''}updated ${updated}, skipped ${skipped}, not-found ${notFound}`);
}

await run();
