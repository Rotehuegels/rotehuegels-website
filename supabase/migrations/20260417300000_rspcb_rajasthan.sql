-- ── RSPCB Rajasthan Recyclers ────────────────────────────────────────────────
-- Source: RSPCB Official PDF — List of Dismantlers/Refurbishers/Recyclers
-- URL: environment.rajasthan.gov.in
-- Date: 2026-04-17
-- ────────────────────────────────────────────────────────────────────────────

-- Update existing RJ entries with facility_type from RSPCB
UPDATE ewaste_recyclers SET facility_type = 'both' WHERE recycler_code = 'CPCB-RJ-001';
UPDATE ewaste_recyclers SET facility_type = 'both' WHERE recycler_code = 'CPCB-RJ-002';
UPDATE ewaste_recyclers SET facility_type = 'both' WHERE recycler_code = 'CPCB-RJ-005';
UPDATE ewaste_recyclers SET facility_type = 'both' WHERE recycler_code = 'CPCB-RJ-007';
UPDATE ewaste_recyclers SET facility_type = 'recycler' WHERE recycler_code = 'CPCB-RJ-008';

-- New RSPCB entries
INSERT INTO ewaste_recyclers (recycler_code, company_name, contact_person, email, phone, address, city, state, waste_type, facility_type, is_active, is_verified, verified_at) VALUES
('RSPCB-RJ-003', 'Shri Krishna Additives Pvt. Ltd.', 'Registered Facility', 'rspcb.rj003@placeholder.in', NULL, 'F-105, Matasya Industrial Area', 'Alwar', 'Rajasthan', 'e-waste', 'dismantler', true, true, now()),
('RSPCB-RJ-006', 'E Reclaim Services Pvt. Ltd.', 'Registered Facility', 'rspcb.rj006@placeholder.in', NULL, 'Plot No. 466, VKI', 'Jaipur', 'Rajasthan', 'e-waste', 'dismantler', true, true, now()),
('RSPCB-RJ-008', 'S.B.J. & Company', 'Registered Facility', 'rspcb.rj008@placeholder.in', NULL, 'F-137, Growth Centre, RIICO, Industrial Area', 'Dholpur', 'Rajasthan', 'e-waste', 'dismantler', true, true, now()),
('RSPCB-RJ-010', 'Abhinav Enterprises', 'Registered Facility', 'rspcb.rj010@placeholder.in', NULL, 'Khasara no. 9669, Village Thok Maliyan, 3 Gyanoday Nagar, Naka Madar', 'Ajmer', 'Rajasthan', 'e-waste', 'both', true, true, now()),
('RSPCB-RJ-012', 'Greenlet Recyclers Pvt. Ltd.', 'Registered Facility', 'rspcb.rj012@placeholder.in', NULL, '29 Janakpuri, First Imli Wala Phatak', 'Jaipur', 'Rajasthan', 'e-waste', 'both', true, true, now()),
('RSPCB-RJ-013', 'Fateh Enviro Lab', 'Registered Facility', 'rspcb.rj013@placeholder.in', NULL, 'Khasara no. 1036/14, Industrial Area, JASOL', 'Balotra', 'Rajasthan', 'e-waste', 'both', true, true, now()),
('RSPCB-RJ-016', 'Vinay Traders', 'Registered Facility', 'rspcb.rj016@placeholder.in', NULL, 'F-241-242, RIICO Ind. Area, Palra', 'Ajmer', 'Rajasthan', 'e-waste', 'both', true, true, now()),
('RSPCB-RJ-017', 'Greenweb Recycling', 'Registered Facility', 'rspcb.rj017@placeholder.in', NULL, 'Web Plaza, 84-85, First Floor, Shyam Nagar, Benar Road, Jhotwada', 'Jaipur', 'Rajasthan', 'e-waste', 'both', true, true, now()),
('RSPCB-RJ-018', 'Harkan Solutions & Services India Pvt. Ltd.', 'Registered Facility', 'rspcb.rj018@placeholder.in', NULL, 'G1-201, RIICO Ind. Area, Kahrani, Bhiwadi', 'Alwar', 'Rajasthan', 'e-waste', 'dismantler', true, true, now()),
('RSPCB-RJ-019', 'GS International', 'Registered Facility', 'rspcb.rj019@placeholder.in', NULL, 'G1-101, Shri Khatu Shyam Ji Ind. Complex, Ringus', 'Sikar', 'Rajasthan', 'e-waste', 'both', true, true, now()),
('RSPCB-RJ-020', 'Rohit Pigments Industries Pvt. Ltd.', 'Registered Facility', 'rspcb.rj020@placeholder.in', NULL, 'B-81/B, RIICO Ind. Area', 'Dholpur', 'Rajasthan', 'e-waste', 'dismantler', true, true, now()),
('RSPCB-RJ-021', 'K.G. Metalloys', 'Registered Facility', 'rspcb.rj021@placeholder.in', NULL, 'F-37-38 RIICO, Ind. Area, Ondela Road', 'Dholpur', 'Rajasthan', 'e-waste', 'dismantler', true, true, now()),
('RSPCB-RJ-022', 'Globe Impex', 'Registered Facility', 'rspcb.rj022@placeholder.in', NULL, 'G1-74, RIICO Ind. Area, Chopanki, Tijara', 'Alwar', 'Rajasthan', 'e-waste', 'both', true, true, now()),
('RSPCB-RJ-023', 'Adatte E-Waste Management Pvt. Ltd.', 'Registered Facility', 'abhimanyu@adatte.in', NULL, 'C6/23, Opp. Post Office, Safdarganj Development Area', 'New Delhi', 'Rajasthan', 'e-waste', 'both', true, true, now()),
('RSPCB-RJ-024', 'Green Recycling Waste Management', 'Registered Facility', 'rspcb.rj024@placeholder.in', NULL, 'J-983, RIICO Ind. Area, Chopanki, Tijara', 'Alwar', 'Rajasthan', 'e-waste', 'dismantler', true, true, now()),
('RSPCB-RJ-025', 'J.K. Enterprises', 'Registered Facility', 'rspcb.rj025@placeholder.in', NULL, 'Araji no. 36/02, Samrathpura, Patwar, Chhapri, Kapasan', 'Chittorgarh', 'Rajasthan', 'e-waste', 'both', true, true, now()),
('RSPCB-RJ-026', 'PWL Ventures', 'Registered Facility', 'rspcb.rj026@placeholder.in', NULL, 'B137, Queen Road, Vidyut Nagar B', 'Jaipur', 'Rajasthan', 'e-waste', 'both', true, true, now()),
('RSPCB-RJ-027', 'H.M. Traders', 'Registered Facility', 'rspcb.rj027@placeholder.in', NULL, 'H1-137(H), RIA, Shahjahanpur Tehsil Behror', 'Alwar', 'Rajasthan', 'e-waste', 'both', true, true, now()),
('RSPCB-RJ-028', 'Abaad Developers Pvt. Ltd.', 'Registered Facility', 'info@abaadd.com', '8588876751', 'G1-747, RIICO Ind. Area, Chopanki, Bhiwadi', 'Alwar', 'Rajasthan', 'e-waste', 'both', true, true, now()),
('RSPCB-RJ-029', 'Ramdas Trading Company', 'Registered Facility', 'rspcb.rj029@placeholder.in', NULL, 'G1-177-C, RIICO Ind. Area, MIA, Ramgarh', 'Alwar', 'Rajasthan', 'e-waste', 'dismantler', true, true, now()),
('RSPCB-RJ-030', 'Green India Waste Management', 'Registered Facility', 'rspcb.rj030@placeholder.in', NULL, 'G-1/565, RIICO Ind. Area, Khuskhera, Tapukara, Bhiwadi', 'Alwar', 'Rajasthan', 'e-waste', 'both', true, true, now())
ON CONFLICT (recycler_code) DO NOTHING;
