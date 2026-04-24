-- Facility code — phase 1
--
-- Replace source-flavoured recycler_code (MRAI-TN-007, CPCB-MH-128, …) as the
-- primary human-facing reference with a neutral, source-independent scheme:
--     {PRIMARY_CATEGORY}-{STATE_2}-{SEQ5}   e.g. EW-TN-00007
--
-- Contract:
--   * recycler_code stays on the table for internal back-refs and legacy FKs.
--     It is no longer the human-facing identifier — facility_code is.
--   * primary_category is one of 8 values, derived once from waste_type and
--     locked via a CHECK constraint.
--   * facility_code is globally unique, allocated per (category, state_2).
--   * UUID id is still the FK target everywhere, so no relational rewrites
--     are needed (see audit in scripts/audit-recycler-refactor.mjs).
--
-- This migration is phase 1: add columns + backfill the existing 1,370 rows.
-- Phase 2 will populate the companies table and consolidate multi-unit CIN
-- majors (Hindalco, HZL, HCL, Vedanta, NALCO, Cero, IREL).

BEGIN;

-- ── 1. Schema ───────────────────────────────────────────────────────────────
ALTER TABLE recyclers
  ADD COLUMN IF NOT EXISTS primary_category TEXT
    CHECK (primary_category IN ('EW','NFM','ZN','PM','EV','BM','BAT','OTHER')),
  ADD COLUMN IF NOT EXISTS facility_code TEXT;

COMMENT ON COLUMN recyclers.primary_category IS
  'Neutral taxonomy — EW (e-waste), NFM (non-ferrous metals / hazardous), ZN (zinc-dross), PM (primary metal producer), EV (EV OEM), BM (battery materials: black-mass / critical-minerals), BAT (battery / pack / cell), OTHER.';
COMMENT ON COLUMN recyclers.facility_code IS
  'Source-independent, unique. Format {CATEGORY}-{STATE_2}-{SEQ5}. Human-facing reference. recycler_code is kept as a legacy internal alias.';

-- ── 2. Backfill primary_category from waste_type ────────────────────────────
UPDATE recyclers SET primary_category =
  CASE
    WHEN waste_type = 'e-waste'                           THEN 'EW'
    WHEN waste_type = 'hazardous'                         THEN 'NFM'
    WHEN waste_type = 'zinc-dross'                        THEN 'ZN'
    WHEN waste_type = 'primary-metal'                     THEN 'PM'
    WHEN waste_type = 'ev-oem'                            THEN 'EV'
    WHEN waste_type IN ('black-mass','critical-minerals') THEN 'BM'
    WHEN waste_type IN ('battery','battery-pack','cell-maker') THEN 'BAT'
    ELSE 'OTHER'
  END
WHERE primary_category IS NULL;

-- ── 3. State-name → 2-letter postal code helper ─────────────────────────────
-- Immutable so it can be used inside a materialised view / generated column
-- in phase 2 if needed. Returns NULL for unknown states; the caller decides.
CREATE OR REPLACE FUNCTION state_code_2(state_name TEXT)
RETURNS TEXT IMMUTABLE LANGUAGE plpgsql AS $$
BEGIN
  RETURN CASE state_name
    WHEN 'Andhra Pradesh'              THEN 'AP'
    WHEN 'Arunachal Pradesh'           THEN 'AR'
    WHEN 'Assam'                       THEN 'AS'
    WHEN 'Bihar'                       THEN 'BR'
    WHEN 'Chhattisgarh'                THEN 'CG'
    WHEN 'Goa'                         THEN 'GA'
    WHEN 'Gujarat'                     THEN 'GJ'
    WHEN 'Haryana'                     THEN 'HR'
    WHEN 'Himachal Pradesh'            THEN 'HP'
    WHEN 'Jammu & Kashmir'             THEN 'JK'
    WHEN 'Jharkhand'                   THEN 'JH'
    WHEN 'Karnataka'                   THEN 'KA'
    WHEN 'Kerala'                      THEN 'KL'
    WHEN 'Madhya Pradesh'              THEN 'MP'
    WHEN 'Maharashtra'                 THEN 'MH'
    WHEN 'Manipur'                     THEN 'MN'
    WHEN 'Meghalaya'                   THEN 'ML'
    WHEN 'Mizoram'                     THEN 'MZ'
    WHEN 'Nagaland'                    THEN 'NL'
    WHEN 'Odisha'                      THEN 'OD'
    WHEN 'Punjab'                      THEN 'PB'
    WHEN 'Rajasthan'                   THEN 'RJ'
    WHEN 'Sikkim'                      THEN 'SK'
    WHEN 'Tamil Nadu'                  THEN 'TN'
    WHEN 'Telangana'                   THEN 'TG'
    WHEN 'Tripura'                     THEN 'TR'
    WHEN 'Uttar Pradesh'               THEN 'UP'
    WHEN 'Uttarakhand'                 THEN 'UK'
    WHEN 'West Bengal'                 THEN 'WB'
    WHEN 'Delhi'                       THEN 'DL'
    WHEN 'Chandigarh'                  THEN 'CH'
    WHEN 'Puducherry'                  THEN 'PY'
    WHEN 'Andaman & Nicobar Islands'   THEN 'AN'
    WHEN 'Ladakh'                      THEN 'LA'
    WHEN 'Lakshadweep'                 THEN 'LD'
    WHEN 'Dadra & Nagar Haveli'        THEN 'DN'
    WHEN 'Daman & Diu'                 THEN 'DD'
    ELSE NULL
  END;
END;
$$;

-- ── 4. Backfill facility_code per (category, state_2) sequence ──────────────
-- ORDER BY created_at so earlier rows get lower numbers — stable, replayable.
WITH numbered AS (
  SELECT
    id,
    primary_category,
    state_code_2(state) AS st2,
    ROW_NUMBER() OVER (
      PARTITION BY primary_category, state_code_2(state)
      ORDER BY created_at NULLS LAST, recycler_code
    ) AS seq
  FROM recyclers
  WHERE primary_category IS NOT NULL
    AND state IS NOT NULL
    AND state_code_2(state) IS NOT NULL
)
UPDATE recyclers r
SET facility_code = n.primary_category || '-' || n.st2 || '-' || LPAD(n.seq::text, 5, '0')
FROM numbered n
WHERE r.id = n.id
  AND r.facility_code IS NULL;

-- ── 5. Uniqueness guard ─────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS uniq_recyclers_facility_code
  ON recyclers (facility_code) WHERE facility_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recyclers_primary_category
  ON recyclers (primary_category) WHERE primary_category IS NOT NULL;

-- ── 6. Allocator for new rows (used by phase 2 trigger, safe to install now) ─
CREATE OR REPLACE FUNCTION next_facility_code(p_category TEXT, p_state_2 TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_max INT;
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(facility_code FROM '\d+$')::int), 0)
    INTO v_max
  FROM recyclers
  WHERE facility_code LIKE p_category || '-' || p_state_2 || '-%';
  RETURN p_category || '-' || p_state_2 || '-' || LPAD((v_max + 1)::text, 5, '0');
END;
$$;

COMMENT ON FUNCTION next_facility_code IS
  'Allocate the next facility_code in (category, state_2) sequence. Phase-2 trigger will call this on INSERT when facility_code is NULL.';

COMMIT;
