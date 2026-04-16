-- ── MPCB Maharashtra — Official May 2024 Data (Pages 1-5 of 22) ──────────────
-- Source: MPCB Official PDF — Authorized E-Waste Recyclers / Refurbishers /
--         Dismantlers in Maharashtra (May 2024)
-- All entries have verified email + phone + capacity
-- Date: 2026-04-17
-- ────────────────────────────────────────────────────────────────────────────

-- Updates to existing CPCB entries with MPCB verified data
UPDATE ewaste_recyclers SET email = 'info@arihantinfo.com', phone = '9820350406' WHERE recycler_code = 'CPCB-MH-001';
UPDATE ewaste_recyclers SET email = 'facility2@ecoreco.com', phone = '9920084847' WHERE recycler_code = 'CPCB-MH-002';
UPDATE ewaste_recyclers SET email = 'info@e-incarnation.com', phone = '2266251300' WHERE recycler_code = 'CPCB-MH-003';
UPDATE ewaste_recyclers SET email = 'rajesh@recyclekaro.com', phone = '9967310007' WHERE recycler_code = 'CPCB-MH-004';
UPDATE ewaste_recyclers SET email = 'manish@hitechrecycling.in', phone = '9860602601' WHERE recycler_code = 'CPCB-MH-005';
UPDATE ewaste_recyclers SET email = 'hemant@justdispose.com', phone = '9833030124' WHERE recycler_code = 'CPCB-MH-006';
UPDATE ewaste_recyclers SET email = 'bhushan@techeco.co.in', phone = '9769117070' WHERE recycler_code = 'CPCB-MH-008';
UPDATE ewaste_recyclers SET email = 'karan@threco.com', phone = '9820622802' WHERE recycler_code = 'CPCB-MH-009';
UPDATE ewaste_recyclers SET email = 'payalc25@gmail.com', phone = '7718824575' WHERE recycler_code = 'CPCB-MH-010';
UPDATE ewaste_recyclers SET email = 'ecoreset41@gmail.com', phone = '7021819071' WHERE recycler_code = 'CPCB-MH-011';
UPDATE ewaste_recyclers SET email = 'rth_raj@hotmail.com', phone = '9822356062' WHERE recycler_code = 'CPCB-MH-056';
UPDATE ewaste_recyclers SET email = 'info@gier.co.in', phone = '8080414447' WHERE recycler_code = 'CPCB-MH-055';
UPDATE ewaste_recyclers SET email = 'info@suritex.co.in', phone = '9049981347' WHERE recycler_code = 'CPCB-MH-132';
UPDATE ewaste_recyclers SET email = 'alam@gvewaste.com', phone = '9821021395' WHERE recycler_code = 'CPCB-MH-060';
UPDATE ewaste_recyclers SET email = 'inspection@ecoreco.com', phone = '9867729662' WHERE recycler_code = 'CPCB-MH-002';

-- New MPCB entries (not in CPCB seed)
INSERT INTO ewaste_recyclers (recycler_code, company_name, contact_person, email, phone, address, city, state, waste_type, facility_type, capacity_per_month, is_active, is_verified, verified_at) VALUES
('MPCB-MH-011', 'S V Greentech Private Limited', 'Registered Facility', 'rihanmalik986@gmail.com', '9371106436', 'Gut No. 517/1 & 529, Village Kelthan, Tal. Wada, Dist. Palghar', 'Palghar', 'Maharashtra', 'e-waste', 'recycler', '8500 MTA', true, true, now()),
('MPCB-MH-012', 'Global E-Recycling Pvt Ltd', 'Registered Facility', 'rahimkhan9833542199@gmail.com', '7208644016', '2,3,4 Sr No 11 H No 1/1, Wakanpada Dhaniv, Palghar', 'Palghar', 'Maharashtra', 'e-waste', 'recycler', '400 MTA', true, true, now()),
('MPCB-MH-020', 'Tarai Projects Pvt. Ltd.', 'Registered Facility', 'taraiprojects2018@gmail.com', '7020687230', 'Near Shivsagar Hotel, Manchar, Tal. Machar, Dist. Pune', 'Pune', 'Maharashtra', 'e-waste', 'recycler', '560 MTA', true, true, now()),
('MPCB-MH-021', 'Jeenali Trading & Comm. Serv. Pvt. Ltd.', 'Registered Facility', 'millennium005@gmail.com', '9967970333', 'Gut No. 68/1, Village Khupri, Tal. Wada, Dist. Palghar', 'Palghar', 'Maharashtra', 'e-waste', 'recycler', '20000 MTA', true, true, now()),
('MPCB-MH-022', 'Unique Recycling', 'Registered Facility', 'mumatajhmd@gmail.com', '9689400817', 'Gut No. 287, At Post Nanekarwadi, Tal. Khed, Dist. Pune', 'Pune', 'Maharashtra', 'e-waste', 'recycler', '180 MTA', true, true, now()),
('MPCB-MH-023', 'New India Recyclers', 'Registered Facility', 'info.newindiarecycle@gmail.com', '8928934040', 'Plot No. 5 & 6, Village Ambethan, Tal. Khed, Dist. Pune', 'Pune', 'Maharashtra', 'e-waste', 'recycler', '150 MTA', true, true, now()),
('MPCB-MH-024', 'Electrofine Recycling (OPC) Pvt Ltd', 'Registered Facility', 'electrofinerecycling@gmail.com', '7397056189', 'Village Shindi Khurd, Tal. Maan, Dist. Satara', 'Satara', 'Maharashtra', 'e-waste', 'recycler', '5000 MTA', true, true, now()),
('MPCB-MH-025', 'Binbay Recycling Pvt. Ltd.', 'Registered Facility', 'binbayrecycling@gmail.com', '9819633997', 'Village Gauripada, Vasai (E), Dist. Palghar', 'Palghar', 'Maharashtra', 'e-waste', 'recycler', '3770 MTA', true, true, now()),
('MPCB-MH-026', 'Greenbay Enterprises', 'Registered Facility', 'egreenbay17@gmail.com', '9623300378', 'Ganesh Nagar, Phursungi, Pune', 'Pune', 'Maharashtra', 'e-waste', 'recycler', '183 MTA', true, true, now()),
('MPCB-MH-027', 'Green Life E Waste Recycling Pvt Ltd', 'Registered Facility', 'greenlifeewaste@gmail.com', '8097800830', 'Plot No. 11, Gat No. 40, Karodi, Aurangabad', 'Aurangabad', 'Maharashtra', 'e-waste', 'recycler', '660 MTA', true, true, now()),
('MPCB-MH-028', 'Bhangarwala Waste Management Pvt Ltd', 'Registered Facility', 'bwmgroup23@gmail.com', '8655113333', 'New S. No. 80/2, Dahisar Mori, Tal. & Dist. Thane', 'Thane', 'Maharashtra', 'e-waste', 'recycler', '6485 MTA', true, true, now()),
('MPCB-MH-029', 'Comnet E-Waste LLP', 'Registered Facility', 'pravinhajare@gmail.com', '9665520010', 'At Post Kaudgaon, Tal. & Dist. Ahmednagar', 'Ahmednagar', 'Maharashtra', 'e-waste', 'recycler', '1000 MTA', true, true, now()),
('MPCB-MH-030', 'Ecolayer E-Waste Recycling', 'Registered Facility', 'starcomputar22@gmail.com', '9820750836', 'Village Poman, Tal. Vasai, Dist. Palghar', 'Palghar', 'Maharashtra', 'e-waste', 'recycler', '2000 MTA', true, true, now()),
('MPCB-MH-031', 'Bhagyalakshmi Laboratories Limited', 'Registered Facility', 'bhagyalakshmi_laboratories@yahoo.com', '9820700517', 'Veour Village, Palghar', 'Palghar', 'Maharashtra', 'e-waste', 'recycler', '21000 MTA', true, true, now()),
('MPCB-MH-033', 'GNR Recycling India Pvt Ltd', 'Registered Facility', 'lokesh.k@gnrindia.com', '9822334823', 'Dagade Wasti, Pisoli, Pune', 'Pune', 'Maharashtra', 'e-waste', 'recycler', '300 MTA', true, true, now()),
('MPCB-MH-034', 'E-Survival Recycling Private Limited', 'Registered Facility', 'esurvival2022@gmail.com', '9820802032', 'Village Chincholikati, Tal. Mohol, Dist. Solapur', 'Solapur', 'Maharashtra', 'e-waste', 'recycler', '33000 MTA', true, true, now()),
('MPCB-MH-035', 'Green Enviro Management Solutions LLP', 'Registered Facility', 'mail.gps@gmail.com', '9766110860', 'Village Kanhe, Tal. Mawal, Dist. Pune', 'Pune', 'Maharashtra', 'e-waste', 'recycler', '594 MTA', true, true, now()),
('MPCB-MH-036', 'Trans Thane Creek Waste Management', 'Registered Facility', 'ttcwmam@gmail.com', '9082565312', 'P-128, Shil-Mahape Road, Mahape, Navi Mumbai', 'Navi Mumbai', 'Maharashtra', 'e-waste', 'recycler', '300 MTA', true, true, now()),
('MPCB-MH-037', 'Mercury Metal Industries (Unit III)', 'Registered Facility', 'mmimahadd35@gmail.com', '9892802451', 'Plot No. D-35, Mahad Industrial Area, Dist. Raigad', 'Raigad', 'Maharashtra', 'e-waste', 'recycler', '200 MTA', true, true, now()),
('MPCB-MH-038', 'Aman E-Waste Recyclers Pvt Ltd', 'Registered Facility', 'INFO@AMANRECYCLERS.COM', '9833721472', 'S. No. 20/5, Aamgaon, Tal. Talasari, Dist. Palghar', 'Palghar', 'Maharashtra', 'e-waste', 'recycler', '10500 MTA', true, true, now()),
('MPCB-MH-040', 'Pune Green Electronic Waste Recycler', 'Registered Facility', 'punegreensewaste@gmail.com', '9922071877', 'S. No. 29/9, Pansare Nagar, Yewlewadi, Pune', 'Pune', 'Maharashtra', 'e-waste', 'recycler', '500 MTA', true, true, now()),
('MPCB-MH-041', 'E-Frontline Recycling Pvt. Ltd. (Solapur)', 'Registered Facility', 'efrplserver@gmail.com', '8980300024', 'At Post Doddi, Tal. South Solapur, Dist. Solapur', 'Solapur', 'Maharashtra', 'e-waste', 'recycler', '40000 MTA', true, true, now())
ON CONFLICT (recycler_code) DO NOTHING;
