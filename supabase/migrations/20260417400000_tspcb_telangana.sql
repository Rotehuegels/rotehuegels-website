-- ── TSPCB Telangana — Full Official Data ─────────────────────────────────────
-- Source: TSPCB Official PDF — Details of Authorised E-Waste Dismantlers,
--         Recyclers and Producers with EPR Authorization
-- URL: tgpcb.cgg.gov.in/Uploads/PcbDocumentAllUploads/Ewastewebsite.pdf
-- Date: 2026-04-17
-- ────────────────────────────────────────────────────────────────────────────

-- I. E-WASTE RECYCLING UNITS (14 entries with verified contacts)
UPDATE ewaste_recyclers SET email = 'john@earthsense.in', phone = '9676931233', contact_person = 'Sri Balaji Chowdary', capacity_per_month = '22775 MTA' WHERE recycler_code = 'CPCB-TS-001';
UPDATE ewaste_recyclers SET email = 'info@zenviroindustries.com', phone = '9246176867', contact_person = 'Sri Mujeebqadri', capacity_per_month = '20000 MTA' WHERE recycler_code = 'CPCB-TS-002';
UPDATE ewaste_recyclers SET email = 'md@siliconplanet.in', phone = '8008364639', contact_person = 'Sri V. Rohit Kumar' WHERE recycler_code = 'CPCB-TS-003';
UPDATE ewaste_recyclers SET email = 'risenshines@gmail.com', phone = '8074346409', contact_person = 'Naresh Sarangpani Raj' WHERE recycler_code = 'CPCB-TS-004';
UPDATE ewaste_recyclers SET email = 'greenenviro.ewasterecycling@gmail.com', phone = '8309662073', contact_person = 'Mohammed Ahmed' WHERE recycler_code = 'CPCB-TS-005';
UPDATE ewaste_recyclers SET email = 'shreem.mythri@gmail.com', phone = '8374888889' WHERE recycler_code = 'CPCB-TS-006';
UPDATE ewaste_recyclers SET email = 'info@elima.in', phone = '9032122452' WHERE recycler_code = 'CPCB-TS-007';
UPDATE ewaste_recyclers SET email = 'snlmalpani@gmail.com', phone = '9160677730' WHERE recycler_code = 'CPCB-TS-008';
UPDATE ewaste_recyclers SET email = 'gwerecycle9@gmail.com', phone = '6303741689' WHERE recycler_code = 'CPCB-TS-009';
UPDATE ewaste_recyclers SET email = 'mnraju@pureearth.co.in', phone = '6300690518' WHERE recycler_code = 'CPCB-TS-010';
UPDATE ewaste_recyclers SET email = 'etech.ewaste@gmail.com', phone = '9704271592' WHERE recycler_code = 'CPCB-TS-011';
UPDATE ewaste_recyclers SET email = 'aj@rebootresources.com', phone = '7702230808', contact_person = 'Amit Jha' WHERE recycler_code = 'CPCB-TS-012';
UPDATE ewaste_recyclers SET email = 'purushothamrao.koti@resustainablity.com', phone = '9100035476' WHERE recycler_code = 'CPCB-TS-013';
UPDATE ewaste_recyclers SET email = 'drkharitha12@gmail.com', phone = '9618471199' WHERE recycler_code = 'CPCB-TS-014';

-- II. E-WASTE DISMANTLING UNITS (14 new entries)
INSERT INTO ewaste_recyclers (recycler_code, company_name, contact_person, email, phone, address, city, state, waste_type, facility_type, capacity_per_month, is_active, is_verified, verified_at) VALUES
('TSPCB-DM-001', 'Enviro Collection Centre (Dismantling Unit)', 'Sri Subramanyam', 'envirocollectioncentre@gmail.com', '9885538905', 'Plot No.1-185/2/A, Sy.No.298 Part, Phase-I, IDA Jeedimetla, Medchal-Malkajgiri', 'Hyderabad', 'Telangana', 'e-waste', 'dismantler', '720 MTA', true, true, now()),
('TSPCB-DM-002', 'Re Sustainability Limited (Ramky E-Waste)', 'Sri Mohith', 'mohithkumar.v@ramky.com', '9032124522', 'Plot No.25, Hardware Park, Maheshwaram (M), Rangareddy', 'Hyderabad', 'Telangana', 'e-waste', 'dismantler', '7840 MTA', true, true, now()),
('TSPCB-DM-003', 'Earthbox Ventures (E-Waste Dismantling)', 'Sri Sujith Reddy', 'sales@earthboxventures.com', '9642572727', 'Sy.Nos.29, 30 & 85, Uddemarri (V), Shamirpet (M), Medchal-Malkajgiri', 'Hyderabad', 'Telangana', 'e-waste', 'dismantler', '3600 MTA', true, true, now()),
('TSPCB-DM-004', 'Bellus E Waste', 'Sri Mohd. Azar', 'bellusscaffoldings@gmail.com', '8019155577', 'Sy.No.4-120, Ramachandrapuram (GP), Kondurg (M), Rangareddy', 'Hyderabad', 'Telangana', 'e-waste', 'dismantler', '3600 MTA', true, true, now()),
('TSPCB-DM-005', 'Shreem Mythri Enterprises (Dismantling)', 'Sri Prabakhar', 'shreem.mythri@gmail.com', '9618653467', 'Plot No.50, Phase-III, IDA Cherlapally, Kapra (M), Medchal-Malkajgiri', 'Hyderabad', 'Telangana', 'e-waste', 'dismantler', '600 MTA', true, true, now()),
('TSPCB-DM-006', 'TES AMM India (Medchal)', 'Sri Thapan Kumar', 'tapankumardash@tes-amm.net', '9701011601', 'Plot No.79, Sy.No.847, IDA Medchal, Medchal (M), Medchal-Malkajgiri', 'Hyderabad', 'Telangana', 'e-waste', 'dismantler', '1490 MTA', true, true, now()),
('TSPCB-DM-007', 'Earthbox Ventures (Raviryala)', 'Sri Sujith Reddy', 'surjith@earthboxventures.com', '8106933636', 'Plot No.S-2/12, Sy.No.114/1, E-City, Raviryala (V), Maheshwaram (M), Rangareddy', 'Hyderabad', 'Telangana', 'e-waste', 'dismantler', '2340 MTA', true, true, now()),
('TSPCB-DM-008', 'Kamal Electronics Refurbishing', 'Sri Moosa', 'kamalelectronic786@gmail.com', '9346819607', 'Sy No: 227/LU, 227/E1, 227/E2, Atmakur (V), Sadasivpet (M), Sangareddy', 'Sangareddy', 'Telangana', 'e-waste', 'dismantler', '2686 MTA', true, true, now()),
('TSPCB-DM-009', 'Chilkuri Enterprises', 'Sri Mahendar Reddy', 'chilkurienterprises@yahoo.com', '9177332239', 'Sy.No.14, Keesara (M), Medchal-Malkajgiri', 'Hyderabad', 'Telangana', 'e-waste', 'dismantler', '540 MTA', true, true, now()),
('TSPCB-DM-010', 'Reboot Resources Private Limited', 'Sri Tarun Kapoor', 'aj@rebootresources.com', '7702230808', 'Sy.No.113 Part, Patelguda (V), Ibrahimpatnam (M), Rangareddy', 'Hyderabad', 'Telangana', 'e-waste', 'dismantler', '9468 MTA', true, true, now()),
('TSPCB-DM-011', 'Exclusive PC World', 'Registered Facility', 'exclusivepcworld@gmail.com', '9347093411', 'Plot No.30/9, Sy.No.460/2, TSIIC, IDA Mankhal, Maheshwaram (M), Rangareddy', 'Hyderabad', 'Telangana', 'e-waste', 'dismantler', '446 MTA', true, true, now()),
('TSPCB-DM-012', 'Ali Traders', 'Registered Facility', 'mdqasimali1986@gmail.com', '7013626029', 'Sy.No.491/2, Alampally (V), Vikarabad (M), Vikarabad', 'Vikarabad', 'Telangana', 'e-waste', 'dismantler', '720 MTA', true, true, now()),
('TSPCB-DM-013', 'Elifecycle Management (Dismantling)', 'Registered Facility', 'info@elima.in', '9032122452', 'Sy.No.468, 470, 471 & 472, Theegapur, Kothur, Rangareddy', 'Hyderabad', 'Telangana', 'e-waste', 'dismantler', '18900 MTA', true, true, now()),
('TSPCB-DM-014', 'Earth Sense Recycle (Dismantling)', 'Registered Facility', 'john@earthsense.in', '9566099352', 'H No 7-2/4, B V Rao Complex, Chattanpalle (V), Farooqnagar (M), Rangareddy', 'Hyderabad', 'Telangana', 'e-waste', 'dismantler', '1080 MTA', true, true, now())
ON CONFLICT (recycler_code) DO NOTHING;

-- III. E-WASTE REFURBISHING UNITS (2 entries)
INSERT INTO ewaste_recyclers (recycler_code, company_name, contact_person, email, phone, address, city, state, waste_type, facility_type, capacity_per_month, is_active, is_verified, verified_at) VALUES
('TSPCB-RF-001', 'Earth Sense Recycle (Refurbishing U-II)', 'Registered Facility', 'john@earthsense.in', '9566099352', 'H No 7-2/4, B V Rao Complex, Chattanpalle (V), Farooqnagar (M), Rangareddy', 'Hyderabad', 'Telangana', 'e-waste', 'refurbisher', '1080 MTA', true, true, now()),
('TSPCB-RF-002', 'Envirokare Recycling Solutions (Refurbishing)', 'Naresh Sarangpani Raj', 'risenshines@gmail.com', '8074346409', 'Sy No 475, Elkatta (V), Farooqnagar (M), Rangareddy', 'Hyderabad', 'Telangana', 'e-waste', 'refurbisher', '7200 MTA', true, true, now())
ON CONFLICT (recycler_code) DO NOTHING;
