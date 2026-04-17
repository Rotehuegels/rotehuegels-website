-- Primary Metal Producers (Smelters & Refineries)
-- These are NOT recyclers — they are the upstream virgin metal producers.
-- Listed in the same table as recyclers so the directory can show both
-- sides of the non-ferrous metal supply chain. Distinguished by
-- waste_type = 'primary-metal'.
--
-- Facility-level plants listed where practical (they are the capacity).
-- Headquarters-only entries marked with facility_type = 'producer'.

INSERT INTO ewaste_recyclers (
  recycler_code, company_name, contact_person, email, phone,
  address, city, state, waste_type, facility_type,
  capacity_per_month, website, notes,
  is_active, is_verified, verified_at
) VALUES

-- Hindustan Zinc Ltd (Vedanta Group) — India's only integrated Zn-Pb-Ag producer
('PMP-RJ-001', 'Hindustan Zinc Limited — Chanderiya Lead-Zinc Smelter', 'Registered Facility', NULL, NULL,
 'Chanderiya Lead Zinc Smelter, Putholi', 'Chittorgarh', 'Rajasthan', 'primary-metal', 'producer',
 53833, 'https://www.hzlindia.com',
 'Integrated Zn-Pb smelter. Capacity: ~646 KTPA zinc + ~210 KTPA lead equivalent. Largest of its kind in India.',
 true, true, now()),
('PMP-RJ-002', 'Hindustan Zinc Limited — Dariba Smelting Complex', 'Registered Facility', NULL, NULL,
 'Rajpura Dariba, Rajsamand', 'Rajsamand', 'Rajasthan', 'primary-metal', 'producer',
 18333, 'https://www.hzlindia.com',
 'Zinc-lead smelting complex at Dariba, Rajasthan. Capacity: ~220 KTPA zinc.',
 true, true, now()),
('PMP-RJ-003', 'Hindustan Zinc Limited — Debari Zinc Smelter', 'Registered Facility', NULL, NULL,
 'Zinc Smelter Debari', 'Udaipur', 'Rajasthan', 'primary-metal', 'producer',
 7500, 'https://www.hzlindia.com',
 'Hydrometallurgical zinc smelter. Capacity: ~90 KTPA zinc.',
 true, true, now()),
('PMP-UK-001', 'Hindustan Zinc Limited — Pantnagar Metal Plant', 'Registered Facility', NULL, NULL,
 'SIDCUL, Pantnagar, Udham Singh Nagar', 'Pantnagar', 'Uttarakhand', 'primary-metal', 'producer',
 2917, 'https://www.hzlindia.com',
 'Value-added zinc-alloy plant. Capacity: ~35 KTPA alloys/die-cast.',
 true, true, now()),

-- Hindalco Industries Ltd (Aditya Birla Group)
('PMP-UP-001', 'Hindalco Industries Limited — Renukoot Works', 'Registered Facility', NULL, NULL,
 'P.O. Renukoot, Sonbhadra', 'Renukoot', 'Uttar Pradesh', 'primary-metal', 'producer',
 29167, 'https://www.hindalco.com',
 'Fully integrated aluminium smelter + alumina refinery + power. Capacity: ~350 KTPA aluminium.',
 true, true, now()),
('PMP-OR-001', 'Hindalco Industries Limited — Aditya Aluminium', 'Registered Facility', NULL, NULL,
 'Lapanga, Sambalpur', 'Sambalpur', 'Odisha', 'primary-metal', 'producer',
 29167, 'https://www.hindalco.com',
 'Greenfield aluminium smelter + captive power. Capacity: ~359 KTPA aluminium.',
 true, true, now()),
('PMP-MP-001', 'Hindalco Industries Limited — Mahan Aluminium', 'Registered Facility', NULL, NULL,
 'Bargawan, Singrauli', 'Singrauli', 'Madhya Pradesh', 'primary-metal', 'producer',
 29167, 'https://www.hindalco.com',
 'Aluminium smelter with captive power. Capacity: ~359 KTPA aluminium.',
 true, true, now()),
('PMP-GJ-001', 'Hindalco Industries Limited — Birla Copper, Dahej', 'Registered Facility', NULL, NULL,
 'Lakhigam, Dahej, Bharuch', 'Dahej', 'Gujarat', 'primary-metal', 'producer',
 41667, 'https://www.hindalco.com',
 'Largest custom copper smelter/refinery in India. Capacity: ~500 KTPA copper cathodes.',
 true, true, now()),

-- NALCO (National Aluminium Company Ltd) — PSU
('PMP-OR-002', 'National Aluminium Company Limited (NALCO) — Smelter Plant, Angul', 'Registered Facility', 'cshq@nalcoindia.co.in', NULL,
 'Nalco Nagar, Angul', 'Angul', 'Odisha', 'primary-metal', 'producer',
 38333, 'https://nalcoindia.com',
 'Integrated aluminium smelter + captive power (1200 MW). Capacity: ~460 KTPA aluminium.',
 true, true, now()),
('PMP-OR-003', 'National Aluminium Company Limited (NALCO) — Alumina Refinery, Damanjodi', 'Registered Facility', 'cshq@nalcoindia.co.in', NULL,
 'Damanjodi, Koraput', 'Damanjodi', 'Odisha', 'primary-metal', 'producer',
 175000, 'https://nalcoindia.com',
 'Alumina refinery — feedstock for smelter. Capacity: ~2.1 MTPA alumina.',
 true, true, now()),

-- BALCO (Bharat Aluminium Company — Vedanta)
('PMP-CG-001', 'Bharat Aluminium Company Limited (BALCO)', 'Registered Facility', NULL, NULL,
 'BALCO Nagar, Korba', 'Korba', 'Chhattisgarh', 'primary-metal', 'producer',
 47500, 'https://www.balcoindia.com',
 'Aluminium smelter (Vedanta subsidiary). Capacity: ~570 KTPA aluminium + captive power.',
 true, true, now()),

-- Vedanta Aluminium
('PMP-OR-004', 'Vedanta Limited — Jharsuguda Aluminium Complex', 'Registered Facility', NULL, NULL,
 'Burkhamunda, Jharsuguda', 'Jharsuguda', 'Odisha', 'primary-metal', 'producer',
 150000, 'https://www.vedantalimited.com',
 'Largest aluminium smelter in India. Capacity: ~1.8 MTPA aluminium.',
 true, true, now()),
('PMP-OR-005', 'Vedanta Limited — Lanjigarh Alumina Refinery', 'Registered Facility', NULL, NULL,
 'Lanjigarh, Kalahandi', 'Lanjigarh', 'Odisha', 'primary-metal', 'producer',
 416667, 'https://www.vedantalimited.com',
 'Alumina refinery feeding Jharsuguda smelter. Capacity: ~5 MTPA alumina (expanding).',
 true, true, now()),

-- Hindustan Copper Ltd (PSU) — India's only vertically integrated copper producer
('PMP-JH-001', 'Hindustan Copper Limited — Indian Copper Complex, Ghatsila', 'Registered Facility', NULL, NULL,
 'Moubhandar, Ghatsila, East Singhbhum', 'Ghatsila', 'Jharkhand', 'primary-metal', 'producer',
 1500, 'https://www.hindustancopper.com',
 'Copper smelting + refining complex. Capacity: ~18 KTPA copper cathodes (limited by ore availability).',
 true, true, now()),
('PMP-RJ-004', 'Hindustan Copper Limited — Khetri Copper Complex', 'Registered Facility', NULL, NULL,
 'Khetri Nagar, Jhunjhunu', 'Khetri', 'Rajasthan', 'primary-metal', 'producer',
 1667, 'https://www.hindustancopper.com',
 'Integrated copper mine + smelter + refinery. Capacity: ~20 KTPA copper cathodes.',
 true, true, now()),
('PMP-MP-002', 'Hindustan Copper Limited — Malanjkhand Copper Project', 'Registered Facility', NULL, NULL,
 'Malanjkhand, Balaghat', 'Malanjkhand', 'Madhya Pradesh', 'primary-metal', 'producer',
 166667, 'https://www.hindustancopper.com',
 'Largest copper mine in India (open-pit + underground). Ore capacity: ~2 MTPA.',
 true, true, now()),

-- Adani Copper (upcoming — largest single-location custom copper smelter)
('PMP-GJ-002', 'Kutch Copper Limited (Adani Enterprises)', 'Registered Facility', NULL, NULL,
 'Mundra SEZ', 'Mundra', 'Gujarat', 'primary-metal', 'producer',
 41667, 'https://www.adanienterprises.com',
 'Greenfield custom copper smelter. Phase 1 capacity: ~500 KTPA; eventual ~1 MTPA (will be worlds largest single-location).',
 true, true, now()),

-- JSW Aluminium (upcoming greenfield)
('PMP-OR-006', 'JSW Aluminium Limited — Salboni (planned)', 'Registered Facility', NULL, NULL,
 'Salboni, Paschim Medinipur (under development)', 'Salboni', 'West Bengal', 'primary-metal', 'producer',
 25000, 'https://www.jsw.in',
 'Planned greenfield aluminium smelter. Announced capacity: ~300 KTPA aluminium.',
 true, false, NULL)

ON CONFLICT (recycler_code) DO NOTHING;
