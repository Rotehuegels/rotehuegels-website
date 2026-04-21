-- Follow-up enrichment for ADV Metal Combine (CPCB-CG-001) — expand the
-- Li-ion battery + e-waste recycling story with verified specifics.
--
-- Sources:
--   - EVreporter — "The curious case of battery recycling: India's scenario"
--   - Madeforplanet — "17 Battery Recycling Companies in India"
--   - advindia.com black-mass product page
--
-- Key new facts (vs. the general profile migration):
--   • LIB + e-waste division is in BHILAI (Chhattisgarh), operational since 2008
--   • Licensed to handle 2,500 MTA of Li-ion battery waste (separate from the
--     750 MTA e-waste authorisation seeded from the CPCB list)
--   • Tech developed jointly with CSIR-NML Jamshedpur and later BARC
--   • Category B recycler — black-mass refiner (not just a dismantler/shredder)
--   • Refining capacity: 2 MT/day black mass, planned scale-up to 8 MT/day
--   • Outputs: battery-grade Cobalt Sulphate, Lithium Carbonate, Nickel
--     Sulphate, Copper Sulphate, Manganese Sulphate

BEGIN;

UPDATE recyclers
SET
  capabilities = ARRAY[
    'Ferro-alloys — low & medium carbon (alumino-thermic, BARC tech)',
    'De-oxidation & desulphurisation compounds (Ca / Al / Mg based)',
    'Aluminium ingots, powder, fines — dross & scrap reprocessing',
    'E-waste dismantling & recycling (SPCB/CG/EWR/001, 750 MTA)',
    'Li-ion battery recycling — licensed 2,500 MTA',
    'Black-mass refining — Category B (2 MT/day, scaling to 8 MT/day)',
    'Battery-grade Cobalt Sulphate (CoSO₄)',
    'Battery-grade Lithium Carbonate (Li₂CO₃)',
    'Battery-grade Nickel Sulphate (NiSO₄)',
    'Battery-grade Manganese Sulphate (MnSO₄)',
    'Battery-grade Copper Sulphate (CuSO₄)',
    'Hydrometallurgical refining of cathode black mass',
    'R&D partnerships — CSIR-NML Jamshedpur, BARC'
  ],
  notes = E'ADV Metal Combine Pvt. Ltd. is a Delhi-headquartered manufacturer and recycler, established 1997. The group runs two distinct but complementary business lines out of Chhattisgarh: (a) ferro-alloy & steelmaking chemicals, and (b) e-waste + Li-ion battery recycling.\n\n═══ LI-ION BATTERY RECYCLING ═══════════════════════════════════════════\nLOCATION — Bhilai, Chhattisgarh (LIB + e-waste division, operational since 2008)\nLICENCE — 2,500 MTA of Li-ion battery waste (separate from the 750 MTA e-waste authorisation)\nCATEGORY — Category B recycler = black-mass REFINER (not just a dismantler/shredder). One of the few Indian players that converts black mass end-to-end into battery-grade salts in-house instead of exporting.\n\nPROCESS\n• Mechanical: dismantling, discharging, size-reduction / shredding → cathode & anode black mass (mixed Li, Ni, Co, Mn + graphite, Cu, Al)\n• Hydrometallurgy: acid leaching → solvent extraction / precipitation → crystallisation of battery-grade metal sulphates & lithium carbonate\n\nOUTPUTS (battery-grade, cell-manufacturer spec)\n• Cobalt Sulphate (CoSO₄)\n• Lithium Carbonate (Li₂CO₃)\n• Nickel Sulphate (NiSO₄)\n• Manganese Sulphate (MnSO₄)\n• Copper Sulphate (CuSO₄)\n\nREFINING CAPACITY — 2 MT/day of black mass currently; published scale-up to 8 MT/day.\n\nTECHNOLOGY PARTNERSHIPS\n• CSIR-NML Jamshedpur — jointly developed the LIB recycling & hydromet process\n• Bhabha Atomic Research Centre (BARC) — later tech transfer (same institute as the ferro-alloy alumino-thermic process)\n\n═══ E-WASTE ════════════════════════════════════════════════════════════\n• CPCB/SPCB authorised recycler: SPCB/CG/EWR/001\n• Licenced capacity: 750 MTA\n• Plant: Shed No. 25, Borai Industrial Growth Center, Rasmada, Durg (C.G.)\n• Feeds the non-ferrous and precious-metal recovery stream of the Bhilai/Durg operations\n\n═══ FERRO-ALLOY & ALUMINIUM (primary historic business) ════════════════\n• Low & medium carbon ferro-alloys via alumino-thermic process (BARC tech transfer, 2004; exports restricted per BARC agreement)\n• De-oxidation / desulphurisation compounds (Ca / Al / Mg based) supplied to major Indian alloy-steel plants incl. SAIL\n• Aluminium division — reprocesses aluminium dross & scrap → recycled ingots, powder, shots, notch bar\n• Durg plant capacity: 10,000 TPA of de-ox / de-sulph products (single shift); expansion to 25,000 TPA planned\n• Ancillary range: nozzle filling compound, synthetic slag, slag conditioner, casting powders, fluorspar lumps, ferro chemicals, manganese / cobalt sulphate (industrial grade)\n\nEXPORTS — China, Russia, Saudi Arabia (~20% of turnover)\n\nKEY PEOPLE\n• Vinayachal Jha — Managing Director\n• Manoj Choudhary — Marketing Manager\n• Pankaj Sachan — Marketing Executive\n\nDOMAINS\n• advindia.com — corporate / steelmaking products\n• advindia.in — Li-ion battery & e-waste division\n• indiamart.com/advmetal — trading storefront',
  updated_at = now()
WHERE recycler_code = 'CPCB-CG-001';

COMMIT;
