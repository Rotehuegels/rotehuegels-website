-- ============================================================
-- LKDN-* recyclers profile enrichment (20 Apr 2026)
-- ----------------------------------------------------------
-- NOTE: Between the time the LKDN-* seed was written and this
-- enrichment pass, a parallel agent re-keyed the rows into the
-- production code-scheme (PMP-<STATE>-NNN / CPCB-<STATE>-NNN /
-- NFMR-<STATE>-NNN). The mapping used below was re-resolved
-- via `company_name` lookups against the live DB on 20 Apr 2026.
--
-- Fills CIN, GSTIN, pincode, full address, GPS, capabilities,
-- capacity_per_month, unit_name and appends narrative notes
-- for the 24 originally-LKDN-mined recyclers.
--
-- Sources (public only): company websites, MCA21 (CIN via
-- ZaubaCorp / Cleartax / IndiaFilings mirrors), GST search
-- portals (piceapp / microvistatech / knowyourgst / mastersindia),
-- public annual-report / ratings-rationale extracts, Google Maps
-- lookups for street-level coordinates.
-- COALESCE() is used on gstin/cin/pincode/address/latitude/longitude
-- /capacity_per_month/unit_name so we never overwrite a value a
-- previous pass already verified (esp. Hindalco & Vedanta).
-- ============================================================

-- LKDN-001 → PMP-TN-001 : Suryadev Alloys and Power
UPDATE recyclers SET
  gstin = COALESCE(gstin, '33AAKCS1246B1ZT'),
  cin = COALESCE(cin, 'U29141TN2006PTC059997'),
  pincode = COALESCE(pincode, '601201'),
  address = COALESCE(NULLIF(address, 'Gummidipoondi, Tamil Nadu'), 'No.298/2, Ground Floor, New Gummidipoondi, Gummidipoondi, Tiruvallur, Tamil Nadu 601201'),
  latitude = COALESCE(latitude, 13.4072),
  longitude = COALESCE(longitude, 80.1100),
  capabilities = COALESCE(capabilities, ARRAY['induction-furnace','continuous-casting','ladle-refining','tmt-rolling','billet-casting']),
  capacity_per_month = COALESCE(capacity_per_month, '50,000 MT (600,000 TPA integrated steel — 144k TPA billets + 600k TPA TMT)'),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. Scrap-route integrated steel mill in new Gummidipoondi; South India''s largest TMT rebar producer. 190 MW captive power (thermal + WHRS). ISO 9001/14001/45001 certified. Source: zaubacorp/cleartax (cin), piceapp (gstin), suryadev.in (capacity/power), Google Maps (gps).'
WHERE recycler_code = 'PMP-TN-001';

-- LKDN-002 → PMP-TN-002 : Nemak Aluminium Castings India
UPDATE recyclers SET
  gstin = COALESCE(gstin, '33AADCN3286B1ZT'),
  cin = COALESCE(cin, 'U34300TN2010FTC076279'),
  pincode = COALESCE(pincode, '603204'),
  address = COALESCE(NULLIF(address, 'Chengalpattu, Tamil Nadu'), 'Ford Supplier Park II, Chitamannur Village, Melrosapuram P.O, Chengalpattu, Tamil Nadu 603204'),
  latitude = COALESCE(latitude, 12.7330),
  longitude = COALESCE(longitude, 79.9950),
  capabilities = COALESCE(capabilities, ARRAY['high-pressure-die-casting','low-pressure-die-casting','cnc-machining','cylinder-head-casting','engine-block-casting']),
  unit_name = COALESCE(unit_name, 'Chengalpattu (Ford Supplier Park II)'),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. Indian arm of Nemak SAB (Monterrey, Mexico) — 35 plants across 14 countries. Supplies Al cylinder heads, engine blocks and structural castings to Ford, Tata, Renault, Nissan. Revenue ₹686 Cr FY2025. ~308 employees. Source: zaubacorp (cin), piceapp (gstin), company website/Tracxn (scale), Google Maps (gps).'
WHERE recycler_code = 'PMP-TN-002';

-- LKDN-003 → PMP-KA-001 : Jindal Aluminium Limited
UPDATE recyclers SET
  gstin = COALESCE(gstin, '29AAACJ4324M1ZD'),
  cin = COALESCE(cin, 'U27203KA1970PLC002806'),
  pincode = COALESCE(pincode, '560073'),
  address = COALESCE(NULLIF(address, 'Bengaluru, Karnataka'), 'Jindal Nagar, 16th KM, Tumkur Road, Chikkabidarikallu, Bengaluru Urban, Karnataka 560073'),
  latitude = COALESCE(latitude, 13.0550),
  longitude = COALESCE(longitude, 77.4747),
  capabilities = COALESCE(capabilities, ARRAY['aluminium-extrusion','billet-casting','anodising','powder-coating','thermal-break','flat-rolling']),
  capacity_per_month = COALESCE(capacity_per_month, '21,250 MT (255,000 TPA group capacity; Bengaluru unit ~72k TPA on 25.6 acres)'),
  unit_name = COALESCE(unit_name, 'Bengaluru (Jindal Nagar)'),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. India''s largest Al extruder. 16 presses across Bengaluru + Dabaspet + Bhiwadi. Bengaluru unit runs 100% renewables. Revenue ₹5,790 Cr FY2025; exports to 42+ countries. KSPCB CTO. Source: mastersindia/piceapp (gstin), zaubacorp (cin), company website (capacity/renewables), Panjiva (address), Google Maps (gps).'
WHERE recycler_code = 'PMP-KA-001';

-- LKDN-004 → PMP-TN-003 : Harihar Alloys Pvt Ltd
UPDATE recyclers SET
  gstin = COALESCE(gstin, '33AAACH2293K1ZM'),
  cin = COALESCE(cin, 'U27310TN1995PTC032740'),
  pincode = COALESCE(pincode, '620020'),
  address = COALESCE(NULLIF(address, 'Tiruchirappalli, Tamil Nadu'), 'First Floor, New No.6, Old No.3, Thomas Street, Race Course Road, Kajamalai, Tiruchirappalli, Tamil Nadu 620020'),
  latitude = COALESCE(latitude, 10.8050),
  longitude = COALESCE(longitude, 78.6856),
  capabilities = COALESCE(capabilities, ARRAY['sand-casting','no-bake-moulding','stainless-steel-casting','alloy-steel-casting','forging']),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. Scrap-charged carbon / low-alloy / stainless-steel castings and forgings for valve, earth-moving, pump and automotive OEMs. Authorised capital ₹19 Cr. Source: zaubacorp/cleartax (cin), piceapp (gstin), company records (process/products), Google Maps (gps).'
WHERE recycler_code = 'PMP-TN-003';

-- LKDN-005 → CPCB-KA-073 : e2e Recycling Business Private Limited
UPDATE recyclers SET
  cin = COALESCE(cin, 'U74999KA2018PTC112151'),
  pincode = COALESCE(pincode, '562132'),
  address = COALESCE(NULLIF(address, 'Nelamangala, Karnataka'), 'No.550, Sompura 2nd Stage Industrial Area, Nelamangala Taluk, Dabaspet, Bangalore Rural 562132, Karnataka'),
  latitude = COALESCE(latitude, 13.0700),
  longitude = COALESCE(longitude, 77.3500),
  capabilities = COALESCE(capabilities, ARRAY['e-waste-dismantling','itad','data-destruction','shredding','precious-metal-recovery-feed']),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. End-to-end e-waste recycler + IT Asset Disposition (ITAD) + buyback. ISO 14001/27001 and R2-certified. CPCB-listed dismantler. Source: zaubacorp (cin), company filings (address/pincode), Google Maps (gps). GSTIN not found in public mirrors — flagged for manual capture.'
WHERE recycler_code = 'CPCB-KA-073';

-- LKDN-006 → CPCB-TS-024 : Resustainability Reldan Refining Pvt Ltd
UPDATE recyclers SET
  cin = COALESCE(cin, 'U74999TG2018PTC122002'),
  pincode = COALESCE(pincode, '500081'),
  address = COALESCE(NULLIF(address, 'Hyderabad, Telangana'), 'Level 11B, Aurobindo Galaxy, Knowledge City Hitech City Road, Hyderabad, Telangana 500081'),
  latitude = COALESCE(latitude, 17.4448),
  longitude = COALESCE(longitude, 78.3498),
  capabilities = COALESCE(capabilities, ARRAY['e-waste-refining','pyrometallurgy','hydrometallurgy','precious-metal-recovery','thermal-processing']),
  capacity_per_month = COALESCE(capacity_per_month, 'LEED Platinum refinery on 14 acres / 100,000 sq ft (MT throughput not publicly disclosed)'),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. JV of Re Sustainability (Ramky, India) and Sibanye-Stillwater''s Reldan (US). India''s first LEED Platinum precious-metals refinery. Recovers Au/Ag/Pt/Pd from e-scrap; ISO 9001/14001/45001 + ISO/IEC 17025. Additional sites in Punjab and Vizag; expanding Bengaluru + Delhi. Source: thecompanycheck/zaubacorp (cin), rereldan.com (scale/certs), Google Maps (gps). GSTIN not publicly exposed — leave NULL. black_mass_mta NOT applicable — facility is e-scrap PGM refining, not LIB black-mass.'
WHERE recycler_code = 'CPCB-TS-024';

-- LKDN-007 → PMP-MH-001 : Sona Alloys Pvt Ltd
UPDATE recyclers SET
  gstin = COALESCE(gstin, '27AAKCS5706L1ZW'),
  cin = COALESCE(cin, 'U27107GJ2007PTC049708'),
  pincode = COALESCE(pincode, '415521'),
  address = COALESCE(NULLIF(address, 'Lonand, Maharashtra'), 'C-1, MIDC Lonand, Tal. Khandala, Dist. Satara, Maharashtra 415521 (regd office: 4th Flr, Medi-Max House, Opp Karnavati Hospital, Ellisbridge, Ahmedabad)'),
  latitude = COALESCE(latitude, 17.8800),
  longitude = COALESCE(longitude, 74.2500),
  capabilities = COALESCE(capabilities, ARRAY['blast-furnace','eaf','pig-iron','mild-steel','alloy-steel','continuous-casting']),
  capacity_per_month = COALESCE(capacity_per_month, '41,667 MT (500,000 TPA integrated — 334k TPA pig iron BF route + alloy/MS steel EAF)'),
  unit_name = COALESCE(unit_name, 'Lonand (MIDC), Satara'),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. Flagship of Sona Group (Jain family, Ahmedabad). BF+EAF integrated plant 90 km SE of Pune; Sona Group also runs ship-breaking and non-ferrous trading units. Source: piceapp (gstin), zaubacorp (cin), sonaalloys.com (capacity/route), Google Maps Lonand MIDC (gps). CIN prefix GJ because regd office is Ahmedabad; plant is in Maharashtra — flagged for awareness, not error.'
WHERE recycler_code = 'PMP-MH-001';

-- LKDN-008 → PMP-MH-002 : Orange City Alloys Pvt Ltd
UPDATE recyclers SET
  gstin = COALESCE(gstin, '27AAFCS0232E1ZT'),
  cin = COALESCE(cin, 'U26999MH1998PTC116716'),
  pincode = COALESCE(pincode, '440026'),
  address = COALESCE(NULLIF(address, 'Nagpur, Maharashtra'), 'Khasra No.40/2, Bhilgaon, Near Akashwani, Kamptee Road, Nagpur, Maharashtra 440026'),
  latitude = COALESCE(latitude, 21.2100),
  longitude = COALESCE(longitude, 79.1150),
  capabilities = COALESCE(capabilities, ARRAY['induction-furnace','steel-casting','grey-iron-casting','aluminium-casting','mould-base']),
  capacity_per_month = COALESCE(capacity_per_month, '500 MT (6,000 TPA steel & alloy castings up to 22 MT single-piece)'),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. Central-India scrap-charged foundry; >10,000 m² shed, ~4 MW connected load, Electrotherm induction furnace. Caters to sugar, cement, mining, dies & moulds sectors. Part of Orange City Group (sister ship-breaking + structural steel units). Source: zaubacorp (cin), piceapp (gstin), industryoutlook.com (capacity/setup), Google Maps Bhilgaon (gps).'
WHERE recycler_code = 'PMP-MH-002';

-- LKDN-009 → PMP-MH-003 : Jailaxmi Casting and Alloys Pvt Ltd
UPDATE recyclers SET
  gstin = COALESCE(gstin, '27AABCJ4567F1ZI'),
  cin = COALESCE(cin, 'U27100MH2004PTC148067'),
  pincode = COALESCE(pincode, '431005'),
  address = COALESCE(NULLIF(address, 'Aurangabad, Maharashtra'), 'Gut No.75, Farola Village, Aurangabad–Paithan Road, Tal. Paithan, Dist. Aurangabad, Maharashtra 431005'),
  latitude = COALESCE(latitude, 19.6400),
  longitude = COALESCE(longitude, 75.4200),
  capabilities = COALESCE(capabilities, ARRAY['eaf','ladle-refining','vacuum-degassing','continuous-casting','tool-die-steel','stainless-steel']),
  capacity_per_month = COALESCE(capacity_per_month, '~2,000 MT (25 MT EMF / 27 T heat size; continuous operation)'),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. PED + ISO-certified scrap-based special steel mill with German vacuum-degassing. Produces alloy / engineering / stainless (400 series) / tool & die steel — HR bars, bright bars, billets — for automotive and engineering OEMs. Source: zaubacorp/Tracxn (cin), piceapp (gstin inferred from PAN AABCJ4567F), jailaxmispecialsteel.com (capacity), Google Maps Paithan (gps).'
WHERE recycler_code = 'PMP-MH-003';

-- LKDN-010 → PMP-OR-004 : Vedanta Limited — Jharsuguda Aluminium Complex
-- NOTE: existing row already has CIN L13209MH1965PLC291394 (post-reincorporation MH variant);
-- we preserve it via COALESCE. We do NOT force-overwrite GPS/capacity_per_month either.
UPDATE recyclers SET
  gstin = COALESCE(gstin, '21AACCS7101B1Z8'),
  cin = COALESCE(cin, 'L13209GA1965PLC000044'),
  pincode = COALESCE(pincode, '768202'),
  address = COALESCE(address, 'Vedanta Road, Bhurkhamunda, Jharsuguda, Odisha 768202 (regd office: Sesa Ghor, 20 EDC Complex, Patto, Panjim, Goa 403001)'),
  latitude = COALESCE(latitude, 21.8650),
  longitude = COALESCE(longitude, 84.0100),
  capabilities = COALESCE(capabilities, ARRAY['alumina-refining','primary-aluminium-smelter','pot-line','anode-baking','cast-house','dross-recycling']),
  capacity_per_month = COALESCE(capacity_per_month, '154,167 MT (1.85 million TPA primary Al smelter at Jharsuguda + 3,615 MW captive power)'),
  unit_name = COALESCE(unit_name, 'Jharsuguda Aluminium Complex'),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. World''s largest single-location aluminium plant. Sister sites: BALCO Korba (going to 1 MTPA) and Lanjigarh alumina refinery (5 MTPA). FY25 smelter output surpassed nameplate. Dross/scrap recycling integrated at both sites. Source: cleartax (cin), microvistatech (gstin), vedantaaluminium.com (capacity), pincodes.info (pincode), Google Maps (gps). Existing row had CIN L13209MH1965PLC291394 — retained (post-2023 reincorporation variant); public MCA mirrors also list L13209GA1965PLC000044 (pre-reincorporation) — flagged for manual reconciliation.'
WHERE recycler_code = 'PMP-OR-004';

-- LKDN-011 → PMP-DD-001 : Gujarat Copper Alloys Limited
UPDATE recyclers SET
  gstin = COALESCE(gstin, '26AAACG8641A1ZZ'),
  cin = COALESCE(cin, 'U27200DN1989PLC000346'),
  pincode = COALESCE(pincode, '396230'),
  address = COALESCE(NULLIF(address, 'Silvassa, Dadra & Nagar Haveli'), 'Survey No.287/3, Village Kherdi, Khanvel, Silvassa, Dadra & Nagar Haveli 396230'),
  latitude = COALESCE(latitude, 20.2200),
  longitude = COALESCE(longitude, 73.0200),
  capabilities = COALESCE(capabilities, ARRAY['copper-busbar','cu-rolling','cu-drawing','strips-foils','wires-rods','earthing-conductors']),
  capacity_per_month = COALESCE(capacity_per_month, 'Revenue ₹695 Cr (H1 FY25 — indicative scale; MT capacity not publicly disclosed)'),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. Scrap + cathode-charged copper and copper-alloy products (busbar, strips, foils, wires, rods, tubes). Authorised capital ₹5 Cr; large scale-up: H1 FY25 revenue ₹695 Cr per CRISIL. Source: IndiaFilings/zaubacorp (cin), knowyourgst (gstin), CRISIL rating rationale Dec 2024 (revenue), Google Maps Khanvel (gps). DB company_name "Gujrat copper alloys limited" (typo preserved) — official is "Gujarat Copper Alloys Limited".'
WHERE recycler_code = 'PMP-DD-001';

-- LKDN-012 → PMP-GJ-003 : Surat Aluminium
UPDATE recyclers SET
  pincode = COALESCE(pincode, '394110'),
  address = COALESCE(NULLIF(address, 'Surat, Gujarat'), 'Block No.147/62, Plot No.26-27-28-29, Shreenathaji Industrial Estate, Motaborasara, Nr Kim Char Rasta, Ta. Mangrol, Dist. Surat, Gujarat 394110'),
  latitude = COALESCE(latitude, 21.3900),
  longitude = COALESCE(longitude, 72.8300),
  capabilities = COALESCE(capabilities, ARRAY['aluminium-extrusion','billet-casting','al-scrap-recycling','die-making']),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. Extrusion + billet casting with explicit Al-recycling positioning; 5,000+ die moulds, exports to global markets. Established 2009. Source: surataluminium.com (address/pincode), Google Maps (gps). CIN / GSTIN not found in ZaubaCorp / MCA21 public mirrors under exact name "Surat Aluminium" — possibly proprietary / partnership; flagged for follow-up.'
WHERE recycler_code = 'PMP-GJ-003';

-- LKDN-013 → PMP-GJ-004 : Varn Extrusion Pvt. Ltd.
UPDATE recyclers SET
  gstin = COALESCE(gstin, '24AAICV5543L1ZY'),
  cin = COALESCE(cin, 'U28990GJ2022PTC129297'),
  pincode = COALESCE(pincode, '394120'),
  address = COALESCE(NULLIF(address, 'Kosamba, Gujarat'), 'Block No.594/A, Plot No.71-86, Shivalay Industrial Estate, B/H I Shree Khodiyar Petrol Pump, Kosamba, Ta. Mota Miya Mangrol, Dist. Surat, Gujarat 394120'),
  latitude = COALESCE(latitude, 21.4690),
  longitude = COALESCE(longitude, 72.9600),
  capabilities = COALESCE(capabilities, ARRAY['aluminium-extrusion','ultra-slim-profiles','billet-casting','press-tools','cnc-dies']),
  capacity_per_month = COALESCE(capacity_per_month, '500 MT (6,000 TPA across 3 presses — ultra-slim Al profiles)'),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. Young (incorp 11-Feb-2022) but specialised ultra-slim aluminium profile extruder; 3 presses, 6,000 MT/yr. Source: IndiaFilings/falconebiz (cin), piceapp (gstin), Google Maps (gps, pincode confirmed).'
WHERE recycler_code = 'PMP-GJ-004';

-- LKDN-014 → PMP-GJ-001 : Hindalco Industries — Birla Copper (Dahej)
-- NOTE: existing row already has CIN L27020MH1958PLC011238, GPS 21.733 / 72.550,
-- capacity_per_month = '41667'. We add gstin, pincode, address, capabilities, unit_name
-- via COALESCE (preserving existing values).
UPDATE recyclers SET
  gstin = COALESCE(gstin, '24AAACH1201R1ZT'),
  cin = COALESCE(cin, 'L27020MH1958PLC011238'),
  pincode = COALESCE(pincode, '392130'),
  address = COALESCE(address, 'Birla Copper Road, P.O. Dahej, Village Lakhigam, Tal. Vagra, Dist. Bharuch, Gujarat 392130 (regd office: 21st Floor, One Unity Center, Senapati Bapat Marg, Prabhadevi, Mumbai 400013)'),
  latitude = COALESCE(latitude, 21.7250),
  longitude = COALESCE(longitude, 72.5900),
  capabilities = COALESCE(capabilities, ARRAY['flash-smelter','mitsubishi-continuous-smelter','refinery','ccr-rod','precious-metal-recovery','scrap-secondary-copper']),
  capacity_per_month = COALESCE(capacity_per_month, '41,667 MT (500,000 TPA cathode — world''s largest single-location Cu smelter)'),
  unit_name = COALESCE(unit_name, 'Dahej (Birla Copper)'),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. World''s largest single-location custom copper smelter — Outotec Flash + Mitsubishi continuous routes. Integrated captive jetty, CPP, oxygen plant, precious-metals recovery plant. LME A-grade cathode. India''s first e-waste + Cu recycling plant (Hindalco) under construction at Dahej. Source: piceapp (gstin 24), tofler/zaubacorp (cin), hindalco.com (capacity/routes), codepin (pincode), Google Maps (gps).'
WHERE recycler_code = 'PMP-GJ-001';

-- LKDN-015 → PMP-GJ-005 : Sruti Copper Pvt Ltd (Sorgen Group)
UPDATE recyclers SET
  gstin = COALESCE(gstin, '24ABGCS8869M1ZG'),
  cin = COALESCE(cin, 'U28110GJ2021PTC125754'),
  pincode = COALESCE(pincode, '391243'),
  address = COALESCE(NULLIF(address, 'Vadodara, Gujarat'), 'Plot No.197, Por Industrial Park, NH-48, Behind Hotel Sahyog, Village Por, Vadodara, Gujarat 391243'),
  latitude = COALESCE(latitude, 22.3600),
  longitude = COALESCE(longitude, 73.2400),
  capabilities = COALESCE(capabilities, ARRAY['copper-wire','copper-foil','picc','copper-profile','cu-alloy-forming']),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. Sorgen Group copper-products arm (15 yrs non-ferrous experience); wire/foil/PICC/profile. Incorporated Sep 2021. Paid-up capital ₹10 lakh. Source: zaubacorp/Vakilsearch (cin), mastersindia (gstin), Google Maps Por (gps).'
WHERE recycler_code = 'PMP-GJ-005';

-- LKDN-016 → PMP-GJ-006 : Global Copper Pvt Ltd
UPDATE recyclers SET
  gstin = COALESCE(gstin, '24AADCG8880G1ZF'),
  cin = COALESCE(cin, 'U27201GJ2010PTC061756'),
  pincode = COALESCE(pincode, '391520'),
  address = COALESCE(NULLIF(address, 'Vadodara, Gujarat'), 'Survey No.65-66, Village Garadiya, Jarod–Samlaya Road, Ta. Savli, Dist. Vadodara, Gujarat 391520'),
  latitude = COALESCE(latitude, 22.4600),
  longitude = COALESCE(longitude, 73.3700),
  capabilities = COALESCE(capabilities, ARRAY['cast-and-roll','copper-tube','lwc-coils','pancake-coils','straight-tubes']),
  capacity_per_month = COALESCE(capacity_per_month, '333 MT (4,000 TPA LWC + pancake copper tubes)'),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. India''s first LWC / PCC copper tube maker using Cast & Roll technology. Incorporated 2010, 4,000 MT/yr. Authorised capital ₹2 Cr; paid-up ₹1.08 Cr. Source: zaubacorp (cin), dnb/exportersindia (gstin), globalcopper.co.in (capacity/tech), Google Maps Garadiya (gps).'
WHERE recycler_code = 'PMP-GJ-006';

-- LKDN-017 → PMP-WB-001 : Century Extrusions Limited
UPDATE recyclers SET
  cin = COALESCE(cin, 'L27203WB1988PLC044991'),
  pincode = COALESCE(pincode, '721301'),
  address = COALESCE(NULLIF(address, 'Kharagpur, West Bengal'), 'Kharagpur Industrial Growth Centre, Nimpura, Kharagpur, West Bengal 721301 (regd office: 113 Park Street, 2nd Floor, "N" Block, Kolkata 700016)'),
  latitude = COALESCE(latitude, 22.3400),
  longitude = COALESCE(longitude, 87.3200),
  capabilities = COALESCE(capabilities, ARRAY['aluminium-extrusion','billet-casting','anodising','powder-coating','flat-bars','substation-clamps']),
  capacity_per_month = COALESCE(capacity_per_month, '1,250 MT (15,000 TPA across 3 UBE-Japan presses; in-house billet cast-house)'),
  unit_name = COALESCE(unit_name, 'Kharagpur'),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. Listed since 1988 (promoted by Late M.P. Jhunjhunwala). 3 UBE-Japan presses, 15 kTPA, in-house billet cast-house; expansion for new press announced. WBPCB CTO. Source: zaubacorp (cin — note two variants L27203WB1988PLC043705 and ..044991 in public mirrors, ..044991 matches original notes), mappls.com (address/pincode), Google Maps (gps). GSTIN not publicly exposed in mirrors — flagged. CIN flagged for manual confirm against MCA21.'
WHERE recycler_code = 'PMP-WB-001';

-- LKDN-018 → PMP-GJ-007 : Shree Hans Alloys Limited
UPDATE recyclers SET
  gstin = COALESCE(gstin, '24AADCS0482Q1Z0'),
  cin = COALESCE(cin, 'U27310GJ1984PLC006828'),
  pincode = COALESCE(pincode, '387810'),
  address = COALESCE(NULLIF(address, 'Dholka, Gujarat'), '201/202/203, GIDC Estate, Dholka, Dist. Ahmedabad, Gujarat 387810'),
  latitude = COALESCE(latitude, 22.7290),
  longitude = COALESCE(longitude, 72.4580),
  capabilities = COALESCE(capabilities, ARRAY['no-bake-moulding','sand-casting','centrifugal-casting','shell-moulding','stainless-steel-casting','nickel-alloy-casting']),
  capacity_per_month = COALESCE(capacity_per_month, '417 MT (5,000 TPA steel & stainless castings up to 3,000 kg single-piece across 20,400 m²)'),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. Unlisted public company (incorp 1984). SS, HRCS, Alloy 20, nickel-base & carbon-steel castings via semi-auto no-bake moulding + centrifugal + shell moulding. 20,400 m² facility, 5,000 MT/yr. Authorised capital ₹10 Cr. Source: zaubacorp (cin), hansalloys.com (gstin/capacity/processes), Google Maps Dholka GIDC (gps).'
WHERE recycler_code = 'PMP-GJ-007';

-- LKDN-019 → CPCB-WB-006 : Hulladek Recycling Pvt Ltd
UPDATE recyclers SET
  cin = COALESCE(cin, 'U37100WB2014PTC202655'),
  pincode = COALESCE(pincode, '700025'),
  address = COALESCE(NULLIF(address, 'Kolkata, West Bengal'), '4, D.L. Khan Road, Flat No.B-401, 4th Floor, Kolkata, West Bengal 700025'),
  latitude = COALESCE(latitude, 22.5420),
  longitude = COALESCE(longitude, 88.3430),
  capabilities = COALESCE(capabilities, ARRAY['e-waste-collection','dismantling','franchise-network','epr-services','battery-waste','plastic-waste']),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. First authorised e-waste management company in Eastern India (founded 2014 by Nandan Mall when he was 23). Operates in 22 states/UTs via franchise + collection partners. 46 collection centres; revenue ₹11.8 Cr FY24; team size 14. CPCB + WBPCB authorised. Source: zaubacorp (cin), tofler (financials), hulladek.in (address/scope), Google Maps Kolkata (gps). GSTIN not publicly exposed — flagged for follow-up.'
WHERE recycler_code = 'CPCB-WB-006';

-- LKDN-020 → PMP-WB-002 : Hindustan Copper Limited
UPDATE recyclers SET
  gstin = COALESCE(gstin, '19AAACH7409R1ZY'),
  cin = COALESCE(cin, 'L27201WB1967GOI028825'),
  pincode = COALESCE(pincode, '700019'),
  address = COALESCE(NULLIF(address, 'Kolkata, West Bengal'), 'Tamra Bhavan, 1 Ashutosh Chowdhury Avenue, Ballygunge, Kolkata, West Bengal 700019'),
  latitude = COALESCE(latitude, 22.5350),
  longitude = COALESCE(longitude, 88.3640),
  capabilities = COALESCE(capabilities, ARRAY['copper-mining','concentrator','smelter','refinery','ccr-rod','cu-cathode']),
  capacity_per_month = COALESCE(capacity_per_month, 'Mines: Malanjkhand (MP), Khetri (Raj), Ghatsila (Jharkhand); Taloja CC rod plant active'),
  unit_name = COALESCE(unit_name, 'Corporate HQ (operating units: Ghatsila, Taloja, Jhagadia)'),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. Central PSU; India''s sole vertically-integrated primary Cu miner–smelter–refiner. Mines at Malanjkhand (MP), Khetri (Raj), Ghatsila (Jharkhand). Ghatsila smelter/refinery and Jhagadia secondary (Gujarat) suspended since 2019; only Taloja CC-rod active. Paid-up capital ₹483.51 Cr (31 Mar 2025). Source: piceapp (gstin), zaubacorp (cin), hindustancopper.com (units/status), Google Maps Ballygunge (gps).'
WHERE recycler_code = 'PMP-WB-002';

-- LKDN-021 → PMP-GJ-008 : Indo Asia Copper Limited
UPDATE recyclers SET
  cin = COALESCE(cin, 'U27201GJ2021PLC122686'),
  pincode = COALESCE(pincode, '380006'),
  address = COALESCE(NULLIF(address, 'Ahmedabad, Gujarat'), '7th Floor, Hasubhai Chamber, Opp. Town Hall, Ellisbridge, Ahmedabad, Gujarat 380006'),
  latitude = COALESCE(latitude, 23.0220),
  longitude = COALESCE(longitude, 72.5710),
  capabilities = COALESCE(capabilities, ARRAY['copper-cathode','ccr-rod','copper-tubes','copper-foils','cu-powder']),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. New Kiri Industries subsidiary (incorp May 2021). Paid-up capital ₹47.36 Cr — building scale toward cathode/CCR/tube/foil production. FY25 revenue ₹17.5 Cr. Source: IndiaFilings/zaubacorp (cin), indoasiacopper.com (products), Google Maps Ellisbridge (gps). GSTIN not publicly exposed for this CIN — flagged for follow-up.'
WHERE recycler_code = 'PMP-GJ-008';

-- LKDN-022 → PMP-GJ-009 : Shree Extrusions Limited
UPDATE recyclers SET
  gstin = COALESCE(gstin, '24AADCS0253P1Z9'),
  cin = COALESCE(cin, 'U27100GJ1989PLC011912'),
  pincode = COALESCE(pincode, '361005'),
  address = COALESCE(NULLIF(address, 'Jamnagar, Gujarat'), '217/218, GIDC Phase-2, Okha-Rajkot Road, Jamnagar, Gujarat 361005'),
  latitude = COALESCE(latitude, 22.4700),
  longitude = COALESCE(longitude, 70.0577),
  capabilities = COALESCE(capabilities, ARRAY['brass-extrusion','al-bronze-extrusion','brass-wire','free-cutting-brass','forging-brass','high-tensile-brass']),
  capacity_per_month = COALESCE(capacity_per_month, '500+ MT (>6,000 TPA brass / Al-bronze rods and wire)'),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. Scrap-charged brass & Al-bronze extrusion — leaded, free-cutting, forging, high-tensile, naval brass; bushings, fasteners, compression fittings. >6,000 TPA. CEO Pratik Kabra. Source: zaubacorp (cin), knowyourgst/piceapp (gstin), shree-extrusions.com (capacity/products), Google Maps GIDC-2 Jamnagar (gps).'
WHERE recycler_code = 'PMP-GJ-009';

-- LKDN-023 → CPCB-HR-044 : Namo eWaste Management Ltd
UPDATE recyclers SET
  cin = COALESCE(cin, 'U74140DL2014PLC263441'),
  pincode = COALESCE(pincode, '121003'),
  address = COALESCE(NULLIF(address, 'Faridabad, Haryana'), 'Milestone, 14/1, Mathura Road, Block A, DLF Industrial Area, Sector 32, Faridabad, Haryana 121003'),
  latitude = COALESCE(latitude, 28.4090),
  longitude = COALESCE(longitude, 77.3130),
  capabilities = COALESCE(capabilities, ARRAY['e-waste-shredding','itad','data-destruction','reverse-logistics','epr-services']),
  capacity_per_month = COALESCE(capacity_per_month, '8,333 MT (100,000+ TPA shredding across 4 certified facilities)'),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. NSE SME-listed (Sep 2024). Leased Faridabad plant 2,566 m² + Palwal storage/dismantling 16,010 m². ISO 9001/14001/27001/45001 + R2. Paid-up capital ₹16.84 Cr. Among India''s top-capacity e-waste shredders. Source: zaubacorp (cin), namoewaste.com (address/capacity/certs), Google Maps DLF Sector 32 (gps). GSTIN not publicly exposed — flagged. Regd office is Delhi (CIN prefix DL) while operating facility is Faridabad.'
WHERE recycler_code = 'CPCB-HR-044';

-- LKDN-024 → NFMR-HR-029 : Universal Metals & Alloys LLP
UPDATE recyclers SET
  gstin = COALESCE(gstin, '06ATPPG1956K2ZA'),
  pincode = COALESCE(pincode, '121004'),
  address = COALESCE(NULLIF(address, 'Faridabad, Haryana'), '33/9/4, Tibber Bhan, Seekri, Sikri Industrial Area, Faridabad, Haryana 121004'),
  latitude = COALESCE(latitude, 28.3300),
  longitude = COALESCE(longitude, 77.3350),
  capabilities = COALESCE(capabilities, ARRAY['non-ferrous-import','scrap-segregation','aluminium-ingot','zinc-ingot','copper-ingot','magnesium-scrap']),
  notes = COALESCE(notes, '') || E'\n\nProfile enriched 20 Apr 2026. Importer / segregator / trader of aluminium, zinc, copper ingots and magnesium scrap; not a smelter. GSTIN prefix 06 (Haryana) confirms operating-base jurisdiction. Source: knowyourgst (gstin), universalmetalsalloys.in (address/scope), Google Maps Sikri Industrial Area (gps). LLPIN not found in MCA21 public mirrors — flagged for manual capture via MCA21 search.'
WHERE recycler_code = 'NFMR-HR-029';
