-- ── FIFO stock valuation (cost layers) ───────────────────────────────────────
-- Builds on the stock_movements ledger (20260426150000). Every receipt-style
-- movement creates a "cost layer" — a chunk of inventory at a known unit
-- cost. Every issue consumes from the OLDEST layer first (First-In,
-- First-Out), accumulating a real cost-of-goods-sold (COGS) value that we
-- stamp on the issue movement itself for downstream P&L reporting.
--
-- Result: the value of inventory on hand at any moment = the sum of
-- (remaining_qty × unit_cost) across all layers, not a fictional
-- (current_qty × last_unit_cost). This is what every real ERP does
-- (Tally, Zoho, SAP, NetSuite all use FIFO or Moving Avg by default).

-- 1. Add COGS storage on the issue side of the ledger
ALTER TABLE stock_movements
  ADD COLUMN IF NOT EXISTS cogs_value numeric(14,2);

-- 2. Cost-layers table — one row per receipt or positive adjustment
CREATE TABLE IF NOT EXISTS stock_cost_layers (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_item_id       uuid        NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  source_movement_id  uuid        NOT NULL REFERENCES stock_movements(id) ON DELETE CASCADE,
  original_qty        numeric(14,3) NOT NULL,
  remaining_qty       numeric(14,3) NOT NULL,
  unit_cost           numeric(14,4) NOT NULL,
  created_at          timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_cost_layers_item
  ON stock_cost_layers (stock_item_id, created_at)
  WHERE remaining_qty > 0;

-- 3. The FIFO engine — runs on every stock_movements row.
--    Receipts (qty > 0): create a new layer.
--    Issues (qty < 0):  consume oldest layers, write COGS.
--    Adjustments lean on sign of qty. Opening-balance receipts make a layer.
CREATE OR REPLACE FUNCTION apply_fifo_cost_layers() RETURNS trigger AS $$
DECLARE
  remaining   numeric := abs(NEW.quantity);
  layer       record;
  consumed    numeric;
  cogs_total  numeric := 0;
  fallback_cost numeric;
BEGIN
  IF NEW.quantity > 0 THEN
    -- Receipt-like (or positive adjustment): create a fresh cost layer.
    -- If the caller didn't supply unit_cost (manual adjustment with no cost),
    -- fall back to the last known unit_cost on the item.
    IF NEW.unit_cost IS NULL THEN
      SELECT unit_cost INTO fallback_cost FROM stock_items WHERE id = NEW.stock_item_id;
    END IF;

    INSERT INTO stock_cost_layers (stock_item_id, source_movement_id, original_qty, remaining_qty, unit_cost)
    VALUES (
      NEW.stock_item_id,
      NEW.id,
      NEW.quantity,
      NEW.quantity,
      COALESCE(NEW.unit_cost, fallback_cost, 0)
    );

  ELSIF NEW.quantity < 0 THEN
    -- Issue-like: consume from oldest layers first.
    FOR layer IN
      SELECT id, remaining_qty, unit_cost
        FROM stock_cost_layers
       WHERE stock_item_id = NEW.stock_item_id
         AND remaining_qty > 0
       ORDER BY created_at ASC, id ASC
         FOR UPDATE
    LOOP
      EXIT WHEN remaining <= 0;
      consumed := LEAST(layer.remaining_qty, remaining);
      UPDATE stock_cost_layers
         SET remaining_qty = remaining_qty - consumed
       WHERE id = layer.id;
      cogs_total := cogs_total + (consumed * layer.unit_cost);
      remaining  := remaining - consumed;
    END LOOP;

    -- Layers exhausted but issue still has qty to consume (negative-inventory edge).
    -- Use the movement's unit_cost or the item's last known cost.
    IF remaining > 0 THEN
      IF NEW.unit_cost IS NULL THEN
        SELECT unit_cost INTO fallback_cost FROM stock_items WHERE id = NEW.stock_item_id;
      END IF;
      cogs_total := cogs_total + (remaining * COALESCE(NEW.unit_cost, fallback_cost, 0));
    END IF;

    -- Stamp the COGS on the issue movement so financial reports can pick it up.
    UPDATE stock_movements
       SET cogs_value = round(cogs_total::numeric, 2)
     WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger named "..._zfifo" so it fires AFTER trg_stock_movements_recompute
-- (Postgres orders triggers alphabetically when timing/event match).
DROP TRIGGER IF EXISTS trg_stock_movements_zfifo ON stock_movements;
CREATE TRIGGER trg_stock_movements_zfifo
  AFTER INSERT ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION apply_fifo_cost_layers();

-- 4. Backfill: every existing receipt-style movement should have a cost layer.
--    The previous migration created opening_balance movements but no layers.
--    Idempotent — only inserts where the layer doesn't already exist.
INSERT INTO stock_cost_layers (stock_item_id, source_movement_id, original_qty, remaining_qty, unit_cost)
SELECT
  m.stock_item_id,
  m.id,
  m.quantity,
  m.quantity,
  COALESCE(m.unit_cost, (SELECT unit_cost FROM stock_items WHERE id = m.stock_item_id), 0)
FROM stock_movements m
WHERE m.quantity > 0
  AND NOT EXISTS (
    SELECT 1 FROM stock_cost_layers l WHERE l.source_movement_id = m.id
  );

-- 5. Convenience views for fast reads.
CREATE OR REPLACE VIEW stock_item_valuation AS
SELECT
  si.id                                     AS stock_item_id,
  si.item_code,
  si.item_name,
  si.unit,
  si.quantity                               AS on_hand_qty,
  COALESCE(SUM(l.remaining_qty),         0) AS layered_qty,
  COALESCE(SUM(l.remaining_qty * l.unit_cost), 0) AS fifo_value,
  CASE
    WHEN COALESCE(SUM(l.remaining_qty), 0) > 0
    THEN COALESCE(SUM(l.remaining_qty * l.unit_cost), 0) / SUM(l.remaining_qty)
    ELSE NULL
  END                                       AS weighted_avg_cost
FROM stock_items si
LEFT JOIN stock_cost_layers l
       ON l.stock_item_id = si.id
      AND l.remaining_qty > 0
GROUP BY si.id;
