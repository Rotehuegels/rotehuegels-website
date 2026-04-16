-- ── KSPCB Karnataka — Official Dismantler + Recycler List ────────────────────
-- Source: KSPCB Official PDF — List of E-Waste Dismantlers & Recyclers
-- Status as on 28.01.2022
-- URL: kspcb.karnataka.gov.in
-- Note: PDF has addresses + capacities but NO emails/phones
-- Date: 2026-04-17
-- ────────────────────────────────────────────────────────────────────────────

-- Update facility_type from KSPCB official classification
-- Dismantlers (24 entries)
UPDATE ewaste_recyclers SET facility_type = 'dismantler' WHERE recycler_code IN (
  'CPCB-KA-043','CPCB-KA-044','CPCB-KA-017','CPCB-KA-008',
  'CPCB-KA-013','CPCB-KA-027','CPCB-KA-016','CPCB-KA-026',
  'CPCB-KA-025','CPCB-KA-045','CPCB-KA-046','CPCB-KA-047',
  'CPCB-KA-048','CPCB-KA-010','CPCB-KA-030','CPCB-KA-020'
);

-- Recyclers (19 entries)
UPDATE ewaste_recyclers SET facility_type = 'recycler' WHERE recycler_code IN (
  'CPCB-KA-032','CPCB-KA-041','CPCB-KA-052','CPCB-KA-053',
  'CPCB-KA-054','CPCB-KA-035','CPCB-KA-055','CPCB-KA-015',
  'CPCB-KA-042','CPCB-KA-004','CPCB-KA-056','CPCB-KA-057',
  'CPCB-KA-037','CPCB-KA-036','CPCB-KA-058','CPCB-KA-023',
  'CPCB-KA-049','CPCB-KA-014','CPCB-KA-059'
);

-- New entries from KSPCB not in CPCB seed
INSERT INTO ewaste_recyclers (recycler_code, company_name, contact_person, email, address, city, state, waste_type, facility_type, capacity_per_month, is_active, is_verified, verified_at) VALUES
('KSPCB-DM-011', 'Newtek Recyclers', 'Registered Facility', 'kspcb.dm011@placeholder.in', 'No 124, Byreveshwara Industrial Estate, Andhrahalli Main Road, Peenya 2nd Stage', 'Bengaluru', 'Karnataka', 'e-waste', 'dismantler', '300 MTA', true, true, now()),
('KSPCB-DM-014', 'Ameena Enterprises', 'Registered Facility', 'kspcb.dm014@placeholder.in', 'Shed No.C-199, KSSIDC Industrial Estate, Hebbal, Mysore', 'Mysuru', 'Karnataka', 'e-waste', 'dismantler', '360 MTA', true, true, now()),
('KSPCB-DM-018', 'Eco-E-waste Recyclers India Pvt Ltd', 'Registered Facility', 'kspcb.dm018@placeholder.in', 'No.41/1, 42/2, 19 & 20, 2nd Cross, Mutachari Industrial Estate, Mysore Road', 'Bengaluru', 'Karnataka', 'e-waste', 'dismantler', '300 MTA', true, true, now()),
('KSPCB-DM-022', 'Excel Recycling', 'Registered Facility', 'kspcb.dm022@placeholder.in', 'P.no.212/2, Tippu Town, Rammanahalli Village, Mysuru Taluk & District', 'Mysuru', 'Karnataka', 'e-waste', 'dismantler', '720 MTA', true, true, now()),
('KSPCB-DM-024', 'E-Cycle Solutions', 'Registered Facility', 'kspcb.dm024@placeholder.in', '41, 7th Cross, Bahubali Nagar, Jalahalli', 'Bengaluru', 'Karnataka', 'e-waste', 'dismantler', '900 MTA', true, true, now()),
('KSPCB-RC-018', 'Trackon E-waste Recyclers Pvt. Ltd.', 'Registered Facility', 'kspcb.rc018@placeholder.in', 'No.28, Gerupalya, 2nd Phase, Kumbalgodu Industrial Area', 'Bengaluru', 'Karnataka', 'e-waste', 'recycler', '300 MTA', true, true, now())
ON CONFLICT (recycler_code) DO NOTHING;
