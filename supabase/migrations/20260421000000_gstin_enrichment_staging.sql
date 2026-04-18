-- GSTIN enrichment: audit trail on recyclers + candidates staging table
-- 1. Audit columns so every gstincheck.co.in call persists its FULL raw response
-- 2. Staging table for unverified candidates harvested from scraping / imports
-- 3. Refresh app_settings credit tracker for the new 2,500-credit / 1-yr budget
--    (bought 2026-04-18: ₹1,500 for 2,500 credits, valid until 2027-04-18)

-- ── 1. Audit columns on recyclers ─────────────────────────────────────────
ALTER TABLE recyclers
  ADD COLUMN IF NOT EXISTS raw_gst_data            JSONB,
  ADD COLUMN IF NOT EXISTS gstin_fetched_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gstin_validation_status TEXT;

COMMENT ON COLUMN recyclers.raw_gst_data            IS 'Full verbatim JSON response from gstincheck.co.in — never store a partial object';
COMMENT ON COLUMN recyclers.gstin_fetched_at        IS 'When the API call that populated raw_gst_data was made';
COMMENT ON COLUMN recyclers.gstin_validation_status IS 'verified | name_mismatch | invalid | failed_lookup';

CREATE INDEX IF NOT EXISTS idx_recyclers_gstin_validation
  ON recyclers (gstin_validation_status)
  WHERE gstin_validation_status IS NOT NULL;

-- ── 2. Candidate staging table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recycler_gstin_candidates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recycler_id         UUID NOT NULL REFERENCES recyclers(id) ON DELETE CASCADE,
  candidate_gstin     TEXT NOT NULL,
  source              TEXT NOT NULL,
  source_url          TEXT,
  source_context      TEXT,
  state_prefix_match  BOOLEAN,
  validated           BOOLEAN NOT NULL DEFAULT FALSE,
  validation_result   TEXT,
  validated_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (recycler_id, candidate_gstin)
);

CREATE INDEX IF NOT EXISTS idx_gstin_candidates_recycler  ON recycler_gstin_candidates (recycler_id);
CREATE INDEX IF NOT EXISTS idx_gstin_candidates_validated ON recycler_gstin_candidates (validated);
CREATE INDEX IF NOT EXISTS idx_gstin_candidates_source    ON recycler_gstin_candidates (source);
CREATE INDEX IF NOT EXISTS idx_gstin_candidates_pending
  ON recycler_gstin_candidates (created_at)
  WHERE validated = FALSE;

COMMENT ON TABLE recycler_gstin_candidates
  IS 'Staging: unverified GSTIN candidates harvested from scraping/imports. Validated ones get promoted to recyclers.gstin.';
COMMENT ON COLUMN recycler_gstin_candidates.source
  IS 'website | google | justdial | indiamart | directory | tally | manual';

-- ── 3. Credit tracker refresh ─────────────────────────────────────────────
UPDATE app_settings SET value = '2500'       WHERE key = 'gstin_credits_total';
UPDATE app_settings SET value = '0'          WHERE key = 'gstin_credits_used';
UPDATE app_settings SET value = '2027-04-18' WHERE key = 'gstin_credits_expiry';

INSERT INTO app_settings (key, value) VALUES
  ('gstin_credits_purchased_at',     '2026-04-18'),
  ('gstin_credits_purchase_price',   '1500'),
  ('gstin_credits_purchase_credits', '2500')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
