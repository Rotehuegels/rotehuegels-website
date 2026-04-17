-- Missing majors not captured by CPCB/SPCB/MRAI regulatory imports.
-- Mix of:
--   - Genuine recyclers (Cero, Tata Re.Wi.Re, Re Sustainability, GEM, Saahas, Epsilon)
--   - Tangential players included for completeness of the non-ferrous / metals
--     ecosystem (Binani, Electrotherm, Trimex, Manaksia) — marked in notes.
-- All figures public; unverified entries carry is_verified=false.

INSERT INTO recyclers (
  recycler_code, company_name, contact_person, email, phone,
  address, city, state, waste_type, facility_type,
  capacity_per_month, cin, website, notes,
  is_active, is_verified, verified_at
) VALUES

-- 1. Cero Recycling (Mahindra–MSTC JV) — India's largest authorised ELV dismantler
('MAJ-UP-001', 'Cero Recycling (Mahindra MSTC Recycling Pvt Ltd)', 'Registered Facility', 'info@cero.co.in', NULL,
 'Plot No. 38, Sector Ecotech-XII, Greater Noida', 'Greater Noida', 'Uttar Pradesh', 'hazardous', 'recycler',
 2000, 'U37200MH2016PTC284528', 'https://www.cero.co.in',
 'End-of-life vehicle (ELV) dismantling and scrap recovery. JV between Mahindra Accelo and MSTC (Govt of India). First authorised ELV recycler in India.',
 true, true, now()),
('MAJ-MH-001', 'Cero Recycling — Chennai Facility', 'Registered Facility', 'info@cero.co.in', NULL,
 'Manali Industrial Area', 'Chennai', 'Tamil Nadu', 'hazardous', 'recycler',
 1500, 'U37200MH2016PTC284528', 'https://www.cero.co.in',
 'ELV dismantling facility. Part of Mahindra–MSTC Cero Recycling network.',
 true, true, now()),

-- 2. Mahindra Accelo (parent steel/metals services co.)
('MAJ-MH-002', 'Mahindra Accelo Limited', 'Registered Facility', 'accelo@mahindra.com', NULL,
 'Mahindra Towers, Worli', 'Mumbai', 'Maharashtra', 'hazardous', 'producer',
 NULL, 'U27109MH1960PLC011830', 'https://www.mahindraaccelo.com',
 'Steel service centers + ELV recycling via Cero JV. Mahindra Group subsidiary. Primarily scrap aggregation + processing; parent of Cero Recycling.',
 true, true, now()),

-- 3. Tata Motors Re.Wi.Re (Recycling with Respect) — ELV at Chinchwad Pune
('MAJ-MH-003', 'Tata Motors — Re.Wi.Re Chinchwad', 'Registered Facility', NULL, NULL,
 'Chinchwad, Pune', 'Pune', 'Maharashtra', 'hazardous', 'recycler',
 3000, 'L28920MH1945PLC004520', 'https://www.tatamotors.com',
 'ELV scrapping facility launched 2023 with Ganatra Auto. Capacity ~36,000 ELVs/year. Re.Wi.Re = "Recycling with Respect".',
 true, true, now()),

-- 4. Re Sustainability Ltd (formerly Ramky Enviro Engineers) — hazardous waste major
('MAJ-TG-001', 'Re Sustainability Limited (Ramky Enviro Engineers)', 'Registered Facility', 'info@resustainability.com', NULL,
 'Ramky Grandiose, Gachibowli', 'Hyderabad', 'Telangana', 'hazardous', 'recycler',
 50000, 'U74900TG2006PTC050149', 'https://www.resustainability.com',
 'Largest integrated hazardous waste operator in India. 100+ facilities including TSDF, incineration, landfill, e-waste, plastic. Acquired by KKR 2022.',
 true, true, now()),

-- 5. GEM Enviro Management Ltd (NSE-SME listed) — plastic + e-waste EPR
('MAJ-DL-001', 'GEM Enviro Management Limited', 'Registered Facility', 'info@gemenviro.com', NULL,
 'B-34, Sector-59', 'Noida', 'Uttar Pradesh', 'e-waste', 'recycler',
 5000, 'L40300DL2013PLC253462', 'https://www.gemenviro.com',
 'Plastic + e-waste EPR authorised recycler. Listed on NSE Emerge. Services include material recovery and EPR compliance for PIBOs.',
 true, true, now()),

-- 6. Saahas Zero Waste — multi-stream incl. e-waste
('MAJ-KA-001', 'Saahas Zero Waste Private Limited', 'Registered Facility', 'customercare@saahaszerowaste.com', NULL,
 '35, Shivaji Nagar', 'Bengaluru', 'Karnataka', 'e-waste', 'recycler',
 500, 'U74990KA2013PTC070720', 'https://www.saahaszerowaste.com',
 'Multi-stream waste management: dry-waste, e-waste, sanitary, organics. Corporate + institutional zero-waste services. B-Corp certified.',
 true, true, now()),

-- 7. Epsilon Advanced Materials — battery anode + recycling pilot
('MAJ-KA-002', 'Epsilon Advanced Materials Private Limited', 'Registered Facility', 'info@epsilonam.com', NULL,
 'Jindal Nagar, Bellary', 'Bellary', 'Karnataka', 'battery', 'producer',
 10000, 'U24100KA2019PTC129148', 'https://www.epsilonam.com',
 'Synthetic graphite anode manufacturer for Li-ion batteries + battery materials recycling pilot. Upcoming facility at Vijayanagar, Karnataka.',
 true, false, NULL),

-- 8. Binani Industries Ltd — zinc/lead/tin (upstream, marginal)
('MAJ-WB-001', 'Binani Industries Limited', 'Registered Facility', NULL, NULL,
 '37-B, Mittal Tower, 210 Backbay Reclamation', 'Mumbai', 'Maharashtra', 'primary-metal', 'producer',
 NULL, 'L24117WB1962PLC025584', 'https://www.binaniindustries.com',
 'Holding company — zinc, lead, tin, and alloy products via Binani Metals. Primarily downstream / secondary use of primary metals, not a recycler in the strict sense.',
 true, false, NULL),

-- 9. Electrotherm India Ltd — steel + induction furnace + EV (marginal)
('MAJ-GJ-001', 'Electrotherm (India) Limited', 'Registered Facility', 'info@electrotherm.com', NULL,
 'A-1, Shanti Chambers, Near Rohan Complex, Odhav', 'Ahmedabad', 'Gujarat', 'hazardous', 'producer',
 25000, 'L29299GJ1985PLC007869', 'https://www.electrotherm.com',
 'Steel-making (DRI + induction) + engineering + EV division. Induction furnaces are core equipment for metal scrap reprocessing; listed as producer, not recycler.',
 true, false, NULL),

-- 10. Trimex Group — minerals (marginal)
('MAJ-TN-001', 'Trimex Sands Private Limited', 'Registered Facility', 'info@trimexgroup.com', NULL,
 'Trimex House, 74 Mahalingapuram Main Road, Nungambakkam', 'Chennai', 'Tamil Nadu', 'primary-metal', 'producer',
 NULL, 'U14100TN2001PTC046544', 'https://www.trimexgroup.com',
 'Heavy-mineral sands (zircon, rutile, ilmenite, garnet) producer. Upstream mineral miner, not a recycler — included for non-ferrous ecosystem completeness.',
 true, false, NULL),

-- 11. Manaksia Ltd — zinc/alum/packaging (marginal)
('MAJ-WB-002', 'Manaksia Limited', 'Registered Facility', 'manaksia@manaksia.com', NULL,
 '8/1, Lalbazar Street, Bikaner Building, 3rd Floor', 'Kolkata', 'West Bengal', 'primary-metal', 'producer',
 NULL, 'L67120WB1984PLC084012', 'https://www.manaksia.com',
 'Packaging + aluminium + steel + zinc products. Primarily downstream manufacturing rather than recycling.',
 true, false, NULL)

ON CONFLICT (recycler_code) DO NOTHING;

-- Seed GPS coordinates where known
UPDATE recyclers SET latitude = 28.5089, longitude = 77.4892 WHERE recycler_code = 'MAJ-UP-001';
UPDATE recyclers SET latitude = 13.1658, longitude = 80.2617 WHERE recycler_code = 'MAJ-MH-001';
UPDATE recyclers SET latitude = 19.0178, longitude = 72.8478 WHERE recycler_code = 'MAJ-MH-002';
UPDATE recyclers SET latitude = 18.6298, longitude = 73.7997 WHERE recycler_code = 'MAJ-MH-003';
UPDATE recyclers SET latitude = 17.4406, longitude = 78.3489 WHERE recycler_code = 'MAJ-TG-001';
UPDATE recyclers SET latitude = 28.6139, longitude = 77.2090 WHERE recycler_code = 'MAJ-DL-001';
UPDATE recyclers SET latitude = 12.9858, longitude = 77.6067 WHERE recycler_code = 'MAJ-KA-001';
UPDATE recyclers SET latitude = 15.1394, longitude = 76.9214 WHERE recycler_code = 'MAJ-KA-002';
UPDATE recyclers SET latitude = 18.9400, longitude = 72.8333 WHERE recycler_code = 'MAJ-WB-001';
UPDATE recyclers SET latitude = 23.0225, longitude = 72.5714 WHERE recycler_code = 'MAJ-GJ-001';
UPDATE recyclers SET latitude = 13.0637, longitude = 80.2367 WHERE recycler_code = 'MAJ-TN-001';
UPDATE recyclers SET latitude = 22.5726, longitude = 88.3639 WHERE recycler_code = 'MAJ-WB-002';
