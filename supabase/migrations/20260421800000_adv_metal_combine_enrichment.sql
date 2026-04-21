-- Enrich ADV Metal Combine Pvt. Ltd. (CPCB-CG-001) with full company profile.
--
-- Context: row was seeded from the CPCB list as a 750 MTA e-waste recycler
-- only. Public research confirms ADV is primarily a ferro-alloy and aluminium
-- producer in Delhi/Durg, with e-waste recycling as one line of business.
--
-- Sources:
--   - https://advindia.com/  (corporate site)
--   - http://www.advindia.com/about_us.asp  (Durg plant description)
--   - https://advindia.in/  (Li-ion battery / e-waste division)
--   - https://www.indiamart.com/advmetal/profile.html  (IndiaMART profile, est. 1997)
--   - CPCB Authorised E-Waste Recyclers list (SPCB/CG/EWR/001)

BEGIN;

UPDATE recyclers
SET
  website         = 'https://advindia.com',
  email           = 'info@advmetal.com',
  phone           = '+91-11-41525525',
  contact_person  = 'Vinayachal Jha (Managing Director)',
  capabilities    = ARRAY[
    'Low & medium carbon ferro-alloys (alumino-thermic process)',
    'Aluminium ingots, powder & fines',
    'Recycled aluminium ingots (dross / scrap reprocessing)',
    'De-oxidation & desulphurisation compounds (Ca / Al / Mg based)',
    'Desulphuriser, Dephosphoriser, Slag Conditioner',
    'Nozzle filling compound, synthetic slag, casting powders',
    'Ferro chemicals, fluorspar lumps, manganese sulphate',
    'E-waste dismantling & recycling (SPCB/CG/EWR/001)'
  ],
  notes           = E'ADV Metal Combine Pvt. Ltd. is a Delhi-headquartered manufacturer, importer and exporter of industrial minerals, metals and ferro-alloys — established 1997 and part of the ADV Group.\n\nPRIMARY BUSINESS — ferro-alloys & steelmaking inputs\n• Low and medium carbon ferro-alloys produced via the alumino-thermic process (Unit II; technical collaboration with Bhabha Atomic Research Centre, 2004 — exports restricted per BARC agreement).\n• De-oxidation and desulphurisation compounds (calcium-, aluminium- and magnesium-based) supplied to major Indian alloy steel plants (SAIL among stated customers).\n• Ancillary steelmaking products: nozzle filling compound, synthetic slag, slag conditioners, casting powders, fluorspar lumps, ferro chemicals, manganese sulphate, cobalt sulphate.\n\nALUMINIUM DIVISION\n• Reprocesses aluminium dross and scrap into recycled aluminium ingots.\n• Also produces aluminium powder, coarse powder (fines) and shots / notch bar.\n\nDURG PLANT (this facility — Shed No. 25, Borai IGC, Rasmada, Durg, C.G.)\n• Installed capacity: 10,000 TPA of de-oxidation / desulphurisation products on single-shift basis; expansion to 25,000 TPA planned.\n• CPCB-registered e-waste recycler at 750 MTA (SPCB/CG/EWR/001) — dismantling & recovery, integrated with the non-ferrous metal recovery at the same site.\n\nEXPORTS — China, Russia, Saudi Arabia (~20% of turnover).\n\nKEY PEOPLE\n• Vinayachal Jha — Managing Director\n• Manoj Choudhary — Marketing Manager\n• Pankaj Sachan — Marketing Executive\n\nGROUP AFFILIATES / DOMAINS\n• advindia.com — corporate\n• advindia.in — Li-ion battery / e-waste division\n• indiamart.com/advmetal — trading storefront',
  websites_all    = jsonb_build_array(
    jsonb_build_object('url', 'https://advindia.com',  'source', 'manual-research', 'first_seen', '2026-04-21'),
    jsonb_build_object('url', 'https://advindia.in',   'source', 'manual-research', 'first_seen', '2026-04-21'),
    jsonb_build_object('url', 'https://www.indiamart.com/advmetal/', 'source', 'manual-research', 'first_seen', '2026-04-21')
  ),
  contacts_all    = jsonb_build_array(
    jsonb_build_object('name', 'Vinayachal Jha',  'title', 'Managing Director',   'email', 'info@advmetal.com',    'phone', '+91-11-41525525', 'source', 'advindia.com',           'first_seen', '2026-04-21'),
    jsonb_build_object('name', 'Manoj Choudhary', 'title', 'Manager, Marketing',  'source', 'ZoomInfo / advindia.com', 'first_seen', '2026-04-21'),
    jsonb_build_object('name', 'Pankaj Sachan',   'title', 'Marketing Executive', 'source', 'ZoomInfo / advindia.com', 'first_seen', '2026-04-21'),
    jsonb_build_object('name', 'General enquiries', 'email', 'advmetal@hotmail.com', 'source', 'advindia.com/about_us', 'first_seen', '2026-04-21')
  ),
  updated_at      = now()
WHERE recycler_code = 'CPCB-CG-001';

COMMIT;
