-- =====================================================================
-- Ecosystem enrichment (auto-apply tier) — generated 2026-04-20T17:12:23.396Z
-- Source 1: website scrape (.buddy/website-scrape-results*.json)
-- Source 2: LinkedIn match (.buddy/ecosystem-linkedin-matches.json)
-- Rule: high-confidence only = website-verified same-domain email,
--       website-scraped phone, or LinkedIn score=100 corporate email/imported phone.
-- Conservative: only fills NULL / placeholder values; never overwrites real data.
-- =====================================================================

BEGIN;

-- recyclers PMP-TN-001: Suryadev Alloys and Power
--   email <- website-scrape:https://suryadev.in/
--   phone <- website-scrape:https://suryadev.in/
UPDATE recyclers SET email = 'info@suryadev.in', phone = '+919381850000', updated_at = NOW()
  WHERE recycler_code = 'PMP-TN-001'
    AND (email IS NULL OR email LIKE '%@recycler.in' OR email LIKE '%@placeholder.in') AND (phone IS NULL OR phone = '')
;

-- recyclers PMP-TN-002: NEMAK ALUMINIUM CASTINGS INDIA PRIVATE LIMITED
--   email <- website-scrape:https://www.nemak.com/
--   phone <- website-scrape:https://www.nemak.com/
UPDATE recyclers SET email = 'inquiries@nemak.com', phone = '+918902208123', updated_at = NOW()
  WHERE recycler_code = 'PMP-TN-002'
    AND (email IS NULL OR email LIKE '%@recycler.in' OR email LIKE '%@placeholder.in') AND (phone IS NULL OR phone = '')
;

-- recyclers PMP-GJ-004: Varn Extrusion Pvt. Ltd.
--   email <- website-scrape:https://www.varnextrusion.in/
UPDATE recyclers SET email = 'info@varnextrusion.in', updated_at = NOW()
  WHERE recycler_code = 'PMP-GJ-004'
    AND (email IS NULL OR email LIKE '%@recycler.in' OR email LIKE '%@placeholder.in')
;

-- recyclers PMP-TN-003: Harihar Alloys Pvt Ltd
--   email <- website-scrape:http://www.hariharalloy.com/
UPDATE recyclers SET email = 'marketing@hariharalloy.com', updated_at = NOW()
  WHERE recycler_code = 'PMP-TN-003'
    AND (email IS NULL OR email LIKE '%@recycler.in' OR email LIKE '%@placeholder.in')
;

-- recyclers PMP-MH-002: Orange City Alloys Pvt Ltd
--   email <- website-scrape:https://orangecityalloys.com/
--   phone <- website-scrape:https://orangecityalloys.com/
UPDATE recyclers SET email = 'enquiry@orangecityalloys.com', phone = '+917122760589', updated_at = NOW()
  WHERE recycler_code = 'PMP-MH-002'
    AND (email IS NULL OR email LIKE '%@recycler.in' OR email LIKE '%@placeholder.in') AND (phone IS NULL OR phone = '')
;

-- recyclers PMP-MH-003: JAILAXMI CASTING AND ALLOYS PRIVATE LIMITED
--   email <- website-scrape:https://www.jailaxmispecialsteel.com/
--   phone <- website-scrape:https://www.jailaxmispecialsteel.com/
UPDATE recyclers SET email = 'sales@jailaxmispecialsteel.com', phone = '+919923375633', updated_at = NOW()
  WHERE recycler_code = 'PMP-MH-003'
    AND (email IS NULL OR email LIKE '%@recycler.in' OR email LIKE '%@placeholder.in') AND (phone IS NULL OR phone = '')
;

-- recyclers PMP-GJ-003: Surat Aluminium
--   email <- website-scrape:https://surataluminium.com/
--   phone <- website-scrape:https://surataluminium.com/
UPDATE recyclers SET email = 'info@surataluminium.com', phone = '+919879595417', updated_at = NOW()
  WHERE recycler_code = 'PMP-GJ-003'
    AND (email IS NULL OR email LIKE '%@recycler.in' OR email LIKE '%@placeholder.in') AND (phone IS NULL OR phone = '')
;

-- recyclers PMP-WB-001: CENTURY EXTRUSIONS LIMITED
--   email <- website-scrape:https://www.centuryextrusions.com/
--   phone <- website-scrape:https://www.centuryextrusions.com/
UPDATE recyclers SET email = 'info@centuryextrusions.com', phone = '+917604066648', updated_at = NOW()
  WHERE recycler_code = 'PMP-WB-001'
    AND (email IS NULL OR email LIKE '%@recycler.in' OR email LIKE '%@placeholder.in') AND (phone IS NULL OR phone = '')
;

-- recyclers PMP-GJ-007: SHREE HANS ALLOYS LIMITED
--   email <- website-scrape:https://hansalloys.com/
UPDATE recyclers SET email = 'marketing@hansalloys.com', updated_at = NOW()
  WHERE recycler_code = 'PMP-GJ-007'
    AND (email IS NULL OR email LIKE '%@recycler.in' OR email LIKE '%@placeholder.in')
;

COMMIT;

-- Summary: 9 row updates across 1 tables.