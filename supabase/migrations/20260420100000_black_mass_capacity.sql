-- Black mass production is often a step within a larger recycler's workflow
-- (full-hydromet players shred first, then extract). A single waste_type
-- flag can't capture this. Add a numeric black_mass_mta column so any
-- facility can be flagged as a black-mass producer alongside its primary
-- category.
--
-- Interpretation:
--   NULL           = not a black-mass producer (or unknown)
--   integer value  = approximate MTA throughput of the shredding /
--                    black-mass-producing stage, as publicly disclosed
--                    or estimated from plant announcements
--
-- Map filter for "Black Mass / Mechanical" should return:
--   waste_type = 'black-mass' (pure mechanical) OR black_mass_mta IS NOT NULL

ALTER TABLE recyclers
  ADD COLUMN IF NOT EXISTS black_mass_mta INTEGER;

COMMENT ON COLUMN recyclers.black_mass_mta IS
  'Approximate black-mass production throughput in MTA. Public disclosure or reasonable estimate. NULL = not a black-mass producer.';

-- Pure-mechanical shredders seeded earlier: set their black_mass_mta to match capacity
UPDATE recyclers SET black_mass_mta = 3000  WHERE recycler_code = 'BWM-TN-002';  -- Bridge Green Gummidipundi 10 TPD
UPDATE recyclers SET black_mass_mta = 500   WHERE recycler_code = 'BM-KA-001';   -- BatX Bengaluru
UPDATE recyclers SET black_mass_mta = 800   WHERE recycler_code = 'BM-MH-001';   -- Ecoreco Thane
UPDATE recyclers SET black_mass_mta = 300   WHERE recycler_code = 'BM-HR-001';   -- Revos Gurugram

-- Integrated full-hydromet players with significant shredding / black-mass
-- output. Figures are approximate public-disclosure estimates.

-- Attero Recycling — flagship Haridwar + Roorkee plants do combined e-waste
-- and Li-ion shredding. Li-ion capacity ~11 KTPA; black-mass-producing portion
-- roughly estimated at ~5000 MTA across facilities.
UPDATE recyclers SET black_mass_mta = 5000
  WHERE recycler_code IN ('CPCB-UP-001', 'CPCB-UK-001');

-- Lohum Cleantech (Greater Noida) — integrated Li-ion recycling; shredder line
-- handles most of their ~10 KTPA throughput.
UPDATE recyclers SET black_mass_mta = 10000
  WHERE recycler_code = 'BWM-UP-001';

-- MiniMines Cleantech (Bengaluru) — Li-ion focused, integrated facility,
-- shredder capacity ~5000 MTA.
UPDATE recyclers SET black_mass_mta = 5000
  WHERE recycler_code = 'BWM-KA-002';

-- Gravita India (Jaipur) — primarily lead-acid but with Li-ion shredding arm.
-- Allocate conservative ~2000 MTA to black mass.
UPDATE recyclers SET black_mass_mta = 2000
  WHERE recycler_code = 'BWM-RJ-001';

-- Sungeel HiMetal India (Tamil Nadu) — Korean-parent Li-ion recycler with
-- shredding + hydromet under one roof. ~3000 MTA shredder.
UPDATE recyclers SET black_mass_mta = 3000
  WHERE recycler_code = 'BWM-TN-001';

-- ── New dedicated black-mass producers ─────────────────────────────────────

INSERT INTO recyclers (
  recycler_code, company_name, contact_person, email, phone,
  address, city, state, waste_type, facility_type,
  capacity_per_month, black_mass_mta, website, notes,
  is_active, is_verified, verified_at
) VALUES

-- Nulife Power Services — battery dismantling + black-mass (Pune)
('BM-MH-002', 'Nulife Power Services Pvt Ltd',
 'Registered Facility', 'bm-mh-002@placeholder.in', NULL,
 'MIDC Chakan', 'Pune', 'Maharashtra', 'black-mass', 'recycler',
 500, 500, 'https://www.nulifepower.com',
 'Li-ion battery dismantling + mechanical shredding. Black mass output ~500 MTA (estimated). Pune facility, serves OEMs and second-life battery channels.',
 true, false, NULL),

-- TATA Chemicals — Dholera Li-ion recycling pilot
('BM-GJ-001', 'Tata Chemicals — Dholera Li-ion Recycling Pilot',
 'Registered Facility', 'bm-gj-001@placeholder.in', NULL,
 'Dholera SIR', 'Dholera', 'Gujarat', 'black-mass', 'producer',
 3000, 3000, 'https://www.tatachemicals.com',
 'Pilot Li-ion battery recycling at Dholera. Focus on shredding + black mass production; downstream integration with Tata group cell manufacturing announced.',
 true, false, NULL)

ON CONFLICT (recycler_code) DO NOTHING;

-- GPS for new rows
UPDATE recyclers SET latitude = 18.7607, longitude = 73.8604 WHERE recycler_code = 'BM-MH-002';
UPDATE recyclers SET latitude = 22.2539, longitude = 72.1925 WHERE recycler_code = 'BM-GJ-001';

-- Helpful index for the "black mass producers" filter
CREATE INDEX IF NOT EXISTS idx_recyclers_black_mass
  ON recyclers (black_mass_mta)
  WHERE black_mass_mta IS NOT NULL;
