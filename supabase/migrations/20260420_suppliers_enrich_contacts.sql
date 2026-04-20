-- ============================================================
-- Suppliers contact enrichment — Apr 2026
-- Public emails + phones sourced from company websites /
-- JustDial / IndiaMART. Each UPDATE is a single statement so
-- a partial rollback (if any proves stale) is trivial.
--
-- NOT applied (low confidence / mismatch):
--   - VND-011 TAMILNAD ALUMINIUM COMPANY (Madhavaram) — public
--     search returns the Salem-based govt TALCO, different firm
--   - VND-019 FATEMI SALES CORPORATION — no public listing
--   - VND-020 NATIONAL TUBES AND VALVES — JustDial mismatch
--   - VND-016 SHREE PADMAVATI METAL & ALLOYS — no public listing
-- ============================================================

-- Anthropic (USA, public support) — email only, no phone published
UPDATE suppliers SET email = 'support@anthropic.com',
  updated_at = NOW()
WHERE vendor_code = 'VND-002';

-- METAL SOURCE (Coimbatore) — metalsourceindia.com
UPDATE suppliers SET email = 'info@metalsourceindia.com', phone = '+91-9360777000',
  updated_at = NOW()
WHERE vendor_code = 'VND-018';

-- GALENA METALS PVT LTD (Vapi, Gujarat) — galenametals.com
UPDATE suppliers SET email = 'info@galenametals.com', phone = '+91-260-2432890',
  updated_at = NOW()
WHERE vendor_code = 'VND-012';

-- SHARP INDUSTRIES (Ambattur, Chennai) — sharp-industries.co.in
UPDATE suppliers SET email = 'info@sharp-industries.co.in', phone = '+91-9884071094',
  updated_at = NOW()
WHERE vendor_code = 'VND-013';

-- MAAZIAH (Chennai) — maaziah.com
UPDATE suppliers SET email = 'sales@maaziah.com', phone = '+91-9940644753',
  updated_at = NOW()
WHERE vendor_code = 'VND-017';

-- VIRWADIA METAL & ALLOYS (Chennai) — virwadiametal.com
UPDATE suppliers SET email = 'info@virwadiametal.com', phone = '+91-9840150567',
  updated_at = NOW()
WHERE vendor_code = 'VND-015';

-- National Metallurgical Laboratory (NML) — CSIR, Jamshedpur
UPDATE suppliers SET email = 'director.nml@csir.res.in', phone = '+91-657-2345000',
  updated_at = NOW()
WHERE vendor_code = 'VND-009';

-- Porter Technologies (Bangalore)
UPDATE suppliers SET email = 'help@porter.in', phone = '+91-80-44104410',
  updated_at = NOW()
WHERE vendor_code = 'VND-006';

-- CHENNAI PLASTICS INSULATIONS (Old Ambattur) — phone only (no public email)
UPDATE suppliers SET phone = '+91-9840873276',
  updated_at = NOW()
WHERE vendor_code = 'VND-014';
