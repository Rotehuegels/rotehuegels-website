-- ============================================================
-- Stock backfill cleanup (2026-04-27)
--
-- The 2026-04-27 backfill (20260427001000) walked quote/PI/order
-- JSONB items and seeded any "goods" line into stock_items. Because
-- those JSONB lines often omit item_type, our COALESCE defaulted to
-- 'goods' and a number of service / charge / waiver rows slipped in
-- (door delivery, T&P sensor installation, freight, discount, labour,
-- etc.) — none of which are physical inventory.
--
-- This migration:
--   1. Removes service-like / waiver rows the backfill just created.
--      Limited to backfilled rows (identified via the notes prefix)
--      so legitimate pre-existing stock_items can't be hit.
--   2. Auto-generates STK-NNNN item_code for any backfilled row
--      that's still missing one, sequentially from MAX(existing).
--   3. Assigns a category to backfilled rows based on a name
--      keyword heuristic — anodes / cathodes / sensors / electrical /
--      plumbing / chemicals / consumables / equipment.
-- ============================================================

-- ── 1. Remove services and charges that aren't real inventory ───────────────
-- Pattern matches across both the item_name and the description so a row
-- like "Door delivery — instrumentation" is caught even if its name is
-- terse. Case-insensitive.
DELETE FROM stock_items
WHERE notes LIKE 'Backfilled 2026-04-27%'
  AND (
       item_name ~* '(delivery|installation|freight|cartage|labour|labor|service charge|on-?site|man.?day|man.?days|inspection.charges|loading|unloading|transport|shipping)'
    OR item_name ~* '(discount|waiver|rate difference|round.?off|adjustment|deduction)'
    OR item_name ~* '\b(charges?|fees?)\b.*$'      -- standalone "charges" / "fees" lines
    OR description ~* '(delivery|installation|freight|labour|service charge)'
  );

-- ── 2. Generate sequential item_codes for backfilled rows missing them ──────
-- Uses a serial counter starting from one above the current max numeric
-- suffix. Idempotent — only touches rows where item_code IS NULL.
DO $$
DECLARE
  next_n int;
  r RECORD;
BEGIN
  -- Find the largest existing STK-NNNN suffix; default to 0.
  SELECT COALESCE(MAX((regexp_match(item_code, '^STK-(\d+)$'))[1]::int), 0)
    INTO next_n
    FROM stock_items
    WHERE item_code ~ '^STK-\d+$';

  FOR r IN
    SELECT id FROM stock_items
     WHERE item_code IS NULL
       AND notes LIKE 'Backfilled 2026-04-27%'
     ORDER BY created_at, item_name
  LOOP
    next_n := next_n + 1;
    UPDATE stock_items
       SET item_code = 'STK-' || lpad(next_n::text, 4, '0')
     WHERE id = r.id;
  END LOOP;
END $$;

-- ── 3. Classify backfilled rows by keyword heuristic ────────────────────────
-- Only sets category when it's currently 'Sold goods' (the placeholder we
-- inserted) or NULL — preserves any human-set category.
UPDATE stock_items SET category = 'Electrodes — Anodes'
 WHERE (category IS NULL OR category = 'Sold goods')
   AND notes LIKE 'Backfilled 2026-04-27%'
   AND item_name ~* '\banode\b';

UPDATE stock_items SET category = 'Electrodes — Cathodes'
 WHERE (category IS NULL OR category = 'Sold goods')
   AND notes LIKE 'Backfilled 2026-04-27%'
   AND item_name ~* '\bcathode\b';

UPDATE stock_items SET category = 'Busbars & Conductors'
 WHERE (category IS NULL OR category = 'Sold goods')
   AND notes LIKE 'Backfilled 2026-04-27%'
   AND item_name ~* '(busbar|bus bar|copper bar|conductor)';

UPDATE stock_items SET category = 'Sensors & Instrumentation'
 WHERE (category IS NULL OR category = 'Sold goods')
   AND notes LIKE 'Backfilled 2026-04-27%'
   AND item_name ~* '(sensor|transmitter|gauge|meter|level indicator|float|rotameter|ph probe|conductivity|orp)';

UPDATE stock_items SET category = 'Sensor Housings & Enclosures'
 WHERE (category IS NULL OR category = 'Sold goods')
   AND notes LIKE 'Backfilled 2026-04-27%'
   AND item_name ~* '(housing|enclosure|junction box|panel box|cabinet)';

UPDATE stock_items SET category = 'Pumps & Fluid Handling'
 WHERE (category IS NULL OR category = 'Sold goods')
   AND notes LIKE 'Backfilled 2026-04-27%'
   AND item_name ~* '(pump|valve|piping|fitting|hose|tubing)';

UPDATE stock_items SET category = 'Tanks & Vessels'
 WHERE (category IS NULL OR category = 'Sold goods')
   AND notes LIKE 'Backfilled 2026-04-27%'
   AND item_name ~* '(tank|vessel|reactor|cell|drum)';

UPDATE stock_items SET category = 'Plates & Sheets'
 WHERE (category IS NULL OR category = 'Sold goods')
   AND notes LIKE 'Backfilled 2026-04-27%'
   AND item_name ~* '(\bsheet\b|\bplate\b|pp sheet|hdpe sheet)';

UPDATE stock_items SET category = 'Electrical & Cabling'
 WHERE (category IS NULL OR category = 'Sold goods')
   AND notes LIKE 'Backfilled 2026-04-27%'
   AND item_name ~* '(cable|wire|switch|breaker|relay|contactor|terminal block|lug|conduit)';

UPDATE stock_items SET category = 'Insulation & Liners'
 WHERE (category IS NULL OR category = 'Sold goods')
   AND notes LIKE 'Backfilled 2026-04-27%'
   AND item_name ~* '(insulation|rubber roll|liner|tile|lining|gasket|seal)';

UPDATE stock_items SET category = 'Chemicals & Reagents'
 WHERE (category IS NULL OR category = 'Sold goods')
   AND notes LIKE 'Backfilled 2026-04-27%'
   AND item_name ~* '(acid|sulphuric|nitric|caustic|naoh|reagent|standard solution|electrolyte)';

UPDATE stock_items SET category = 'Lab Consumables'
 WHERE (category IS NULL OR category = 'Sold goods')
   AND notes LIKE 'Backfilled 2026-04-27%'
   AND item_name ~* '(filter paper|crucible|beaker|pipette|tube|glassware|reagent bottle)';

UPDATE stock_items SET category = 'Hardware & Fasteners'
 WHERE (category IS NULL OR category = 'Sold goods')
   AND notes LIKE 'Backfilled 2026-04-27%'
   AND item_name ~* '(bolt|nut|screw|washer|fastener|bracket|hanger|clamp)';

-- Anything still on the placeholder gets a generic "Equipment & Accessories"
UPDATE stock_items SET category = 'Equipment & Accessories'
 WHERE category = 'Sold goods'
   AND notes LIKE 'Backfilled 2026-04-27%';

-- ── 4. Suppress low-stock alerts for backfilled rows ────────────────────────
-- The stock_items schema defaults reorder_level=5 and reorder_qty=10, so
-- every backfilled row currently sits below reorder and would trigger the
-- daily auto-indent + low-stock-alert crons. None of these items have an
-- agreed minimum yet, so NULL out the thresholds — alerts will resume only
-- when someone explicitly sets them via the stock detail page.
UPDATE stock_items
   SET reorder_level = NULL,
       reorder_qty   = NULL
 WHERE notes LIKE 'Backfilled 2026-04-27%'
   AND quantity = 0;

