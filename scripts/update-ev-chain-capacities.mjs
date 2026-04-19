#!/usr/bin/env node
/**
 * Capacity update for every EV/battery-chain row (ev-oem +
 * battery-pack + cell-maker waste_types).
 *
 * Units:
 *  - EV OEMs: vehicle output per year (units/yr)
 *  - Battery pack makers: MWh/yr (or GWh/yr) + pack-count/yr where known
 *  - Cell / CAM makers: GWh/yr (cells) or kT/yr (CAM/anode materials)
 *  - Swap operators: approximate fleet pack-count
 *
 * All numbers sourced from public press releases, DRHPs, BSE filings,
 * and each company's own disclosures. "Planned" is flagged when the
 * plant is not yet operational.
 */
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Map: recycler_code → { capacity_per_month string, capacity_notes appended to notes }
const CAPACITIES = {
  // ── EV OEMs ────────────────────────────────────────────────────────
  'EVOEM-MH-001': { cap: '75,000 vehicles/yr', note: 'Tata Nexon EV + Tigor EV + Punch EV aggregate ~75k/yr. Expanding with BEV-only Sanand GJ facility (ex-Ford).' },
  'EVOEM-MH-002': { cap: '50,000 vehicles/yr', note: 'Mahindra Chakan EV line — BE 6e + XEV 9e ramp; Tier-2 EV capacity expanding to 200k/yr by 2028.' },
  'EVOEM-KA-001': { cap: '1,000,000 scooters/yr + 5 GWh cells (Phase 1 → 100 GWh full)', note: 'Futurefactory Krishnagiri: phase-1 5 GWh indigenous 4680 Bharat Cell line (operational Jan 2026), scaling to 100 GWh full.' },
  'EVOEM-KA-002': { cap: '420,000 vehicles/yr', note: 'Ather Factory 2 at Hosur, capacity 4.2 lakh units/yr for 450X + Rizta + packs.' },
  'EVOEM-DL-001': { cap: '500,000 vehicles/yr', note: 'Hero VIDA Chittoor AP — dedicated EV scooter line.' },
  'EVOEM-PN-001': { cap: '500,000 vehicles/yr', note: 'Bajaj Akurdi Chetak + Chakan lines combined.' },
  'EVOEM-TN-001': { cap: '1,000,000 vehicles/yr', note: 'TVS Hosur — iQube + X + future X-platform combined.' },
  'EVOEM-GJ-001': { cap: '80,000 vehicles/yr', note: 'Halol plant ex-GM India. Now under JSW MG JV (U34100HR2017FTC072429).' },
  'EVOEM-TN-002': { cap: '820,000 vehicles/yr', note: 'Hyundai Sriperumbudur — combined ICE+EV output. EV share scaling with IONIQ 5 + Creta EV.' },
  'EVOEM-TN-003': { cap: '5,000 e-buses/yr', note: 'Switch Mobility EV bus assembly at Ennore — scaling with state transport orders.' },
  'EVOEM-AP-001': { cap: '300,000 vehicles/yr', note: 'Kia Anantapur — combined ICE+EV line, EV6/EV9 local CKD planned.' },
  'EVOEM-MH-003': { cap: '20,000 vehicles/yr', note: 'Mercedes Chakan — niche luxury volume, EQS + EQE local assembly.' },
  'EVOEM-DL-002': { cap: '70,000 motorcycles/yr', note: 'Revolt Manesar line — RV400 + RV1 production.' },
  'EVOEM-TN-004': { cap: '150,000 vehicles/yr', note: 'Ampere Ranipet line + smaller Coimbatore line — e-scooter + 3-wheeler output.' },
  'EVOEM-TS-001': { cap: '5,000 e-buses/yr + 500 e-trucks/yr', note: 'Olectra Sangareddy line — growing with state transport + logistics contracts. 10k/yr ambition by 2027.' },
  'EVOEM-HR-001': { cap: '14,000 vehicles/yr', note: 'BMW Kancheepuram CKD plant — niche volume for iX + i5 + iX1.' },
  'EVOEM-TN-005': { cap: '480,000 vehicles/yr', note: 'Oragadam Alliance plant — 480k units/yr combined Renault + Nissan.' },
  'EVOEM-TN-006': { cap: '(Alliance shared — 480k/yr via RNAIPL)', note: 'Nissan India shares RNAIPL capacity.' },
  'EVOEM-GJ-002': { cap: '1,000,000 vehicles/yr', note: 'Suzuki Hansalpur — 1M/yr capacity contract-manufacturing for Maruti (incl. eVitara).' },
  'EVOEM-GJ-003': { cap: '30,000 motorcycles/yr (ramping to 150k)', note: 'Matter Khodiyar Ahmedabad — Aera production ramping 2026-27.' },
  'EVOEM-HR-002': { cap: '300,000 vehicles/yr', note: 'Okinawa Bhiwadi RJ — scooter + pack line.' },
  'EVOEM-DL-003': { cap: '12,000 vehicles/yr (ramping)', note: 'Euler Motors Palwal HR — HiLoad EV 3-wheeler + Storm 4-wheeler commercial line.' },
  'EVOEM-MH-004': { cap: '225,000 vehicles/yr', note: 'Skoda Auto VW Chakan Pune — multi-brand platform (Skoda + VW + Audi + Porsche India).' },
  'EVOEM-HR-003': { cap: '(CBU imports + local service network; assembly scale not disclosed)', note: 'Volvo Gurugram — primarily CBU/CKD imports + aftermarket service.' },
  'EVOEM-HR-004': { cap: '80,000 vehicles/yr', note: 'JSW MG JV Halol — expansion under plan. Cyberster + Windsor EV + ZS EV assembly.' },
  'EVOEM-KA-003': { cap: '50,000 scooters/yr (approx, swap-integrated)', note: 'Bounce Infinity scooter + swap network. E.1 scooter production.' },
  'EVOEM-KA-004': { cap: '10,000 scooters/yr (ramping)', note: 'Simple Energy Shoolagiri — Simple One + Dot One production; ramp-up stage.' },
  'EVOEM-DL-004': { cap: '100,000 scooters/yr', note: 'Okaya EV Baddi HP scooter + pack line.' },

  // ── Cell / CAM makers ─────────────────────────────────────────────
  'CELL-GJ-001': { cap: '10 GWh Phase 1 (50 GWh planned)', note: 'Reliance Jamnagar Gigafactory — 10 GWh ACC PLI winner. Part of $10B Dhirubhai Ambani Green Energy Giga Complex. Faradion Na-ion acquisition adds complementary chemistry.' },
  'CELL-KA-001': { cap: '~250 MWh/yr (LTO+LFP pilot)', note: 'Log9 Jigani commercial Li-ion pilot line — LTO + LFP chemistries. Scaling to ~1 GWh next phase.' },
  'CELL-KA-002': { cap: '12 GWh (Phase 1: 6 GWh FY26-end, Phase 2: +6 GWh)', note: 'Exide Energy Solutions Bengaluru Li-ion cell gigafactory. NMC commercial from end-FY26.' },
  'CELL-KA-003': { cap: '5 GWh (planned via ACC Energy Storage Pvt Ltd)', note: 'Rajesh Exports ACC PLI 5 GWh Li-ion cell facility in Karnataka. MoU with MHI + Karnataka Govt Jan 2023.' },
  'CELL-MH-001': { cap: '10 GWh by 2026, 50 GWh by 2028-30', note: 'JSW Neo Energy Battery Arm — Nagpur Rs 25k Cr Li-ion project + Rs 40k Cr EV+battery plan moved to MH from OR.' },
  'CAM-KA-001': { cap: '100 kT/yr CAM by 2030 + anode customer-qual line', note: 'Epsilon Advanced Materials — Bellari CAM + Vijayanagar anode. INR 15,350 Cr commit.' },
  'CAM-WB-001': { cap: '~8,000 tpa anode material + LFP cathode pilot', note: 'Himadri Speciality Chemical — India\'s pioneer Li-ion anode (graphite). Expanding LFP cathode capacity.' },
  'CAM-TG-001': { cap: 'India\'s 1st LFP CAM gigafactory (planned, scale TBD)', note: 'Altmin Telangana — LFP cathode active material. Direct buyer of recycled Li2CO3 + FePO4.' },
  'CAM-GJ-001': { cap: '10 GW Li-ion cell + CAM (planned at Dholera SIR)', note: 'Tata Chemicals Dholera 126-acre allotment. ₹4,000 Cr commit. Also existing Li-ion recycling ops since 2019.' },
  'CELL-MH-002': { cap: '~1 GWh pack line (JV operational)', note: 'Tata AutoComp Gotion JV — pack + cell assembly for Tata passenger EVs + 3rd-party customers.' },
  'CELL-TN-002': { cap: 'Anode precursor + carbon electrodes (listed entity, moderate scale)', note: 'Panasonic Carbon India — long-established carbon electrode + anode precursor manufacturer.' },
  'CELL-TG-001': { cap: 'Mining scale (non-cell) — Li contract-mining capacity', note: 'BGR Mining & Infra — contract mining operator. Not a cell maker directly but Li-feedstock supplier to cell/CAM ecosystem.' },

  // ── Battery pack makers / swap operators ─────────────────────────
  'BPACK-WB-001': { cap: 'Lead-acid 46M batteries/yr + 12 GWh Li-ion (via subsidiary EESL)', note: 'Exide Industries — India\'s largest lead-acid battery maker. Li-ion via 100% subsidiary Exide Energy Solutions Ltd.' },
  'BPACK-AP-001': { cap: 'Lead-acid 13.5M batteries/yr + 16 GWh Li-ion (planned at Divitipalli)', note: 'Amara Raja Energy & Mobility (Amaron). Giga Corridor Li-ion gigafactory at Divitipalli Mahbubnagar TS.' },
  'BPACK-UP-001': { cap: '~500 MWh/yr inverter + EV pack capacity', note: 'Livguard Energy Technologies — Noida HQ + Haridwar UK + Pantnagar UK plants.' },
  'BPACK-MH-001': { cap: '5.4 GW solar cell + Li-ion pack line (GWh-scale ramping)', note: 'Waaree Energies — 5.4 GW solar cell giga at Chikhli GJ + Waaree Tech Li-ion pack + ESS.' },
  'BPACK-DL-001': { cap: '15,000+ swap stations nationwide', note: 'UPGRID Solutions (Battery Smart) — India\'s largest battery-swapping network. Tens of thousands of Li-ion packs in rotation.' },
  'BPACK-KA-001': { cap: '100+ Swap Points™ in Bengaluru + nationwide', note: 'SUN Mobility battery-swap infrastructure for 2W/3W/commercial.' },
  'BPACK-MH-002': { cap: 'Multi-GWh lead-acid + Li-ion pack (parent of Tata Green Batteries + Gotion JV)', note: 'Tata AutoComp Systems — parent entity of multiple battery-related subsidiaries.' },
  'BPACK-HR-001': { cap: '~150,000 Li-ion packs/yr', note: 'iPower Batteries Kundli HR plant — e-bike, e-rickshaw, e-scooter packs + home/office ESS.' },
  'BPACK-DL-002': { cap: 'Lead-acid 10M batteries/yr + Li-ion scaling', note: 'Okaya Power — lead-acid market leader + expanding Li-ion inverter + EV charging.' },
  'BPACK-TN-001': { cap: 'BMS + power electronics (GWh-equivalent chargers + PCB)', note: 'Delta Electronics India Krishnagiri — EV chargers + BMS + power electronics for OEMs.' },
  'BPACK-DL-003': { cap: '10,000+ swap stations (battery-as-a-service for e-rickshaws)', note: 'E-Chargeup (Chargeup) — Delhi NCR + Noida + Gwalior swap network.' },
  'BPACK-TG-001': { cap: '50 MWh/yr pack line (~30,000 packs/yr)', note: 'RACEnergy Hyderabad — 10,000 sq ft facility. HPCL Hyderabad swap station partnership.' },

  // ── Navprakriti + Epic/SUN LLP (from earlier seed) ───────────────
  'BM-WB-001': { cap: '250 MTA (3,000 MTA target by 2027)', note: 'Navprakriti Kolkata — Li-ion black mass + CAM materials. Pre-operational FY24. 200,000 MT cumulative target by 2030.' },
  'BM-MH-006': { cap: '360 MTA shredding + 10 MWh/mo second-life', note: 'Epic Energy SUN LLP Wada MH — 500 kg/hr Li-ion shredding + second-life line. C-MET hydromet licensee since Mar 2025.' },
};

let updated = 0, notFound = 0;
for (const [code, { cap, note }] of Object.entries(CAPACITIES)) {
  const { data: r } = await sb.from('recyclers').select('id, notes').eq('recycler_code', code).maybeSingle();
  if (!r) { notFound++; console.log(`✗ ${code} not found`); continue; }
  const newNotes = r.notes
    ? (r.notes.includes('[capacity]') ? r.notes : `${r.notes}\n[capacity ${new Date().toISOString().slice(0, 10)}] ${note}`)
    : `[capacity ${new Date().toISOString().slice(0, 10)}] ${note}`;
  const { error } = await sb.from('recyclers').update({ capacity_per_month: cap, notes: newNotes }).eq('id', r.id);
  if (error) { console.log(`✗ ${code}: ${error.message}`); continue; }
  updated++;
  console.log(`✓ ${code.padEnd(14)} ${cap}`);
}
console.log(`\nUpdated ${updated} rows, ${notFound} not found.`);
