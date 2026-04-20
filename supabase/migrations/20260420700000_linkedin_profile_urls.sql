-- ============================================================
-- Enrich LinkedIn-mined recycler rows with profile URLs and the
-- full candidate set from .buddy/ecosystem-linkedin-matches.json.
--
-- CONTEXT: The original LKDN-001..024 insert captured contact names
-- and positions but NOT the LinkedIn profile URLs. The 24 LKDN-*
-- recycler codes have since been renamed to ecosystem-standard codes
-- (PMP-*/CPCB-*/NFMR-*), and two duplicates (LKDN-010 → PMP-OR-004,
-- LKDN-014 → PMP-GJ-001) were merged. This migration overlays the
-- complete LinkedIn contact set — including profile URL, and in a
-- few cases email captured by the matcher — onto the 22 remaining
-- rows, keyed by their NEW codes.
--
-- Shape per contact object:
--   { source, name, position, linkedin_url[, email] }
--
-- Safe to run multiple times (idempotent UPDATE).
-- ============================================================

-- LKDN-001 → PMP-TN-001  Suryadev Alloys and Power
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"Soumya Ranjan Mohanty","position":"Vice President (R&D)","linkedin_url":"https://www.linkedin.com/in/soumya-ranjan-mohanty-540244258"}
]'::jsonb WHERE recycler_code = 'PMP-TN-001';

-- LKDN-002 → PMP-TN-002  NEMAK Aluminium Castings India
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"Manigandan Murugan","position":"Tooling Engineer","linkedin_url":"https://www.linkedin.com/in/manigandan-murugan-95b799116"}
]'::jsonb WHERE recycler_code = 'PMP-TN-002';

-- LKDN-003 → PMP-KA-001  Jindal Aluminium
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"Vikas Kumar Agrawal","position":"Deputy General Manager","linkedin_url":"https://www.linkedin.com/in/vikas-kumar-a-9a44396"},
  {"source":"linkedin","name":"RAMESWAR NAYAK","position":"Quality Assurance Engineer","linkedin_url":"https://www.linkedin.com/in/rameswar-nayak-015700123"},
  {"source":"linkedin","name":"subhani shaik","position":"Engineer","linkedin_url":"https://www.linkedin.com/in/subhani-shaik-57214a217"},
  {"source":"linkedin","name":"Kajendran P","position":"Manager","linkedin_url":"https://www.linkedin.com/in/kajendran-p-9267b9a8"}
]'::jsonb WHERE recycler_code = 'PMP-KA-001';

-- LKDN-004 → PMP-TN-003  Harihar Alloys
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"balaguru ganesan","position":"agm","linkedin_url":"https://www.linkedin.com/in/balaguru-ganesan-895b95117"}
]'::jsonb WHERE recycler_code = 'PMP-TN-003';

-- LKDN-005 → CPCB-KA-073  e2e Recycling
-- (matcher auto-captured an email in this one)
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"Altaf Hussain","position":"Marketing Team","linkedin_url":"https://www.linkedin.com/in/altaf-hussain-7290a656","email":"altaf@bangaloremart.in"}
]'::jsonb WHERE recycler_code = 'CPCB-KA-073';

-- LKDN-006 → CPCB-TS-024  Resustainability Reldan
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"koti purushotham rao","position":"Plant Manager","linkedin_url":"https://www.linkedin.com/in/kotipurushothamrao"}
]'::jsonb WHERE recycler_code = 'CPCB-TS-024';

-- LKDN-007 → PMP-MH-001  Sona Alloys
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"Lalitkumar Lunawat","position":"Quality Assurance Specialist","linkedin_url":"https://www.linkedin.com/in/lalitkumar-lunawat-8314249"}
]'::jsonb WHERE recycler_code = 'PMP-MH-001';

-- LKDN-008 → PMP-MH-002  Orange City Alloys
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"Renu Gedekar","position":"CAD Engineer","linkedin_url":"https://www.linkedin.com/in/renu-gedekar-402229205"}
]'::jsonb WHERE recycler_code = 'PMP-MH-002';

-- LKDN-009 → PMP-MH-003  Jailaxmi Casting
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"Shreyas Jamale","position":"Trainee engineer","linkedin_url":"https://www.linkedin.com/in/shreyas-jamale-4s"}
]'::jsonb WHERE recycler_code = 'PMP-MH-003';

-- LKDN-010 → DELETED (merged into PMP-OR-004 Vedanta Jharsuguda). Skipped.

-- LKDN-011 → PMP-DD-001  Gujrat Copper Alloys, Silvassa
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"ASHISH kUMAR","position":"Production Manager","linkedin_url":"https://www.linkedin.com/in/ashish-kumar-7b323498"}
]'::jsonb WHERE recycler_code = 'PMP-DD-001';

-- LKDN-012 → PMP-GJ-003  Surat Aluminium
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"Sathish Chand","position":"Head of Human Resources Operations,ER and Safety","linkedin_url":"https://www.linkedin.com/in/sathish-c-3b66ba26"}
]'::jsonb WHERE recycler_code = 'PMP-GJ-003';

-- LKDN-013 → PMP-GJ-004  Varn Extrusion
-- (matcher auto-captured a personal email)
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"Kiran Khairnar","position":"Deputy General Manager","linkedin_url":"https://www.linkedin.com/in/kiran-khairnar-057417171","email":"kiran.k893344@gmail.com"}
]'::jsonb WHERE recycler_code = 'PMP-GJ-004';

-- LKDN-014 → DELETED (merged into PMP-GJ-001 Hindalco Birla Copper Dahej). Skipped.

-- LKDN-015 → PMP-GJ-005  Sruti Copper
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"Tabish Qureshi","position":"Director of Sales Marketing","linkedin_url":"https://www.linkedin.com/in/tabish-qureshi-8a30a42a"}
]'::jsonb WHERE recycler_code = 'PMP-GJ-005';

-- LKDN-016 → PMP-GJ-006  Global Copper
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"HIREN PATEL","position":"Metallurgist","linkedin_url":"https://www.linkedin.com/in/hiren-patel-243a397a"}
]'::jsonb WHERE recycler_code = 'PMP-GJ-006';

-- LKDN-017 → PMP-WB-001  Century Extrusions
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"Ashvani Kumar","position":"Assistant Manager- Production Planning","linkedin_url":"https://www.linkedin.com/in/ashvani-kumar-01a968bb"}
]'::jsonb WHERE recycler_code = 'PMP-WB-001';

-- LKDN-018 → PMP-GJ-007  Shree Hans Alloys
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"Anuraag D Daga","position":"Director of Sales and Marketing","linkedin_url":"https://www.linkedin.com/in/anuraag-d-daga-36933613"}
]'::jsonb WHERE recycler_code = 'PMP-GJ-007';

-- LKDN-019 → CPCB-WB-006  Hulladek Recycling
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"Riya Sharma","position":"Junior Business Support Manager","linkedin_url":"https://www.linkedin.com/in/riya-sharma-8216b9245"}
]'::jsonb WHERE recycler_code = 'CPCB-WB-006';

-- LKDN-020 → PMP-WB-002  Hindustan Copper (Kolkata HQ)
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"Sudha Sharma","position":"PA","linkedin_url":"https://www.linkedin.com/in/sudha-sharma-860b7b69"}
]'::jsonb WHERE recycler_code = 'PMP-WB-002';

-- LKDN-021 → PMP-GJ-008  Indo Asia Copper
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"Dr. Sanjay Sarkar","position":"CEO-Executive Director & Board of Director","linkedin_url":"https://www.linkedin.com/in/sanjay-sarkar-india"}
]'::jsonb WHERE recycler_code = 'PMP-GJ-008';

-- LKDN-022 → PMP-GJ-009  Shree Extrusions
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"Dayanidhi Tiwari","position":"Quality Supervisor","linkedin_url":"https://www.linkedin.com/in/dayanidhi-tiwari-b3784b175"}
]'::jsonb WHERE recycler_code = 'PMP-GJ-009';

-- LKDN-023 → CPCB-HR-044  Namo eWaste
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"Udhaya Gopal","position":"Vice President of Business Development","linkedin_url":"https://www.linkedin.com/in/udhaya-gopal-3ba19bb"}
]'::jsonb WHERE recycler_code = 'CPCB-HR-044';

-- LKDN-024 → NFMR-HR-029  Universal Metals & Alloys
UPDATE recyclers SET contacts_all = '[
  {"source":"linkedin","name":"Devanshu Jasani","position":"Partner","linkedin_url":"https://www.linkedin.com/in/devanshu-jasani-15a81323"}
]'::jsonb WHERE recycler_code = 'NFMR-HR-029';
