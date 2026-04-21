-- Fix Tata Chemicals entries in the recyclers directory.
--
-- Issues discovered 2026-04-21 when outreach emails bounced:
--   1. BWM-DL-001 carried a placeholder email (tatabattery@tatachemicals.com)
--      that does not exist at Tata. Our own CAM-GJ-001 row also had
--      corporate.comm@ and investor.tcl@ — both were outdated or wrong and
--      bounced on test. The actual currently-published Tata Chemicals
--      corporate contact (verified against tatachemicals.com/contact-us)
--      is the plain corporate@tatachemicals.com.
--   2. BWM-DL-001 was tagged to Mumbai (Tata HQ address) but the actual
--      Li-ion battery recycling operation since 2019 has been at Palghar,
--      Maharashtra, on a third-party (3P) contract basis.
--   3. BM-GJ-001 was classified as a "Dholera Li-ion Recycling Pilot" in the
--      black-mass tier — but Dholera is Tata Chemicals' planned 10 GW cell
--      manufacturing cluster (₹4,000 cr), not a recycling facility. It is
--      already correctly mapped under CAM-GJ-001 (Upstream / Cell-maker
--      tier), so BM-GJ-001 is a duplicate misclassification and must be
--      deactivated.
--
-- Sources:
--   • https://www.tatachemicals.com/Asia/News-room/Press-release/tata-chemicals-lion-battery-operations
--   • https://www.pv-magazine-india.com/2019/09/02/tata-chemicals-launches-li-ion-battery-recycling-operations/
--   • https://www.pv-magazine-india.com/2019/07/12/li-ion-battery-manufacturing-cluster-coming-up-at-gujarats-dholera-tata-first-to-invest/

BEGIN;

-- ── Fix 1 + 2: BWM-DL-001 — correct email + relocate to Palghar ───────────
UPDATE recyclers
SET
  email           = 'corporate@tatachemicals.com',
  city            = 'Palghar',
  state           = 'Maharashtra',
  address         = 'Li-ion battery recycling facility (3P operation), Palghar, Maharashtra. Registered under Tata Chemicals Ltd., Bombay House, 24, Homi Mody Street, Mumbai 400001.',
  contact_person  = 'Corporate Communications — c/o Material Sciences / Energy Sciences BU',
  notes           = E'Tata Chemicals launched India''s pioneer commercial Li-ion battery recycling operation in 2019 at Palghar, Maharashtra — initially on a third-party (3P) contract basis — making it one of the earliest corporate entrants into the Indian LIB recycling value chain.\n\nThe operation sits within Tata Chemicals'' Material Sciences / Energy Sciences portfolio, and is strategically linked to the Tata Group''s broader battery ambition: the Dholera 10 GW cell-manufacturing cluster (CAM-GJ-001, ₹4,000 cr announced investment) and the Agratas cell-production footprint.\n\nVERIFIED OUTREACH ROUTES (per tatachemicals.com/contact-us, 2026-04-21):\n• corporate@tatachemicals.com — corporate communications\n• investors@tatachemicals.com — investor relations (new as of Oct 2025)\n• sustainability@tatachemicals.com — sustainability desk (direct fit for recycling enquiries)\n• Switchboard: +91 22 6796 4196 (product queries) / +91 22 6665 8282 · 6665 7405 (IR)\n\nKey Tata Chemicals leadership (Tata Chemicals Ltd., parent entity):\n• R. Mukundan — Managing Director & CEO\n• S. Padmanabhan — Chairman (Non-Executive)\n• N. Chandrasekaran — Director (Tata Sons Chairman)\n• Rajiv Chandan — Chief General Counsel & Company Secretary\n\nListed as CPCB/BWM/DL/001 with 5,000 MTA licensed capacity + 3,000 MTA black-mass stream. Facility-specific operational details (current throughput, product slate, chemistry handling, own vs. 3P status today) require direct verification from the business leadership.',
  websites_all    = jsonb_build_array(
    jsonb_build_object('url', 'https://www.tatachemicals.com',                                                                            'source', 'manual-research', 'first_seen', '2026-04-21'),
    jsonb_build_object('url', 'https://www.tatachemicals.com/contact-us',                                                                 'source', 'manual-research', 'first_seen', '2026-04-21'),
    jsonb_build_object('url', 'https://www.tatachemicals.com/Asia/News-room/Press-release/tata-chemicals-lion-battery-operations',        'source', 'manual-research', 'first_seen', '2026-04-21')
  ),
  contacts_all    = jsonb_build_array(
    jsonb_build_object('name', 'Corporate Communications', 'title', 'Tata Chemicals Ltd.',                 'email', 'corporate@tatachemicals.com',       'phone', '+912267964196', 'source', 'tatachemicals.com/contact-us', 'first_seen', '2026-04-21'),
    jsonb_build_object('name', 'Investor Relations',       'title', 'Tata Chemicals Ltd.',                 'email', 'investors@tatachemicals.com',       'phone', '+912266658282', 'source', 'tatachemicals.com/contact-us', 'first_seen', '2026-04-21'),
    jsonb_build_object('name', 'Sustainability Desk',      'title', 'Tata Chemicals Ltd.',                 'email', 'sustainability@tatachemicals.com',                             'source', 'tatachemicals.com/contact-us', 'first_seen', '2026-04-21'),
    jsonb_build_object('name', 'Jeraz E. Mahernosh',       'title', 'Company Secretary (prior)',           'email', 'jmahernosh@tatachemicals.com',      'phone', '+912266658282', 'source', 'tatachemicals.com/contact-us', 'first_seen', '2026-04-21'),
    jsonb_build_object('name', 'Damini Jhunjhunwala',      'title', 'AGM Strategic Finance & Risk Mgmt',   'email', 'djhunjhunwala@tatachemicals.com',   'phone', '+912266657405', 'source', 'tatachemicals.com/contact-us', 'first_seen', '2026-04-21'),
    jsonb_build_object('name', 'R. Mukundan',              'title', 'Managing Director & CEO',                                                                                     'source', 'MCA / Tata disclosure',        'first_seen', '2026-04-21'),
    jsonb_build_object('name', 'S. Padmanabhan',           'title', 'Chairman (Non-Executive)',                                                                                      'source', 'MCA / Tata disclosure',        'first_seen', '2026-04-21'),
    jsonb_build_object('name', 'N. Chandrasekaran',        'title', 'Director (Tata Sons Chairman)',                                                                                  'source', 'MCA / Tata disclosure',        'first_seen', '2026-04-21'),
    jsonb_build_object('name', 'Rajiv Chandan',            'title', 'Chief General Counsel & Company Secretary',                                                                      'source', 'Tata IR 2025 update',          'first_seen', '2026-04-21')
  ),
  updated_at      = now()
WHERE recycler_code = 'BWM-DL-001';

-- Also fix CAM-GJ-001 — its outdated corporate.comm@ was the bounce source
UPDATE recyclers
SET
  email           = 'corporate@tatachemicals.com',
  contacts_all    = jsonb_build_array(
    jsonb_build_object('name', 'S. Padmanabhan',           'title', 'Chairman (Non-Executive)',                                                                                     'source', 'MCA / Tata disclosure',        'first_seen', '2026-04-21'),
    jsonb_build_object('name', 'N. Chandrasekaran',        'title', 'Director (Tata Sons Chairman)',                                                                                  'source', 'MCA / Tata disclosure',        'first_seen', '2026-04-21'),
    jsonb_build_object('name', 'R. Mukundan',              'title', 'Managing Director & CEO',                                                                                       'source', 'MCA / Tata disclosure',        'first_seen', '2026-04-21'),
    jsonb_build_object('name', 'Corporate Communications', 'title', 'Tata Chemicals Ltd.',                 'email', 'corporate@tatachemicals.com',       'phone', '+912267964196', 'source', 'tatachemicals.com/contact-us', 'first_seen', '2026-04-21'),
    jsonb_build_object('name', 'Investor Relations',       'title', 'Tata Chemicals Ltd.',                 'email', 'investors@tatachemicals.com',       'phone', '+912266658282', 'source', 'tatachemicals.com/contact-us', 'first_seen', '2026-04-21')
  ),
  updated_at      = now()
WHERE recycler_code = 'CAM-GJ-001';

-- ── Fix 3: BM-GJ-001 — Dholera is NOT a recycling facility; deactivate ────
-- Dholera is Tata Chemicals' planned 10 GW cell-manufacturing cluster and is
-- already correctly mapped under CAM-GJ-001 (Upstream / Cell-maker tier).
-- BM-GJ-001 was a misclassification in the black-mass seed and must be
-- removed from the Reverse Loop to prevent the directory from double-counting
-- and miscommunicating Tata's intent to visitors.
UPDATE recyclers
SET
  is_active  = false,
  notes      = E'[DEACTIVATED 2026-04-21] Dholera is Tata Chemicals'' planned 10 GW cell-manufacturing cluster, not a recycling facility. The Dholera site is correctly represented under CAM-GJ-001 (Upstream / Cell / CAM maker tier). This entry was a black-mass-seed misclassification that caused the directory to imply a recycling pilot at Dholera which does not exist.\n\nTata Chemicals'' actual Li-ion battery recycling operation is at Palghar, Maharashtra — mapped as BWM-DL-001.',
  updated_at = now()
WHERE recycler_code = 'BM-GJ-001';

COMMIT;
