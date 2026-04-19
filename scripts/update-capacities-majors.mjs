#!/usr/bin/env node
/**
 * Capacity backfill for major listed / well-known recyclers that were
 * missing capacity_per_month. Numbers sourced from annual reports,
 * DRHPs, and each company's own website.
 */
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const TODAY = new Date().toISOString().slice(0, 10);

const CAPS = {
  // ── Jain Metal Group (DRHP 2025 — 3.26 lakh MTPA across 3 facilities + plastics) ──
  'METAL-TN-001': { cap: '60,000 MTA', note: 'Facility 1 — Copper cable recycling → copper billets + alloys. Share of Jain Resource Recycling Ltd\'s 136k MTPA base + expansion (DRHP 2025).' },
  'METAL-TN-002': { cap: '5,000 MTA',  note: 'Jain Recycling Pvt Ltd — plastics arm (PP granules + plastic recycling).' },
  'METAL-TN-003': { cap: '48,000 MTA', note: 'Facility 3 — Aluminium alloys + diecasting alloys (Jain Green Technologies Pvt Ltd).' },
  'METAL-TN-004': { cap: '200,000 MTA', note: 'Facility 2 — Refined lead + lead alloys. Flagship unit (largest among 3 Jain Resource Recycling facilities, aggregate 326k MTPA per DRHP).' },

  // ── Century Metal Recycling Ltd (HR — Tatarpur + 9 other plants) ───
  'MRAI-HR-009': { cap: '145,000 MTA Al + 16,000 MTA Zn', note: 'CMR Green Technologies — 10 plants across IN incl. JVs with Toyota Tsusho + Nikkei MC. Al alloys 145k TPA, Zn alloys 16k TPA.' },

  // ── NILE Limited (TS + AP) — BSE-listed secondary lead recycler ────
  'MRAI-TS-003': { cap: '120,000 MTA', note: 'NILE Limited — 2 secondary lead plants: Choutuppal (32-50 kTPA) + Tirupati/Gajulamandyam (65-70 kTPA). Combined >120k TPA. Own website states 72 kTPA installed (earlier figure).' },

  // ── Ganesha Ecosphere — BSE-listed PET recycler, Kanpur ────────────
  'MRAI-UP-008': { cap: '106,800 TPA PET', note: 'Ganesha Ecosphere Ltd (L51109UP1987PLC009090) — 96,600 TPA rPET fibre + 7,200 TPA rPET yarn + 3,000 TPA dyed/texturised yarn. Total 106.8 kTPA.' },

  // ── Mahindra Accelo Limited — Mobility/Energy components + CERO JV ─
  'MAJ-MH-002': { cap: 'Multi-plant scale (3 locations: Pune, Nashik, Vadodara) + CERO vehicle scrapping JV', note: 'Mahindra Accelo Ltd (U51900MH1978PLC020222) — wholly-owned Mahindra & Mahindra subsidiary. Mobility + Energy component business incl. vehicle recycling via CERO (Mahindra MSTC JV).' },

  // ── Manaksia Limited — Kolkata, aluminium flat products ────────────
  'MAJ-WB-002': { cap: '30,000 TPA aluminium rolled products', note: 'Manaksia Ltd (L74950WB1984PLC038336) / Manaksia Aluminium Co — 30 kTPA aluminium sheets/coils (flat products). Kolkata-based multi-business group.' },

  // ── Trimex Sands — Srikakulam beach sands / heavy minerals ──────────
  'MAJ-TN-001': { cap: '310,000 TPA mineral sands (Ilmenite 200k + Rutile 5k + Zircon 5k + Garnet 50k + Sillimanite 50k)', note: 'Trimex Sands Pvt Ltd — Srikakulam AP mining + mineral separation (Srikurmam deposit). 350 TPH ROM pre-concentration. MoU with Indonesia for titanium industrial complex.' },

  // ── Kanishk Steel Industries — Chennai, Gummidipoondi ──────────────
  'MRAI-TN-010': { cap: 'Steel finished goods (constructional + structural per IS 1786, IS 2062) — TPA not publicly filed', note: 'Kanishk Steel Industries Ltd (L27109TN1995PLC067863) — SIPCOT Gummidipoondi TN. Revenue INR 372Cr FY25. Exact capacity not in public filings.' },

  // ── SIMS Recycling Solutions India — Greater Noida ITAD ────────────
  'MRAI-UP-011': { cap: 'ITAD + e-waste multi-standard (ISO 9001/14001/27001, OHSAS 18001) — TPA not publicly filed', note: 'SIMS Recycling Solutions India Pvt Ltd — part of Sims Metal Management (ASX:SGM). Plot 1 Udyog Kendra Ecotech-3 Greater Noida. Global ITAD arm.' },
};

let updated = 0, skipped = 0;
for (const [code, { cap, note }] of Object.entries(CAPS)) {
  const { data: r } = await sb.from('recyclers').select('id, notes').eq('recycler_code', code).maybeSingle();
  if (!r) { skipped++; console.log(`✗ ${code} not found`); continue; }
  const newNotes = r.notes
    ? (r.notes.includes('[capacity]') ? r.notes : `${r.notes}\n[capacity ${TODAY}] ${note}`)
    : `[capacity ${TODAY}] ${note}`;
  await sb.from('recyclers').update({ capacity_per_month: cap, notes: newNotes }).eq('id', r.id);
  updated++;
  console.log(`✓ ${code.padEnd(14)} ${cap}`);
}
console.log(`\nUpdated ${updated}, skipped ${skipped}.`);
