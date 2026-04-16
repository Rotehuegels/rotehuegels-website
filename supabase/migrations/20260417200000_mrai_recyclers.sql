-- ── Seed MRAI (Material Recycling Association of India) Members ──────────────
-- Source: MRAI Membership Directory 2019-20 (public PDF)
-- These are metal/material recyclers — distinct from CPCB e-waste recyclers
-- Many handle materials recovered from e-waste: Cu, Al, PCBs, precious metals
-- Date: 2026-04-17
-- ────────────────────────────────────────────────────────────────────────────

-- Only seeding INDIAN members (IM* codes), skipping foreign members (FM*)
-- Skipping companies already in our database under CPCB or BWM codes

INSERT INTO ewaste_recyclers (recycler_code, company_name, contact_person, email, city, state, waste_type, facility_type, is_active, is_verified, verified_at) VALUES

-- ═══ MAHARASHTRA (MH) ═══════════════════════════════════════════════════════
('MRAI-MH-001', 'A. R. International', 'Registered Facility', 'mrai.mh001@placeholder.in', 'Mumbai', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),
('MRAI-MH-002', 'Abbeline Impex Pvt. Ltd.', 'Registered Facility', 'mrai.mh002@placeholder.in', 'Mumbai', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),
('MRAI-MH-003', 'Abhinandan Metal Industries', 'Registered Facility', 'mrai.mh003@placeholder.in', 'Mumbai', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),
('MRAI-MH-004', 'Abhishek Alloys', 'Registered Facility', 'mrai.mh004@placeholder.in', 'Mumbai', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),
('MRAI-MH-005', 'ACE Metalscrap Recycling LLC', 'Registered Facility', 'mrai.mh005@placeholder.in', 'Mumbai', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),
('MRAI-MH-006', 'Agile Process Chemicals LLP', 'Registered Facility', 'mrai.mh006@placeholder.in', 'Mumbai', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),
('MRAI-MH-007', 'Agrasha Alloys & Metals Pvt. Ltd.', 'Registered Facility', 'mrai.mh007@placeholder.in', 'Mumbai', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),
('MRAI-MH-008', 'Ahmednagar Alloys Pvt. Ltd.', 'Registered Facility', 'mrai.mh008@placeholder.in', 'Ahmednagar', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),
('MRAI-MH-009', 'Aishwarya MECHFO (India) Pvt. Ltd.', 'Registered Facility', 'mrai.mh009@placeholder.in', 'Mumbai', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),
('MRAI-MH-010', 'Ajay Logistics Private Limited', 'Registered Facility', 'mrai.mh010@placeholder.in', 'Mumbai', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),
('MRAI-MH-011', 'ALA International (India) Pvt. Ltd.', 'Registered Facility', 'mrai.mh011@placeholder.in', 'Mumbai', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),
('MRAI-MH-012', 'Alex Stewart International (India) Pvt. Ltd.', 'Registered Facility', 'mrai.mh012@placeholder.in', 'Mumbai', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),
('MRAI-MH-013', 'Alok Ingots (Mumbai) Pvt. Ltd.', 'Registered Facility', 'mrai.mh013@placeholder.in', 'Mumbai', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),
('MRAI-MH-014', 'Aman Metalloy Pvt. Ltd.', 'Registered Facility', 'mrai.mh014@placeholder.in', 'Mumbai', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),
('MRAI-MH-015', 'AMC Chemicals Pvt. Ltd.', 'Registered Facility', 'mrai.mh015@placeholder.in', 'Mumbai', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),
('MRAI-MH-016', 'Amrit Polychem Pvt. Ltd.', 'Registered Facility', 'mrai.mh016@placeholder.in', 'Mumbai', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),
('MRAI-MH-017', 'Anand Enterprises', 'Registered Facility', 'mrai.mh017@placeholder.in', 'Mumbai', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),
('MRAI-MH-018', 'Arham Metals', 'Registered Facility', 'mrai.mh018@placeholder.in', 'Mumbai', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),
('MRAI-MH-019', 'Atharv Udyog', 'Registered Facility', 'mrai.mh019@placeholder.in', 'Mumbai', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),
('MRAI-MH-020', 'Axayya Alloys Pvt. Ltd.', 'Registered Facility', 'mrai.mh020@placeholder.in', 'Mumbai', 'Maharashtra', 'hazardous', 'recycler', true, false, NULL),

-- ═══ GUJARAT (GJ) ═══════════════════════════════════════════════════════════
('MRAI-GJ-001', 'Aadarsh Filament Industries', 'Registered Facility', 'mrai.gj001@placeholder.in', 'Gujarat', 'Gujarat', 'hazardous', 'recycler', true, false, NULL),
('MRAI-GJ-002', 'Aadi Imports Pvt. Ltd.', 'Registered Facility', 'mrai.gj002@placeholder.in', 'Gujarat', 'Gujarat', 'hazardous', 'recycler', true, false, NULL),
('MRAI-GJ-003', 'Accurate International', 'Registered Facility', 'mrai.gj003@placeholder.in', 'Gujarat', 'Gujarat', 'hazardous', 'recycler', true, false, NULL),
('MRAI-GJ-004', 'Akjay Marketing Pvt. Ltd.', 'Registered Facility', 'mrai.gj004@placeholder.in', 'Gujarat', 'Gujarat', 'hazardous', 'recycler', true, false, NULL),
('MRAI-GJ-005', 'Akshat Papers Limited', 'Registered Facility', 'mrai.gj005@placeholder.in', 'Gujarat', 'Gujarat', 'hazardous', 'recycler', true, false, NULL),
('MRAI-GJ-006', 'Alshafa International', 'Registered Facility', 'mrai.gj006@placeholder.in', 'Gujarat', 'Gujarat', 'hazardous', 'recycler', true, false, NULL),
('MRAI-GJ-007', 'B. R. Metal & Alloys (Guj) Pvt. Ltd.', 'Registered Facility', 'mrai.gj007@placeholder.in', 'Gujarat', 'Gujarat', 'hazardous', 'recycler', true, false, NULL),
('MRAI-GJ-008', 'Baheti Metal And Ferro Alloys Limited', 'Registered Facility', 'mrai.gj008@placeholder.in', 'Gujarat', 'Gujarat', 'hazardous', 'recycler', true, false, NULL),
('MRAI-GJ-009', 'Baldi Metals & Alloys', 'Registered Facility', 'mrai.gj009@placeholder.in', 'Gujarat', 'Gujarat', 'hazardous', 'recycler', true, false, NULL),
('MRAI-GJ-010', 'BEIL Infrastructure Limited', 'Registered Facility', 'mrai.gj010@placeholder.in', 'Gujarat', 'Gujarat', 'hazardous', 'recycler', true, false, NULL),

-- ═══ DELHI (DL) ═════════════════════════════════════════════════════════════
('MRAI-DL-001', 'A. G. Metalloys', 'Registered Facility', 'mrai.dl001@placeholder.in', 'Delhi', 'Delhi', 'hazardous', 'recycler', true, false, NULL),
('MRAI-DL-002', 'A. R. Alloys Pvt. Ltd.', 'Registered Facility', 'mrai.dl002@placeholder.in', 'Delhi', 'Delhi', 'hazardous', 'recycler', true, false, NULL),
('MRAI-DL-003', 'Aadya Overseas Limited', 'Registered Facility', 'mrai.dl003@placeholder.in', 'Delhi', 'Delhi', 'hazardous', 'recycler', true, false, NULL),
('MRAI-DL-004', 'ACE International', 'Registered Facility', 'mrai.dl004@placeholder.in', 'Delhi', 'Delhi', 'hazardous', 'recycler', true, false, NULL),
('MRAI-DL-005', 'Adhunik Niryat Ispat Ltd.', 'Registered Facility', 'mrai.dl005@placeholder.in', 'Delhi', 'Delhi', 'hazardous', 'recycler', true, false, NULL),
('MRAI-DL-006', 'Advance Hydrau-Tech Pvt. Ltd.', 'Registered Facility', 'mrai.dl006@placeholder.in', 'Delhi', 'Delhi', 'hazardous', 'recycler', true, false, NULL),
('MRAI-DL-007', 'AKG Exim Limited', 'Registered Facility', 'mrai.dl007@placeholder.in', 'Delhi', 'Delhi', 'hazardous', 'recycler', true, false, NULL),
('MRAI-DL-008', 'Amba Metals', 'Registered Facility', 'mrai.dl008@placeholder.in', 'Delhi', 'Delhi', 'hazardous', 'recycler', true, false, NULL),
('MRAI-DL-009', 'Ambashakti Udyog Limited', 'Registered Facility', 'mrai.dl009@placeholder.in', 'Delhi', 'Delhi', 'hazardous', 'recycler', true, false, NULL),
('MRAI-DL-010', 'Amita Enterprises', 'Registered Facility', 'mrai.dl010@placeholder.in', 'Delhi', 'Delhi', 'hazardous', 'recycler', true, false, NULL),

-- ═══ HARYANA (HR) ═══════════════════════════════════════════════════════════
('MRAI-HR-001', 'Akshay Aluminium Alloys LLP', 'Registered Facility', 'mrai.hr001@placeholder.in', 'Haryana', 'Haryana', 'hazardous', 'recycler', true, false, NULL),
('MRAI-HR-002', 'Ankur Enterprises', 'Registered Facility', 'mrai.hr002@placeholder.in', 'Haryana', 'Haryana', 'hazardous', 'recycler', true, false, NULL),
('MRAI-HR-003', 'Arham Alloy & Steel Pvt. Ltd.', 'Registered Facility', 'mrai.hr003@placeholder.in', 'Haryana', 'Haryana', 'hazardous', 'recycler', true, false, NULL),
('MRAI-HR-004', 'Aspen Online Pvt. Ltd.', 'Registered Facility', 'mrai.hr004@placeholder.in', 'Haryana', 'Haryana', 'hazardous', 'recycler', true, false, NULL),
('MRAI-HR-005', 'Aumex Global Energy LLP', 'Registered Facility', 'mrai.hr005@placeholder.in', 'Haryana', 'Haryana', 'hazardous', 'recycler', true, false, NULL),
('MRAI-HR-006', 'Buoyancy Traders Pvt. Ltd.', 'Registered Facility', 'mrai.hr006@placeholder.in', 'Haryana', 'Haryana', 'hazardous', 'recycler', true, false, NULL),
('MRAI-HR-007', 'Capital Sales', 'Registered Facility', 'mrai.hr007@placeholder.in', 'Haryana', 'Haryana', 'hazardous', 'recycler', true, false, NULL),
('MRAI-HR-008', 'Century Aluminium Mfg. Co. Ltd.', 'Registered Facility', 'mrai.hr008@placeholder.in', 'Haryana', 'Haryana', 'hazardous', 'recycler', true, false, NULL),
('MRAI-HR-009', 'Century Metal Recycling Ltd.', 'Registered Facility', 'mrai.hr009@placeholder.in', 'Haryana', 'Haryana', 'hazardous', 'recycler', true, false, NULL),
('MRAI-HR-010', 'Chuan Tian Hardware Import and Export Pvt. Ltd.', 'Registered Facility', 'mrai.hr010@placeholder.in', 'Haryana', 'Haryana', 'hazardous', 'recycler', true, false, NULL),

-- ═══ KARNATAKA (KA) ═════════════════════════════════════════════════════════
('MRAI-KA-001', 'Aniwini Technologies', 'Registered Facility', 'mrai.ka001@placeholder.in', 'Karnataka', 'Karnataka', 'hazardous', 'recycler', true, false, NULL),
('MRAI-KA-002', 'A-One Steels And Alloys Pvt. Ltd.', 'Registered Facility', 'mrai.ka002@placeholder.in', 'Karnataka', 'Karnataka', 'hazardous', 'recycler', true, false, NULL),
('MRAI-KA-003', 'A-One Steels India Pvt. Ltd.', 'Registered Facility', 'mrai.ka003@placeholder.in', 'Karnataka', 'Karnataka', 'hazardous', 'recycler', true, false, NULL),
('MRAI-KA-004', 'Assure Chartered Engineers', 'Registered Facility', 'mrai.ka004@placeholder.in', 'Karnataka', 'Karnataka', 'hazardous', 'recycler', true, false, NULL),
('MRAI-KA-005', 'Aurum Metal Connections Pvt. Ltd.', 'Registered Facility', 'mrai.ka005@placeholder.in', 'Karnataka', 'Karnataka', 'hazardous', 'recycler', true, false, NULL),
('MRAI-KA-006', 'Skanda Engineers and Consultants', 'Registered Facility', 'mrai.ka006@placeholder.in', 'Karnataka', 'Karnataka', 'hazardous', 'recycler', true, false, NULL),

-- ═══ TAMIL NADU (TN) ════════════════════════════════════════════════════════
('MRAI-TN-001', 'APGM Engineering Services Private Limited', 'Registered Facility', 'mrai.tn001@placeholder.in', 'Tamil Nadu', 'Tamil Nadu', 'hazardous', 'recycler', true, false, NULL),
('MRAI-TN-002', 'ARS Steels & Alloy International Pvt. Ltd.', 'Registered Facility', 'mrai.tn002@placeholder.in', 'Tamil Nadu', 'Tamil Nadu', 'hazardous', 'recycler', true, false, NULL),
('MRAI-TN-003', 'Arun Vyapar Udyog Pvt. Ltd.', 'Registered Facility', 'mrai.tn003@placeholder.in', 'Tamil Nadu', 'Tamil Nadu', 'hazardous', 'recycler', true, false, NULL),
('MRAI-TN-004', 'Danieli India Limited', 'Registered Facility', 'mrai.tn004@placeholder.in', 'Tamil Nadu', 'Tamil Nadu', 'hazardous', 'recycler', true, false, NULL),
('MRAI-TN-005', 'Goyal Metal Traders', 'Registered Facility', 'mrai.tn005@placeholder.in', 'Tamil Nadu', 'Tamil Nadu', 'hazardous', 'recycler', true, false, NULL),
('MRAI-TN-006', 'Himalaya Trading', 'Registered Facility', 'mrai.tn006@placeholder.in', 'Tamil Nadu', 'Tamil Nadu', 'hazardous', 'recycler', true, false, NULL),
('MRAI-TN-007', 'HydroMet (India) Ltd.', 'Registered Facility', 'mrai.tn007@placeholder.in', 'Tamil Nadu', 'Tamil Nadu', 'hazardous', 'recycler', true, false, NULL),
('MRAI-TN-008', 'Jayachandran Alloys Pvt. Ltd.', 'Registered Facility', 'mrai.tn008@placeholder.in', 'Tamil Nadu', 'Tamil Nadu', 'hazardous', 'recycler', true, false, NULL),
('MRAI-TN-009', 'Kamachi Industries Limited', 'Registered Facility', 'mrai.tn009@placeholder.in', 'Tamil Nadu', 'Tamil Nadu', 'hazardous', 'recycler', true, false, NULL),
('MRAI-TN-010', 'Kanishk Steel Industries Ltd.', 'Registered Facility', 'mrai.tn010@placeholder.in', 'Tamil Nadu', 'Tamil Nadu', 'hazardous', 'recycler', true, false, NULL),
('MRAI-TN-011', 'Kannappan Saai Recyclers Pvt. Ltd.', 'Registered Facility', 'mrai.tn011@placeholder.in', 'Tamil Nadu', 'Tamil Nadu', 'hazardous', 'recycler', true, false, NULL),
('MRAI-TN-012', 'KSJ Metal Impex (P) Ltd.', 'Registered Facility', 'mrai.tn012@placeholder.in', 'Tamil Nadu', 'Tamil Nadu', 'hazardous', 'recycler', true, false, NULL),
('MRAI-TN-013', 'Kusum Metals Pvt. Ltd.', 'Registered Facility', 'mrai.tn013@placeholder.in', 'Tamil Nadu', 'Tamil Nadu', 'hazardous', 'recycler', true, false, NULL),
('MRAI-TN-014', 'Mats India Pvt. Ltd.', 'Registered Facility', 'mrai.tn014@placeholder.in', 'Tamil Nadu', 'Tamil Nadu', 'hazardous', 'recycler', true, false, NULL),
('MRAI-TN-015', 'Sakthi Ferro Alloys India Pvt. Ltd.', 'Registered Facility', 'mrai.tn015@placeholder.in', 'Tamil Nadu', 'Tamil Nadu', 'hazardous', 'recycler', true, false, NULL),

-- ═══ WEST BENGAL (WB) ═══════════════════════════════════════════════════════
('MRAI-WB-001', 'Adi Metals', 'Registered Facility', 'mrai.wb001@placeholder.in', 'Kolkata', 'West Bengal', 'hazardous', 'recycler', true, false, NULL),
('MRAI-WB-002', 'Alpro Extrusion Pvt. Ltd.', 'Registered Facility', 'mrai.wb002@placeholder.in', 'Kolkata', 'West Bengal', 'hazardous', 'recycler', true, false, NULL),
('MRAI-WB-003', 'APL Metals Limited', 'Registered Facility', 'mrai.wb003@placeholder.in', 'Kolkata', 'West Bengal', 'hazardous', 'recycler', true, false, NULL),
('MRAI-WB-004', 'Aphrodite Sales Corporation', 'Registered Facility', 'mrai.wb004@placeholder.in', 'Kolkata', 'West Bengal', 'hazardous', 'recycler', true, false, NULL),
('MRAI-WB-005', 'Ambica Dhatu Pvt. Ltd.', 'Registered Facility', 'mrai.wb005@placeholder.in', 'Kolkata', 'West Bengal', 'hazardous', 'recycler', true, false, NULL),

-- ═══ RAJASTHAN (RJ) ═════════════════════════════════════════════════════════
('MRAI-RJ-001', 'Adinath Extrusion Pvt. Ltd.', 'Registered Facility', 'mrai.rj001@placeholder.in', 'Rajasthan', 'Rajasthan', 'hazardous', 'recycler', true, false, NULL),
('MRAI-RJ-002', 'Arpit Metal Industries', 'Registered Facility', 'mrai.rj002@placeholder.in', 'Rajasthan', 'Rajasthan', 'hazardous', 'recycler', true, false, NULL),
('MRAI-RJ-003', 'Bright Metals (I) Pvt. Ltd.', 'Registered Facility', 'mrai.rj003@placeholder.in', 'Rajasthan', 'Rajasthan', 'hazardous', 'recycler', true, false, NULL),
('MRAI-RJ-004', 'G. L. Metallica Private Limited', 'Registered Facility', 'mrai.rj004@placeholder.in', 'Rajasthan', 'Rajasthan', 'hazardous', 'recycler', true, false, NULL),
('MRAI-RJ-005', 'Gravita India Limited', 'Registered Facility', 'mrai.rj005@placeholder.in', 'Jaipur', 'Rajasthan', 'hazardous', 'recycler', true, false, NULL),
('MRAI-RJ-006', 'Indus Raw Metals Pvt. Ltd.', 'Registered Facility', 'mrai.rj006@placeholder.in', 'Rajasthan', 'Rajasthan', 'hazardous', 'recycler', true, false, NULL),
('MRAI-RJ-007', 'JLC Electromet Pvt. Ltd.', 'Registered Facility', 'mrai.rj007@placeholder.in', 'Rajasthan', 'Rajasthan', 'hazardous', 'recycler', true, false, NULL),
('MRAI-RJ-008', 'JSB Aluminium Pvt. Ltd.', 'Registered Facility', 'mrai.rj008@placeholder.in', 'Rajasthan', 'Rajasthan', 'hazardous', 'recycler', true, false, NULL),
('MRAI-RJ-009', 'K. G. Metalloys', 'Registered Facility', 'mrai.rj009@placeholder.in', 'Rajasthan', 'Rajasthan', 'hazardous', 'recycler', true, false, NULL),
('MRAI-RJ-010', 'Matod Industries Pvt. Ltd.', 'Registered Facility', 'mrai.rj010@placeholder.in', 'Rajasthan', 'Rajasthan', 'hazardous', 'recycler', true, false, NULL),

-- ═══ PUNJAB (PB) ════════════════════════════════════════════════════════════
('MRAI-PB-001', 'A. R. Metal Company', 'Registered Facility', 'mrai.pb001@placeholder.in', 'Punjab', 'Punjab', 'hazardous', 'recycler', true, false, NULL),
('MRAI-PB-002', 'Arora Iron & Steel Rolling Mills Pvt. Ltd.', 'Registered Facility', 'mrai.pb002@placeholder.in', 'Punjab', 'Punjab', 'hazardous', 'recycler', true, false, NULL),
('MRAI-PB-003', 'Bansal Alloys & Metals Pvt. Ltd.', 'Registered Facility', 'mrai.pb003@placeholder.in', 'Punjab', 'Punjab', 'hazardous', 'recycler', true, false, NULL),
('MRAI-PB-004', 'Behari Lal Ispat Pvt. Ltd.', 'Registered Facility', 'mrai.pb004@placeholder.in', 'Punjab', 'Punjab', 'hazardous', 'recycler', true, false, NULL),
('MRAI-PB-005', 'Bhagwati Trading Co.', 'Registered Facility', 'mrai.pb005@placeholder.in', 'Punjab', 'Punjab', 'hazardous', 'recycler', true, false, NULL),
('MRAI-PB-006', 'Bimal Exports', 'Registered Facility', 'mrai.pb006@placeholder.in', 'Punjab', 'Punjab', 'hazardous', 'recycler', true, false, NULL),
('MRAI-PB-007', 'BLAL Steel Shredding Pvt. Ltd.', 'Registered Facility', 'mrai.pb007@placeholder.in', 'Punjab', 'Punjab', 'hazardous', 'recycler', true, false, NULL),

-- ═══ UTTAR PRADESH (UP) ═════════════════════════════════════════════════════
('MRAI-UP-001', 'Bindlas Duplux Limited', 'Registered Facility', 'mrai.up001@placeholder.in', 'UP', 'Uttar Pradesh', 'hazardous', 'recycler', true, false, NULL),
('MRAI-UP-002', 'Buddha Industries', 'Registered Facility', 'mrai.up002@placeholder.in', 'UP', 'Uttar Pradesh', 'hazardous', 'recycler', true, false, NULL),
('MRAI-UP-003', 'CMU Metals Private Limited', 'Registered Facility', 'mrai.up003@placeholder.in', 'UP', 'Uttar Pradesh', 'hazardous', 'recycler', true, false, NULL),
('MRAI-UP-004', 'Dev Priya Industries Pvt. Ltd.', 'Registered Facility', 'mrai.up004@placeholder.in', 'UP', 'Uttar Pradesh', 'hazardous', 'recycler', true, false, NULL),
('MRAI-UP-005', 'Eagle Trans Shipping And Logistics India Pvt. Ltd.', 'Registered Facility', 'mrai.up005@placeholder.in', 'UP', 'Uttar Pradesh', 'hazardous', 'recycler', true, false, NULL),
('MRAI-UP-006', 'Elcon Alloys Pvt. Ltd.', 'Registered Facility', 'mrai.up006@placeholder.in', 'UP', 'Uttar Pradesh', 'hazardous', 'recycler', true, false, NULL),
('MRAI-UP-007', 'Eodis India Pvt. Ltd.', 'Registered Facility', 'mrai.up007@placeholder.in', 'UP', 'Uttar Pradesh', 'hazardous', 'recycler', true, false, NULL),
('MRAI-UP-008', 'Ganesha Ecosphere Ltd.', 'Registered Facility', 'mrai.up008@placeholder.in', 'UP', 'Uttar Pradesh', 'hazardous', 'recycler', true, false, NULL),
('MRAI-UP-009', 'Mahavir Transmission Limited', 'Registered Facility', 'mrai.up009@placeholder.in', 'UP', 'Uttar Pradesh', 'hazardous', 'recycler', true, false, NULL),
('MRAI-UP-010', 'Rakman Industries Limited', 'Registered Facility', 'mrai.up010@placeholder.in', 'UP', 'Uttar Pradesh', 'hazardous', 'recycler', true, false, NULL),
('MRAI-UP-011', 'SIMS Recycling Solutions India Pvt. Ltd.', 'Registered Facility', 'mrai.up011@placeholder.in', 'Greater Noida', 'Uttar Pradesh', 'hazardous', 'recycler', true, false, NULL),

-- ═══ TELANGANA (TS) ═════════════════════════════════════════════════════════
('MRAI-TS-001', 'Hyderabad Castings Limited', 'Registered Facility', 'mrai.ts001@placeholder.in', 'Hyderabad', 'Telangana', 'hazardous', 'recycler', true, false, NULL),
('MRAI-TS-002', 'Loha Trade Links', 'Registered Facility', 'mrai.ts002@placeholder.in', 'Hyderabad', 'Telangana', 'hazardous', 'recycler', true, false, NULL),
('MRAI-TS-003', 'NILE Limited', 'Registered Facility', 'mrai.ts003@placeholder.in', 'Hyderabad', 'Telangana', 'hazardous', 'recycler', true, false, NULL),
('MRAI-TS-004', 'Ramky Reclamation and Recycling Limited', 'Registered Facility', 'mrai.ts004@placeholder.in', 'Hyderabad', 'Telangana', 'hazardous', 'recycler', true, false, NULL),
('MRAI-TS-005', 'Riddhi Siddhi Metals', 'Registered Facility', 'mrai.ts005@placeholder.in', 'Hyderabad', 'Telangana', 'hazardous', 'recycler', true, false, NULL),

-- ═══ KERALA (KL) ════════════════════════════════════════════════════════════
('MRAI-KL-001', 'ALQ Exporters', 'Registered Facility', 'mrai.kl001@placeholder.in', 'Kerala', 'Kerala', 'hazardous', 'recycler', true, false, NULL),
('MRAI-KL-002', 'Core Care Trading', 'Registered Facility', 'mrai.kl002@placeholder.in', 'Kerala', 'Kerala', 'hazardous', 'recycler', true, false, NULL),
('MRAI-KL-003', 'Damodar Sons Agencies', 'Registered Facility', 'mrai.kl003@placeholder.in', 'Kerala', 'Kerala', 'hazardous', 'recycler', true, false, NULL),
('MRAI-KL-004', 'Gasha Steels Pvt. Ltd.', 'Registered Facility', 'mrai.kl004@placeholder.in', 'Kerala', 'Kerala', 'hazardous', 'recycler', true, false, NULL),
('MRAI-KL-005', 'Imelt Extrusions Pvt. Ltd.', 'Registered Facility', 'mrai.kl005@placeholder.in', 'Kerala', 'Kerala', 'hazardous', 'recycler', true, false, NULL)

ON CONFLICT (recycler_code) DO NOTHING;
