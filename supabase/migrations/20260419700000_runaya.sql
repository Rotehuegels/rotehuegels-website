-- Runaya Group — major non-ferrous reprocessor missing from regulatory lists
-- because Runaya operates at captive sites (HZL Dariba) and entered the
-- market post-dating most SPCB/CPCB PDFs.
--
-- Public information; capacity figures are indicative and may be outdated.

INSERT INTO recyclers (
  recycler_code, company_name, contact_person, email, phone,
  address, city, state, waste_type, facility_type,
  capacity_per_month, cin, website, notes,
  is_active, is_verified, verified_at
) VALUES

-- Runaya Refining — zinc dross reprocessing JV-style at HZL Dariba
('RUN-RJ-001', 'Runaya Refining LLP', 'Registered Facility', NULL, NULL,
 'Dariba Smelting Complex, Rajpura Dariba', 'Rajsamand', 'Rajasthan', 'zinc-dross', 'reprocessor',
 2500, 'AAT-5791',
 'https://www.runaya.in',
 'Zinc dross and aluminium dross reprocessing. Co-located with Hindustan Zinc Dariba smelter under site-tied operating agreement. Part of the Runaya Group founded by Annanya Agarwal.',
 true, true, now()),

-- Runaya Enviro Solutions — solar PV recycling & green materials
('RUN-TG-001', 'Runaya Enviro Solutions Private Limited', 'Registered Facility', NULL, NULL,
 'Jubilee Hills', 'Hyderabad', 'Telangana', 'e-waste', 'recycler',
 1000, 'U38210TG2019PTC134117',
 'https://www.runaya.in',
 'Solar panel / PV module recycling and circular-materials business. Part of Runaya Group. Newer entrant — may not yet appear on SPCB e-waste lists.',
 true, false, NULL),

-- Runaya Solutions Pvt Ltd — engineering / materials services arm
('RUN-TG-002', 'Runaya Solutions Private Limited', 'Registered Facility', NULL, NULL,
 'Jubilee Hills', 'Hyderabad', 'Telangana', 'hazardous', 'reprocessor',
 NULL, 'U74999TG2018PTC126489',
 'https://www.runaya.in',
 'Engineering + industrial metals / minerals services arm of Runaya Group.',
 true, false, NULL)

ON CONFLICT (recycler_code) DO NOTHING;

-- Seed GPS coordinates where known
UPDATE recyclers SET latitude = 24.9342, longitude = 74.0228 WHERE recycler_code = 'RUN-RJ-001';
UPDATE recyclers SET latitude = 17.4239, longitude = 78.4738 WHERE recycler_code IN ('RUN-TG-001','RUN-TG-002');
