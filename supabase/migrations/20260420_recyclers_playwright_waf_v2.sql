-- Playwright WAF/SPA scrape (v2 — fix overwrite logic)
-- v1 used COALESCE which kept existing placeholder emails. v2 uses CASE
-- so placeholder/null emails ARE replaced but real emails are preserved.
--
-- Email overwrite rule: only when current email is NULL or matches
--   @recycler.<tld> / @placeholder.<tld> / cpcb./mrai. prefix.
-- Phone overwrite rule: only when current phone IS NULL.

BEGIN;

-- vedantalimited.com
UPDATE recyclers SET
  email = CASE WHEN email IS NULL OR email ~* '@(recycler|placeholder)\.' OR email ~* '^(cpcb|mrai)\.' THEN 'vedantaltd.ir@vedanta.co.in' ELSE email END,
  phone = COALESCE(phone, '+917008811080')
WHERE id = '5e1c4328-d434-49c4-b118-4d6394db69aa';  -- PMP-OR-005
UPDATE recyclers SET
  email = CASE WHEN email IS NULL OR email ~* '@(recycler|placeholder)\.' OR email ~* '^(cpcb|mrai)\.' THEN 'vedantaltd.ir@vedanta.co.in' ELSE email END,
  phone = COALESCE(phone, '+917008811080')
WHERE id = '2cd2cf61-6978-4198-8c5b-61668a5362b0';  -- PMP-OR-004

-- tatamotors.com (Cloudflare-challenged but still yielded emails)
UPDATE recyclers SET
  email = CASE WHEN email IS NULL OR email ~* '@(recycler|placeholder)\.' OR email ~* '^(cpcb|mrai)\.' THEN 'cac@tatamotors.com' ELSE email END
WHERE id = '486382bb-be78-44eb-a284-bfca96e65ae3';  -- MAJ-MH-003
UPDATE recyclers SET
  email = CASE WHEN email IS NULL OR email ~* '@(recycler|placeholder)\.' OR email ~* '^(cpcb|mrai)\.' THEN 'cac@tatamotors.com' ELSE email END
WHERE id = 'c9786703-5c99-4ee5-9bfb-5d15d4629efe';  -- EVOEM-MH-001

-- adanienterprises.com
UPDATE recyclers SET
  email = CASE WHEN email IS NULL OR email ~* '@(recycler|placeholder)\.' OR email ~* '^(cpcb|mrai)\.' THEN 'customercare.irm@adani.com' ELSE email END
WHERE id = 'ad62e65c-719e-42f4-a2eb-7faea7f238b0';  -- PMP-GJ-002

-- exideindustries.com
UPDATE recyclers SET
  email = CASE WHEN email IS NULL OR email ~* '@(recycler|placeholder)\.' OR email ~* '^(cpcb|mrai)\.' THEN 'exidecare@exide.co.in' ELSE email END
WHERE id = 'f3879282-ffe6-4b2b-85aa-49173a09a29c';  -- BPACK-WB-001

-- heromotocorp.com
UPDATE recyclers SET
  email = CASE WHEN email IS NULL OR email ~* '@(recycler|placeholder)\.' OR email ~* '^(cpcb|mrai)\.' THEN 'customercare@heromotocorp.com' ELSE email END,
  phone = COALESCE(phone, '+919289233962')
WHERE id = '5ee4aa3a-8678-4e2d-8053-b429f3aed319';  -- EVOEM-DL-001

-- bajajauto.com
UPDATE recyclers SET
  email = CASE WHEN email IS NULL OR email ~* '@(recycler|placeholder)\.' OR email ~* '^(cpcb|mrai)\.' THEN 'customerservice@bajajauto.co.in' ELSE email END,
  phone = COALESCE(phone, '+917219821111')
WHERE id = '0fe99c46-d088-44a1-a161-758e736520aa';  -- EVOEM-PN-001

-- okayaev.com (via opgmobility.com — parent group)
UPDATE recyclers SET
  email = CASE WHEN email IS NULL OR email ~* '@(recycler|placeholder)\.' OR email ~* '^(cpcb|mrai)\.' THEN 'info@opgmobility.com' ELSE email END,
  phone = COALESCE(phone, '+918377909090')
WHERE id = '1123f0ff-8c2b-4600-97d7-27d4e3b8b59e';  -- EVOEM-DL-004

-- kia.com (Cloudflare-challenged but yielded)
UPDATE recyclers SET
  email = CASE WHEN email IS NULL OR email ~* '@(recycler|placeholder)\.' OR email ~* '^(cpcb|mrai)\.' THEN 'kiacare@kiaindia.net' ELSE email END,
  phone = COALESCE(phone, '+918849872290')
WHERE id = '94505ce5-7b6c-45c9-99ec-3ae30214af98';  -- EVOEM-AP-001

-- mahindra.com (public sales mailbox)
UPDATE recyclers SET
  email = CASE WHEN email IS NULL OR email ~* '@(recycler|placeholder)\.' OR email ~* '^(cpcb|mrai)\.' THEN 'sales.info@mahindra.com' ELSE email END
WHERE id = 'd7740b6a-d507-4aa2-91a3-4a3f0ea9a3e6';  -- EVOEM-MH-002

-- jindalaluminium.com
UPDATE recyclers SET
  email = CASE WHEN email IS NULL OR email ~* '@(recycler|placeholder)\.' OR email ~* '^(cpcb|mrai)\.' THEN 'info@jindalaluminium.com' ELSE email END,
  phone = COALESCE(phone, '+918023715555')
WHERE id = 'd33d99b9-6f25-4376-ae7d-b78ae59bb046';  -- PMP-KA-001

-- sonaalloys.com
UPDATE recyclers SET
  email = CASE WHEN email IS NULL OR email ~* '@(recycler|placeholder)\.' OR email ~* '^(cpcb|mrai)\.' THEN 'info@sonaalloys.com' ELSE email END
WHERE id = '7f1f5530-73c2-4d8e-931b-434f005bea87';  -- PMP-MH-001

COMMIT;
