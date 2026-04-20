-- Playwright WAF/SPA scrape — conservative enrichment
-- Generated 2026-04-20T17:54:20.279Z
-- Rules:
--   * Only set email where current email is NULL or matches '@(recycler|placeholder)\.'
--   * Only set phone where current phone IS NULL
--   * COALESCE to never clobber non-placeholder values.

BEGIN;
-- runaya.in: no primary email or phone extracted
-- vedantalimited.com: scraper's "primary" was contactus@anilagrawalfoundation.org (foundation, not operational).
--   Swapped to vedantaltd.ir@vedanta.co.in (investor relations mailbox on vedanta.co.in).
UPDATE recyclers SET email = COALESCE(NULLIF(email, ''), 'vedantaltd.ir@vedanta.co.in'), phone = COALESCE(NULLIF(phone, ''), '+917008811080') WHERE id = '5e1c4328-d434-49c4-b118-4d6394db69aa' AND ((email IS NULL OR email ~* '@(recycler|placeholder)\.') OR phone IS NULL);  -- PMP-OR-005 vedantalimited.com
UPDATE recyclers SET email = COALESCE(NULLIF(email, ''), 'vedantaltd.ir@vedanta.co.in'), phone = COALESCE(NULLIF(phone, ''), '+917008811080') WHERE id = '2cd2cf61-6978-4198-8c5b-61668a5362b0' AND ((email IS NULL OR email ~* '@(recycler|placeholder)\.') OR phone IS NULL);  -- PMP-OR-004 vedantalimited.com
UPDATE recyclers SET phone = COALESCE(NULLIF(phone, ''), '+919235645924') WHERE id = 'e54da667-1d7f-42be-ad8f-922a68866f26' AND (phone IS NULL);  -- PMP-OR-006 jsw.in
UPDATE recyclers SET phone = COALESCE(NULLIF(phone, ''), '+919235645924') WHERE id = 'dc36a790-7b0b-4201-b3da-b79f829dbc57' AND (phone IS NULL);  -- CELL-MH-001 jsw.in
UPDATE recyclers SET phone = COALESCE(NULLIF(phone, ''), '+919235645924') WHERE id = 'e54da667-1d7f-42be-ad8f-922a68866f26' AND (phone IS NULL);  -- PMP-OR-006 jsw.in
UPDATE recyclers SET phone = COALESCE(NULLIF(phone, ''), '+919235645924') WHERE id = 'dc36a790-7b0b-4201-b3da-b79f829dbc57' AND (phone IS NULL);  -- CELL-MH-001 jsw.in
UPDATE recyclers SET email = COALESCE(NULLIF(email, ''), 'cac@tatamotors.com') WHERE id = '486382bb-be78-44eb-a284-bfca96e65ae3' AND ((email IS NULL OR email ~* '@(recycler|placeholder)\.') OR phone IS NULL);  -- MAJ-MH-003 tatamotors.com
UPDATE recyclers SET email = COALESCE(NULLIF(email, ''), 'cac@tatamotors.com') WHERE id = 'c9786703-5c99-4ee5-9bfb-5d15d4629efe' AND ((email IS NULL OR email ~* '@(recycler|placeholder)\.') OR phone IS NULL);  -- EVOEM-MH-001 tatamotors.com
UPDATE recyclers SET email = COALESCE(NULLIF(email, ''), 'customercare.irm@adani.com') WHERE id = 'ad62e65c-719e-42f4-a2eb-7faea7f238b0' AND ((email IS NULL OR email ~* '@(recycler|placeholder)\.') OR phone IS NULL);  -- PMP-GJ-002 adanienterprises.com
UPDATE recyclers SET email = COALESCE(NULLIF(email, ''), 'exidecare@exide.co.in') WHERE id = 'f3879282-ffe6-4b2b-85aa-49173a09a29c' AND ((email IS NULL OR email ~* '@(recycler|placeholder)\.') OR phone IS NULL);  -- BPACK-WB-001 exideindustries.com
UPDATE recyclers SET email = COALESCE(NULLIF(email, ''), 'customercare@heromotocorp.com'), phone = COALESCE(NULLIF(phone, ''), '+919289233962') WHERE id = '5ee4aa3a-8678-4e2d-8053-b429f3aed319' AND ((email IS NULL OR email ~* '@(recycler|placeholder)\.') OR phone IS NULL);  -- EVOEM-DL-001 heromotocorp.com
UPDATE recyclers SET email = COALESCE(NULLIF(email, ''), 'customercare@heromotocorp.com'), phone = COALESCE(NULLIF(phone, ''), '+919289233962') WHERE id = '5ee4aa3a-8678-4e2d-8053-b429f3aed319' AND ((email IS NULL OR email ~* '@(recycler|placeholder)\.') OR phone IS NULL);  -- EVOEM-DL-001 heromotocorp.com
UPDATE recyclers SET email = COALESCE(NULLIF(email, ''), 'customerservice@bajajauto.co.in'), phone = COALESCE(NULLIF(phone, ''), '+917219821111') WHERE id = '0fe99c46-d088-44a1-a161-758e736520aa' AND ((email IS NULL OR email ~* '@(recycler|placeholder)\.') OR phone IS NULL);  -- EVOEM-PN-001 bajajauto.com
-- amararaja.com: no primary email or phone extracted
UPDATE recyclers SET email = COALESCE(NULLIF(email, ''), 'info@opgmobility.com'), phone = COALESCE(NULLIF(phone, ''), '+918377909090') WHERE id = '1123f0ff-8c2b-4600-97d7-27d4e3b8b59e' AND ((email IS NULL OR email ~* '@(recycler|placeholder)\.') OR phone IS NULL);  -- EVOEM-DL-004 okayaev.com
-- exideenergy.in: no primary email or phone extracted
UPDATE recyclers SET email = COALESCE(NULLIF(email, ''), 'kiacare@kiaindia.net'), phone = COALESCE(NULLIF(phone, ''), '+918849872290') WHERE id = '94505ce5-7b6c-45c9-99ec-3ae30214af98' AND ((email IS NULL OR email ~* '@(recycler|placeholder)\.') OR phone IS NULL);  -- EVOEM-AP-001 kia.com
-- mahindra.com: scraper picked a personal mailbox. Swap to sales.info@mahindra.com (public sales mailbox).
UPDATE recyclers SET email = COALESCE(NULLIF(email, ''), 'sales.info@mahindra.com') WHERE id = 'd7740b6a-d507-4aa2-91a3-4a3f0ea9a3e6' AND ((email IS NULL OR email ~* '@(recycler|placeholder)\.') OR phone IS NULL);  -- EVOEM-MH-002 mahindra.com
-- okayapower.com: no primary email or phone extracted
UPDATE recyclers SET email = COALESCE(NULLIF(email, ''), 'info@jindalaluminium.com'), phone = COALESCE(NULLIF(phone, ''), '+918023715555') WHERE id = 'd33d99b9-6f25-4376-ae7d-b78ae59bb046' AND ((email IS NULL OR email ~* '@(recycler|placeholder)\.') OR phone IS NULL);  -- PMP-KA-001 jindalaluminium.com
UPDATE recyclers SET email = COALESCE(NULLIF(email, ''), 'info@jindalaluminium.com'), phone = COALESCE(NULLIF(phone, ''), '+918023715555') WHERE id = 'd33d99b9-6f25-4376-ae7d-b78ae59bb046' AND ((email IS NULL OR email ~* '@(recycler|placeholder)\.') OR phone IS NULL);  -- PMP-KA-001 jindalaluminium.com
-- sungeelindia.in: no primary email or phone extracted
-- envirohub.com.sg: no primary email or phone extracted
UPDATE recyclers SET email = COALESCE(NULLIF(email, ''), 'info@sonaalloys.com') WHERE id = '7f1f5530-73c2-4d8e-931b-434f005bea87' AND ((email IS NULL OR email ~* '@(recycler|placeholder)\.') OR phone IS NULL);  -- PMP-MH-001 sonaalloys.com
-- gcal.co.in: no primary email or phone extracted
-- racenergy.in: no primary email or phone extracted
-- globalcopper.co.in: no primary email or phone extracted
-- log9materials.com: no primary email or phone extracted

COMMIT;
