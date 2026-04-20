-- Stage 2 — Scraper pass-2 contact enrichment (high-confidence only).
-- email: same-domain or info@/contact@/sales@/enquiry@/reach@/customercare@/care@
-- phone: +91NNNNNNNNNN with count >= 2 across site
-- Existing non-placeholder email/phone preserved via COALESCE + regex guard.
-- Generated: 2026-04-20T17:58:39.299Z
-- High-confidence rows: 22  Draft rows: 1

BEGIN;

-- CPCB-RJ-019 Abaad Developers Private Limited  (email:same-domain phone:count=11)
UPDATE recyclers SET
  email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\.'
      THEN 'info@abaadd.com'
    ELSE email
  END,
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+918588876751')
WHERE id = 'f087a6d1-f913-4655-a167-b27113c873c2';

-- RSPCB-RJ-028 Abaad Developers Pvt. Ltd.  (email:same-domain phone:count=11)
UPDATE recyclers SET
  email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\.'
      THEN 'info@abaadd.com'
    ELSE email
  END,
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+918588876751')
WHERE id = 'cb6e25bc-be2c-4eeb-be3c-33d5e69d2130';

-- CPCB-RJ-011 Adatte E-Waste Management Pvt. Ltd.  (email:same-domain phone:count=63)
UPDATE recyclers SET
  email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\.'
      THEN 'info@adatte.in'
    ELSE email
  END,
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+918595741724')
WHERE id = '3e11f278-29d6-4d53-a0c1-b3675a7e6bd9';

-- MPCB-MH-038 Aman E-Waste Recyclers Pvt Ltd  (email:same-domain phone:count=15)
UPDATE recyclers SET
  email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\.'
      THEN 'info@amanrecyclers.com'
    ELSE email
  END,
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+919967681472')
WHERE id = '4fb6cd28-d7f8-46b8-b8a4-35d633006dea';

-- CPCB-UP-016 Auctus Recycling Solutions Pvt. Ltd  (email:- phone:count=6)
UPDATE recyclers SET
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+919540062335')
WHERE id = '44ab278a-1c49-4d9f-819a-c1d0e033cfc9';

-- CPCB-UP-043 B.R.P. Infotech Private Limited  (email:same-domain phone:count=36)
UPDATE recyclers SET
  email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\.'
      THEN 'info@brpinfotech.in'
    ELSE email
  END,
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+919717393992')
WHERE id = 'b0f87197-1e0f-47c0-a8ac-2fc628d73523';

-- CPCB-UP-077 B.R.P. Infotech Private Limited (Unit-II)  (email:same-domain phone:count=36)
UPDATE recyclers SET
  email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\.'
      THEN 'info@brpinfotech.in'
    ELSE email
  END,
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+919717393992')
WHERE id = '963c468e-d7e0-4d21-8cc1-a7488121d953';

-- MPCB-MH-028 Bhangarwala Waste Management Pvt Ltd  (email:same-domain phone:count=4)
UPDATE recyclers SET
  email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\.'
      THEN 'info@bwmgroup.in'
    ELSE email
  END,
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+917710903010')
WHERE id = '36676529-3011-41e5-a4f9-2ba42bfdb8ab';

-- CPCB-UP-013 Circularity Solutions PrivateLimited  (email:same-domain phone:count=7)
UPDATE recyclers SET
  email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\.'
      THEN 'operations@circularity.in'
    ELSE email
  END,
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+918449662239')
WHERE id = '4f70a1eb-98f5-4631-94aa-945322d679f7';

-- CPCB-UP-116 Cynosure Recycling Private Ltd.  (email:same-domain phone:-)
UPDATE recyclers SET
  email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\.'
      THEN 'info@cynosurerecycling.com'
    ELSE email
  END
WHERE id = 'e95f8c66-ee61-43be-b70a-b96a38aa7ac0';

-- CPCB-GJ-001 E-coli Waste Management P. Ltd  (email:same-domain phone:count=49)
UPDATE recyclers SET
  email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\.'
      THEN 'info@ecoliwaste.com'
    ELSE email
  END,
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+919825494049')
WHERE id = '40b146cd-da60-454e-906f-622fc873558f';

-- MPCB-MH-041 E-Frontline Recycling Pvt. Ltd.  (email:same-domain phone:count=4)
UPDATE recyclers SET
  email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\.'
      THEN 'itdisposal@e-frontline.com'
    ELSE email
  END,
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+918980300083')
WHERE id = '344a9196-7acf-4595-85fd-be2a0414760c';

-- CPCB-KA-012 E-Parisara Pvt. Ltd.  (email:prefix-match phone:count=16)
UPDATE recyclers SET
  email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\.'
      THEN 'info@eparisaraa.com'
    ELSE email
  END,
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+919980147680')
WHERE id = '3da07085-cf49-4292-a047-7803583cd1bb';

-- CPCB-MH-011 ECO RESET PRIVATE LIMITED  (email:same-domain phone:count=15)
UPDATE recyclers SET
  email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\.'
      THEN 'info@ecoreset.in'
    ELSE email
  END,
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+917021819071')
WHERE id = 'c66e3250-d32c-474d-8094-f160bbbdc0df';

-- CPCB-MH-002 Eco-Recycling Ltd.  (email:same-domain phone:count=3)
UPDATE recyclers SET
  email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\.'
      THEN 'epr@ecoreco.com'
    ELSE email
  END,
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+917738077086')
WHERE id = '51aa7872-8c8e-4701-9649-a3f10c46603f';

-- CPCB-GJ-041 Egnus Ewaste Solution Private Limited  (email:same-domain phone:-)
UPDATE recyclers SET
  email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\.'
      THEN 'info@egnus.in'
    ELSE email
  END
WHERE id = '584ff4f0-5ac6-4aa4-9bb9-a7c85e9766eb';

-- CPCB-TN-022 Enviro Metals Recyclers Private Limited  (email:same-domain phone:count=2)
UPDATE recyclers SET
  email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\.'
      THEN 'info@ensenviro.com'
    ELSE email
  END,
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+919677240384')
WHERE id = '6647cf5a-8a31-40f7-b2de-af2c727c6bbc';

-- CPCB-GJ-029 GL Recycling LLP  (email:same-domain phone:count=7)
UPDATE recyclers SET
  email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\.'
      THEN 'info@glrecycling.co.in'
    ELSE email
  END,
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+919328811110')
WHERE id = '821a5135-3dfc-43a8-ae58-49afe4ae361f';

-- BM-MH-006 Swachchha Urja Nirman LLP (Epic Energy SPV)  (email:same-domain phone:count=55)
UPDATE recyclers SET
  email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\.'
      THEN 'info@epicenergy.in'
    ELSE email
  END,
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+919833832664')
WHERE id = '39607801-bf4a-481a-9526-a5a025987152';

-- BPACK-WB-001 Exide Industries Limited  (email:- phone:count=2)
UPDATE recyclers SET
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+917044000000')
WHERE id = 'f3879282-ffe6-4b2b-85aa-49173a09a29c';

-- EVOEM-DL-004 Okaya EV Private Limited  (email:prefix-match phone:count=2)
UPDATE recyclers SET
  email = CASE
    WHEN email IS NULL OR TRIM(email) = '' OR email ~* '@(recycler|placeholder)\.'
      THEN 'info@opgmobility.com'
    ELSE email
  END,
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+919643383838')
WHERE id = '1123f0ff-8c2b-4600-97d7-27d4e3b8b59e';

-- EVOEM-HR-003 Volvo Auto India Private Limited  (email:- phone:count=18)
UPDATE recyclers SET
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+916720920352')
WHERE id = 'b84864c3-7180-4c24-9459-f33676173b01';

COMMIT;
