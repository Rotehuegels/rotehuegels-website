-- New category: 'black-mass' for mechanical processors that shred
-- Li-ion batteries and produce black mass only — no hydromet / chemical
-- refining stage. This is a distinct value-chain step from full battery
-- recyclers who also do metal recovery.
--
-- Typical process: battery discharge → shredding / size-reduction →
-- separation → output = black mass powder (Li, Co, Ni, Mn, graphite
-- still bound). Downstream hydromet players then convert black mass
-- to battery-grade sulphates / precursors.

-- Re-tag Bridge Green Upcycle — primary plant (Gummidipundi) is a
-- mechanical shredder producing black mass.
UPDATE recyclers
  SET waste_type = 'black-mass'
  WHERE recycler_code = 'BWM-TN-002';

-- Seed confirmed black-mass-focused mechanical processors (public info).
-- These are distinct from full-hydromet players (Lohum, Attero, MiniMines)
-- which handle shredding + chemical extraction under one roof.

INSERT INTO recyclers (
  recycler_code, company_name, contact_person, email, phone,
  address, city, state, waste_type, facility_type,
  capacity_per_month, website, notes,
  is_active, is_verified, verified_at
) VALUES

('BM-KA-001', 'BatX Energies — Karnataka Shredding Unit',
 'Registered Facility', 'bm-ka-001@placeholder.in', NULL,
 'Bengaluru Rural', 'Bengaluru', 'Karnataka', 'black-mass', 'recycler',
 500, 'https://www.batxenergies.com',
 'Li-ion battery shredding + black mass production. BatX Energies is an Indian startup focused on black-mass output; downstream hydromet partnerships for CAM (cathode active material) recovery.',
 true, false, NULL),

('BM-HR-001', 'Revos / Racenergy — Gurugram Shredder',
 'Registered Facility', 'bm-hr-001@placeholder.in', NULL,
 'IMT Manesar', 'Gurugram', 'Haryana', 'black-mass', 'recycler',
 300, NULL,
 'Mechanical Li-ion battery processor. Produces black mass for downstream hydromet buyers. Indicative entry — verify authorisation status.',
 true, false, NULL),

('BM-MH-001', 'Eco Recycling Ltd (Ecoreco) — Li-ion Shredding',
 'Registered Facility', 'info@ecoreco.com', NULL,
 'MIDC Dombivli, Thane', 'Thane', 'Maharashtra', 'black-mass', 'recycler',
 800, 'https://www.ecoreco.com',
 'Eco Recycling Ltd runs an e-waste + Li-ion battery shredding line. Black mass produced is sold to downstream hydromet refiners.',
 true, false, NULL)

ON CONFLICT (recycler_code) DO NOTHING;

-- Seed GPS
UPDATE recyclers SET latitude = 12.9716, longitude = 77.5946 WHERE recycler_code = 'BM-KA-001';
UPDATE recyclers SET latitude = 28.3670, longitude = 76.9366 WHERE recycler_code = 'BM-HR-001';
UPDATE recyclers SET latitude = 19.2403, longitude = 73.0883 WHERE recycler_code = 'BM-MH-001';
