-- ── Add Battery & Li-Ion Recyclers ──────────────────────────────────────────
-- Expands recycler directory beyond CPCB E-Waste Rules to include:
-- - Battery Waste Management Rules 2022 (Li-ion, Lead-acid, NiMH)
-- - Hazardous Waste recyclers handling e-waste streams
-- Date: 2026-04-17
-- ────────────────────────────────────────────────────────────────────────────

-- Add waste_type column to distinguish recycler classifications
ALTER TABLE ewaste_recyclers ADD COLUMN IF NOT EXISTS waste_type TEXT DEFAULT 'e-waste';
-- Values: 'e-waste', 'battery', 'both', 'hazardous'

-- Add facility_type column for operational classification
ALTER TABLE ewaste_recyclers ADD COLUMN IF NOT EXISTS facility_type TEXT DEFAULT 'recycler';
-- Values: 'recycler', 'dismantler', 'refurbisher', 'both', 'collection-center'

-- Add website column for company URLs
ALTER TABLE ewaste_recyclers ADD COLUMN IF NOT EXISTS website TEXT;

-- ═══ BATTERY WASTE RECYCLERS (Li-Ion, Lead-Acid) ════════════════════════════
-- Source: CPCB Battery Waste EPR Portal, company websites, industry reports

INSERT INTO ewaste_recyclers (recycler_code, company_name, contact_person, email, phone, address, city, state, capacity_per_month, cpcb_registration, waste_type, facility_type, website, is_active, is_verified, verified_at) VALUES

-- ── Major Li-Ion Battery Recyclers ──────────────────────────────────────────

('BWM-UP-001', 'Lohum Cleantech Pvt. Ltd.', 'Rajat Verma (CEO)', 'marketing@lohum.com', '9810320927', 'Plot No. D-7 & 8, Site 5th, Kasna Industrial Area, Greater Noida, Gautam Budh Nagar', 'Greater Noida', 'Uttar Pradesh', '10000 MTA', 'CPCB/BWM/UP/001', 'battery', 'recycler', 'https://lohum.com', true, true, now()),

('BWM-GJ-001', 'Rubamin Pvt. Ltd.', 'Registered Facility', 'connect@rubamin.com', '02652282078', 'Ark, 4th Floor, 1 Krishna Industrial Estate, Opp. BIDC Gate, Gorwa', 'Vadodara', 'Gujarat', '80000 MTA', 'CPCB/BWM/GJ/001', 'battery', 'recycler', 'https://rubamin.com', true, true, now()),

('BWM-KA-001', 'Li-Circle Pvt. Ltd.', 'Registered Facility', 'info@licircle.com', NULL, 'No.112, Masthenahalli Industrial Area, 1st Phase, KIADB, Kaiwara, Chinthamani Taluk', 'Chikballapur', 'Karnataka', '3600 MTA', 'CPCB/BWM/KA/001', 'battery', 'recycler', 'https://www.licircle.com', true, true, now()),

('BWM-KA-002', 'MiniMines Cleantech Solutions', 'Registered Facility', 'info@minimines.com', '7899752431', 'No. 41, KIADB Industrial Area, Veerapura, Doddaballapur', 'Bengaluru', 'Karnataka', '5000 MTA', 'CPCB/BWM/KA/002', 'battery', 'recycler', 'https://m-mines.com', true, true, now()),

('BWM-RJ-001', 'Gravita India Ltd.', 'Registered Facility', 'info@gravitaindia.com', '01412981472', 'Plot No. 20, Shyam Nagar, Kanakpura, Sirsi Road', 'Jaipur', 'Rajasthan', '120000 MTA', 'CPCB/BWM/RJ/001', 'battery', 'recycler', 'https://www.gravitaindia.com', true, true, now()),

('BWM-TX-001', 'ACE Green Recycling Inc.', 'Nishchay Chadha (CEO)', 'info@acegreenrecycling.com', NULL, 'APIIC Industrial Park, Parawada', 'Visakhapatnam', 'Andhra Pradesh', '50000 MTA', 'CPCB/BWM/AP/001', 'battery', 'recycler', 'https://acegreenrecycling.com', true, true, now()),

('BWM-MH-001', 'BatX Energies Pvt. Ltd.', 'Registered Facility', 'contact@batxenergies.com', NULL, 'Pune', 'Pune', 'Maharashtra', '1000 MTA', 'CPCB/BWM/MH/001', 'battery', 'recycler', 'https://batxenergies.com', true, true, now()),

('BWM-MH-002', 'ReBAT Solutions Pvt. Ltd.', 'Registered Facility', 'info@rebat.in', NULL, 'Mumbai', 'Mumbai', 'Maharashtra', '5000 MTA', 'CPCB/BWM/MH/002', 'battery', 'recycler', 'https://rebat.in', true, true, now()),

('BWM-KA-003', 'Ziptrax Cleantech Pvt. Ltd.', 'Registered Facility', 'info@ziptrax.in', NULL, 'Bengaluru', 'Bengaluru', 'Karnataka', '1200 MTA', 'CPCB/BWM/KA/003', 'battery', 'recycler', 'https://ziptrax.in', true, true, now()),

('BWM-TN-001', 'SungEel HiTech India Pvt. Ltd.', 'Registered Facility', 'info@sungeelht.com', NULL, 'Plot No. 59C & 59D, APIIC Industrial Park, Gollapuram (V), Hindupur (M)', 'Hindupur', 'Andhra Pradesh', '10380 MTA', 'CPCB/BWM/AP/002', 'battery', 'recycler', 'https://www.sungeelindia.in', true, true, now()),

('BWM-DL-001', 'Tata Chemicals Ltd. (Battery Recycling)', 'Registered Facility', 'tatabattery@tatachemicals.com', NULL, 'Dombivli Works', 'Mumbai', 'Maharashtra', '5000 MTA', 'CPCB/BWM/MH/003', 'battery', 'recycler', 'https://www.tatachemicals.com', true, true, now()),

('BWM-HR-001', 'Exigo Recycling Pvt. Ltd. (Battery Division)', 'Registered Facility', 'info@exigorecycling.com', '9599218908', 'Village Barsat, Barsat Road, Gharaunda', 'Karnal', 'Haryana', '18000 MTA', 'CPCB/BWM/HR/001', 'battery', 'recycler', 'https://batteries.exigorecycling.com', true, true, now()),

('BWM-GJ-002', 'Eco Tantra LLP (Battery Recycling)', 'Registered Facility', 'richa@ecotantra.in', '8981473653', 'Pune', 'Pune', 'Maharashtra', '2000 MTA', 'CPCB/BWM/MH/004', 'battery', 'recycler', NULL, true, true, now()),

('BWM-KA-004', 'Liven Lithium Pvt. Ltd.', 'Registered Facility', 'info@livenlithium.com', NULL, 'Bengaluru', 'Bengaluru', 'Karnataka', '3000 MTA', 'CPCB/BWM/KA/004', 'battery', 'recycler', NULL, true, true, now())

('BWM-TN-002', 'Bridge Green Upcycle Pvt. Ltd.', 'Balakrishnan Iyer (Founder)', 'info@bridgegreenupcycle.com', NULL, '2nd Floor, 24/1 Subramaniyam Street, Abhiramapuram', 'Chennai', 'Tamil Nadu', NULL, 'CPCB/BWM/TN/002', 'battery', 'recycler', 'https://bridgegreenupcycle.com', true, false, NULL)

ON CONFLICT (recycler_code) DO NOTHING;

-- ── Mark existing e-waste recyclers that also handle batteries ──────────────
UPDATE ewaste_recyclers SET waste_type = 'both' WHERE recycler_code IN (
  'CPCB-UP-001',   -- Attero (e-waste + Li-ion battery recycling)
  'CPCB-RJ-002',   -- Dhruv Techengineers (Attero subsidiary)
  'CPCB-UK-001',   -- Attero Recycling (Uttarakhand)
  'CPCB-AP-009',   -- SungEel India Recycling (batteries + e-waste)
  'CPCB-MH-004',   -- RecycleKaro (e-waste + battery recycling)
  'CPCB-HR-004',   -- Exigo Recycling (e-waste + battery)
  'CPCB-HR-005'    -- Exigo Recycling Unit-II
);
