-- Stage 1 — Backfill recyclers.website for top 300 priority rows.
-- Websites discovered via WebSearch + manual validation.
-- Generated: 2026-04-20T17:45:35.658Z
-- Hits: 21

BEGIN;

-- CPCB-RJ-019 Abaad Developers Private Limited
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://abaadd.com')
WHERE id = 'f087a6d1-f913-4655-a167-b27113c873c2';

-- RSPCB-RJ-028 Abaad Developers Pvt. Ltd.
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://abaadd.com')
WHERE id = 'cb6e25bc-be2c-4eeb-be3c-33d5e69d2130';

-- CPCB-RJ-011 Adatte E-Waste Management Pvt. Ltd.
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://adatte.in')
WHERE id = '3e11f278-29d6-4d53-a0c1-b3675a7e6bd9';

-- MPCB-MH-038 Aman E-Waste Recyclers Pvt Ltd
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://amanrecyclers.com')
WHERE id = '4fb6cd28-d7f8-46b8-b8a4-35d633006dea';

-- CPCB-UP-016 Auctus Recycling Solutions Pvt. Ltd
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://auctusrecycling.com')
WHERE id = '44ab278a-1c49-4d9f-819a-c1d0e033cfc9';

-- CPCB-UP-043 B.R.P. Infotech Private Limited
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://brpinfotech.in')
WHERE id = 'b0f87197-1e0f-47c0-a8ac-2fc628d73523';

-- CPCB-UP-077 B.R.P. Infotech Private Limited (Unit-II)
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://brpinfotech.in')
WHERE id = '963c468e-d7e0-4d21-8cc1-a7488121d953';

-- MPCB-MH-028 Bhangarwala Waste Management Pvt Ltd
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://bwmgroup.in')
WHERE id = '36676529-3011-41e5-a4f9-2ba42bfdb8ab';

-- CPCB-UP-013 Circularity Solutions PrivateLimited
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://circularity.in')
WHERE id = '4f70a1eb-98f5-4631-94aa-945322d679f7';

-- CPCB-UP-116 Cynosure Recycling Private Ltd.
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://cynosurerecycling.com')
WHERE id = 'e95f8c66-ee61-43be-b70a-b96a38aa7ac0';

-- CPCB-GJ-001 E-coli Waste Management P. Ltd
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://ecoliwaste.com')
WHERE id = '40b146cd-da60-454e-906f-622fc873558f';

-- MPCB-MH-041 E-Frontline Recycling Pvt. Ltd.
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://e-frontline.com')
WHERE id = '344a9196-7acf-4595-85fd-be2a0414760c';

-- CPCB-KA-012 E-Parisara Pvt. Ltd.
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://ewasteindia.com')
WHERE id = '3da07085-cf49-4292-a047-7803583cd1bb';

-- CPCB-UP-083 Eco Fly E-Waste Recycling Pvt. Ltd.
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://ecoflyewaste.com')
WHERE id = '5e745571-61a4-470f-9ebf-ab9d7e500133';

-- CPCB-MH-011 ECO RESET PRIVATE LIMITED
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://ecoreset.in')
WHERE id = 'c66e3250-d32c-474d-8094-f160bbbdc0df';

-- CPCB-MH-002 Eco-Recycling Ltd.
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://ecoreco.com')
WHERE id = '51aa7872-8c8e-4701-9649-a3f10c46603f';

-- CPCB-GJ-041 Egnus Ewaste Solution Private Limited
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://egnus.in')
WHERE id = '584ff4f0-5ac6-4aa4-9bb9-a7c85e9766eb';

-- CPCB-HR-043 Endeavor Recyclers India Private Limited
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://endeavor-recyclers.com')
WHERE id = '9edc3220-103c-443f-92f1-1ede30e4205d';

-- CPCB-TN-022 Enviro Metals Recyclers Private Limited
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://ensenviro.com')
WHERE id = '6647cf5a-8a31-40f7-b2de-af2c727c6bbc';

-- CPCB-GJ-040 Evergreen E Waste Management Pvt. Ltd.
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://evergreenrecycler.in')
WHERE id = '52a46641-4a4e-4d1a-b4ec-7e068ca03a8e';

-- CPCB-GJ-029 GL Recycling LLP
UPDATE recyclers SET website = COALESCE(NULLIF(TRIM(website),''), 'https://glrecycling.co.in')
WHERE id = '821a5135-3dfc-43a8-ae58-49afe4ae361f';

COMMIT;
