-- Phase 2 trigger: auto-allocate facility_code on every new recyclers row.
--
-- Phase 1 added the facility_code column and backfilled all 1,370 existing
-- rows. Phase 2 (this migration + scripts/backfill-companies-phase2.mjs)
-- ensures every row links to a companies row and installs this trigger so
-- inserts going forward keep the facility_code scheme consistent.
--
-- Trigger logic:
--   1. If facility_code is supplied explicitly, leave it.
--   2. Else, derive primary_category from waste_type (same CASE as phase 1).
--   3. Compute state_code_2(state). If neither category nor state code can
--      be derived, leave facility_code NULL — operator must fix the row.
--   4. Else, allocate next_facility_code(category, state_2).

BEGIN;

CREATE OR REPLACE FUNCTION recyclers_assign_facility_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_cat   TEXT;
  v_state TEXT;
BEGIN
  IF NEW.facility_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Derive primary_category if not already set
  IF NEW.primary_category IS NULL THEN
    NEW.primary_category := CASE
      WHEN NEW.waste_type = 'e-waste'                                THEN 'EW'
      WHEN NEW.waste_type = 'hazardous'                              THEN 'NFM'
      WHEN NEW.waste_type = 'zinc-dross'                             THEN 'ZN'
      WHEN NEW.waste_type = 'primary-metal'                          THEN 'PM'
      WHEN NEW.waste_type = 'ev-oem'                                 THEN 'EV'
      WHEN NEW.waste_type IN ('black-mass','critical-minerals')      THEN 'BM'
      WHEN NEW.waste_type IN ('battery','battery-pack','cell-maker') THEN 'BAT'
      ELSE 'OTHER'
    END;
  END IF;

  v_cat   := NEW.primary_category;
  v_state := state_code_2(NEW.state);

  IF v_cat IS NOT NULL AND v_state IS NOT NULL THEN
    NEW.facility_code := next_facility_code(v_cat, v_state);
  END IF;
  -- else leave NULL — admin will fix and re-trigger via UPDATE

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recyclers_facility_code ON recyclers;

CREATE TRIGGER trg_recyclers_facility_code
  BEFORE INSERT ON recyclers
  FOR EACH ROW
  EXECUTE FUNCTION recyclers_assign_facility_code();

COMMENT ON TRIGGER trg_recyclers_facility_code ON recyclers IS
  'Auto-allocates facility_code = {primary_category}-{state_2}-{seq5} for new rows. Skips if facility_code is provided. Leaves NULL when category or state cannot be derived.';

COMMIT;

-- Smoke test (commented out — uncomment locally to verify):
--   INSERT INTO recyclers (recycler_code, company_name, state, waste_type, facility_type, is_active, is_verified)
--   VALUES ('TEST-001', 'Smoke Test Co.', 'Tamil Nadu', 'e-waste', 'recycler', false, false);
--   SELECT facility_code, primary_category FROM recyclers WHERE recycler_code = 'TEST-001';
--   DELETE FROM recyclers WHERE recycler_code = 'TEST-001';
