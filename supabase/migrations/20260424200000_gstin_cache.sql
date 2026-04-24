-- GSTIN lookup cache: the single source of truth for every gstincheck.co.in
-- response we ever receive. Enforces the rule that a credit is spent at most
-- once per GSTIN — every subsequent caller reads from this table.
--
-- Gateway flow (enforced in lib/gstin/gateway.ts):
--   1. Caller asks for gstin X.
--   2. Gateway reads gstin_lookup_cache. If hit → bump lookup_count, return.
--   3. On miss → call vendor → persist_gstin_lookup() writes raw_response AND
--      increments app_settings.gstin_credits_used in one transaction.
--
-- Denormalised columns exist for quick filters (status=Active, entity=Pvt Ltd)
-- without parsing jsonb on every read. The authoritative copy is raw_response.

CREATE TABLE IF NOT EXISTS gstin_lookup_cache (
  gstin            TEXT PRIMARY KEY,
  raw_response     JSONB NOT NULL,
  fetched_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lookup_count     INTEGER NOT NULL DEFAULT 1,
  legal_name       TEXT,
  trade_name       TEXT,
  gst_status       TEXT,
  entity_type      TEXT,
  state_code       TEXT,
  pincode          TEXT
);

CREATE INDEX IF NOT EXISTS idx_gstin_cache_fetched ON gstin_lookup_cache (fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_gstin_cache_status  ON gstin_lookup_cache (gst_status) WHERE gst_status IS NOT NULL;

COMMENT ON TABLE  gstin_lookup_cache IS
  'Single source of truth for every gstincheck.co.in response. Every call is persisted here; new callers read this table before spending a credit.';
COMMENT ON COLUMN gstin_lookup_cache.raw_response IS
  'Full verbatim JSON response from gstincheck.co.in — never store a partial object. Denormalised columns below are a projection.';

-- ── persist_gstin_lookup: atomic vendor-write + credit-increment ────────────
CREATE OR REPLACE FUNCTION persist_gstin_lookup(p_gstin TEXT, p_response JSONB)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
BEGIN
  INSERT INTO gstin_lookup_cache (
    gstin, raw_response, fetched_at, last_accessed_at, lookup_count,
    legal_name, trade_name, gst_status, entity_type, state_code, pincode
  ) VALUES (
    p_gstin,
    p_response,
    v_now,
    v_now,
    1,
    p_response->'data'->>'lgnm',
    p_response->'data'->>'tradeNam',
    p_response->'data'->>'sts',
    p_response->'data'->>'ctb',
    p_response->'data'->'pradr'->'addr'->>'stcd',
    p_response->'data'->'pradr'->'addr'->>'pncd'
  )
  ON CONFLICT (gstin) DO UPDATE SET
    raw_response     = EXCLUDED.raw_response,
    fetched_at       = v_now,
    last_accessed_at = v_now,
    lookup_count     = gstin_lookup_cache.lookup_count + 1,
    legal_name       = EXCLUDED.legal_name,
    trade_name       = EXCLUDED.trade_name,
    gst_status       = EXCLUDED.gst_status,
    entity_type      = EXCLUDED.entity_type,
    state_code       = EXCLUDED.state_code,
    pincode          = EXCLUDED.pincode;

  UPDATE app_settings
     SET value = (COALESCE(value::int, 0) + 1)::text
   WHERE key  = 'gstin_credits_used';

  RETURN v_now;
END;
$$;

COMMENT ON FUNCTION persist_gstin_lookup IS
  'Atomic: writes the verbatim vendor response into gstin_lookup_cache AND increments gstin_credits_used. Either both succeed or both roll back.';

-- ── bump_gstin_cache_hit: free cache-read bookkeeping ───────────────────────
CREATE OR REPLACE FUNCTION bump_gstin_cache_hit(p_gstin TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE gstin_lookup_cache
     SET lookup_count     = lookup_count + 1,
         last_accessed_at = now()
   WHERE gstin = p_gstin;
END;
$$;

COMMENT ON FUNCTION bump_gstin_cache_hit IS
  'Called on every cache hit to track reuse. Does not touch credit counter (free).';

-- ── Backfill: seed the cache from existing recyclers.raw_gst_data ───────────
-- Without this, all previously enriched GSTINs would look like fresh misses
-- and the gateway would respend a credit. The backfill carries over the full
-- verbatim response and the fetch timestamp we already have on the row.
INSERT INTO gstin_lookup_cache (
  gstin, raw_response, fetched_at,
  legal_name, trade_name, gst_status, entity_type, state_code, pincode
)
SELECT
  gstin,
  raw_gst_data,
  COALESCE(gstin_fetched_at, now()),
  raw_gst_data->'data'->>'lgnm',
  raw_gst_data->'data'->>'tradeNam',
  raw_gst_data->'data'->>'sts',
  raw_gst_data->'data'->>'ctb',
  raw_gst_data->'data'->'pradr'->'addr'->>'stcd',
  raw_gst_data->'data'->'pradr'->'addr'->>'pncd'
FROM recyclers
WHERE raw_gst_data IS NOT NULL
  AND gstin IS NOT NULL
  AND gstin <> ''
ON CONFLICT (gstin) DO NOTHING;
