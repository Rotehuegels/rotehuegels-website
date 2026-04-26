-- ── Stock movements ledger (event-sourced inventory) ────────────────────────
-- Replaces the "stock_items.quantity is a single number" design with a true
-- event ledger. Every receive / issue / adjustment / transfer / return is
-- a row in stock_movements. stock_items.quantity becomes a materialised
-- view of SUM(stock_movements.quantity) per item, kept up to date by a
-- trigger on stock_movements.
--
-- Why: enables FIFO/Avg costing later, audit trail of who-moved-what-when,
-- accurate balance-sheet inventory value, scrap/return tracking. Without
-- this every direct UPDATE on stock_items.quantity is silent and lossy.

CREATE TABLE IF NOT EXISTS stock_movements (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_item_id   uuid        NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  movement_type   text        NOT NULL
                    CHECK (movement_type IN (
                      'opening_balance',  -- backfill / initial seed
                      'receipt',          -- from GRN, return-from-customer, transfer-in
                      'issue',            -- to sales order, production, scrap, transfer-out
                      'adjustment',       -- manual correction (count discrepancy, damage, etc)
                      'transfer'          -- inter-warehouse (paired entries +/-)
                    )),
  quantity        numeric(14,3) NOT NULL,                                -- signed: +receive, -issue
  unit_cost       numeric(14,4),                                         -- cost of THIS movement (FIFO basis)
  -- Source linkage (polymorphic)
  source_type     text        CHECK (source_type IN ('grn', 'order', 'manual', 'opening_balance', 'transfer')),
  source_id       uuid,
  -- Audit
  warehouse_location text     DEFAULT 'Main Store',
  created_by_email   text,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_item    ON stock_movements (stock_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_source  ON stock_movements (source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type    ON stock_movements (movement_type);

-- ── Trigger: keep stock_items.quantity in sync with the ledger ───────────────
-- Fires on every insert / update / delete of stock_movements. Recomputes the
-- affected item's total quantity from the sum of its movements.

CREATE OR REPLACE FUNCTION recompute_stock_quantity() RETURNS trigger AS $$
DECLARE
  affected uuid;
BEGIN
  -- Pick the item id from NEW or OLD (handles all three trigger ops)
  affected := COALESCE(NEW.stock_item_id, OLD.stock_item_id);
  UPDATE stock_items
     SET quantity   = COALESCE((SELECT SUM(quantity) FROM stock_movements WHERE stock_item_id = affected), 0),
         updated_at = now()
   WHERE id = affected;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stock_movements_recompute ON stock_movements;
CREATE TRIGGER trg_stock_movements_recompute
  AFTER INSERT OR UPDATE OR DELETE ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION recompute_stock_quantity();

-- ── Backfill: one opening_balance movement per existing stock_item ────────────
-- Skipped if the item already has a movement in the ledger (idempotent re-runs).

INSERT INTO stock_movements (stock_item_id, movement_type, quantity, unit_cost, source_type, notes)
SELECT s.id,
       'opening_balance',
       COALESCE(s.quantity, 0),
       s.unit_cost,
       'opening_balance',
       'Auto-backfilled on ledger introduction (' || to_char(now(), 'YYYY-MM-DD') || ').'
FROM stock_items s
WHERE NOT EXISTS (
  SELECT 1 FROM stock_movements m WHERE m.stock_item_id = s.id
);

-- ── Replace the legacy increment_stock_quantity RPC with a ledger-aware one ──
-- The GRN route calls this; old version (if it exists) silently mutated
-- stock_items.quantity. New version inserts a 'receipt' movement and lets
-- the trigger recompute. Matched by item_name (legacy contract).

CREATE OR REPLACE FUNCTION increment_stock_quantity(p_item_name text, p_qty numeric)
RETURNS void AS $$
DECLARE
  target_id uuid;
BEGIN
  SELECT id INTO target_id FROM stock_items WHERE item_name = p_item_name LIMIT 1;
  IF target_id IS NULL THEN RETURN; END IF;
  INSERT INTO stock_movements (stock_item_id, movement_type, quantity, source_type, notes)
  VALUES (target_id, 'receipt', p_qty, 'manual', 'Legacy increment_stock_quantity call');
END;
$$ LANGUAGE plpgsql;

-- ── Helper RPC for manual adjustments (used by /api/accounts/stock/movements) ─

CREATE OR REPLACE FUNCTION record_stock_movement(
  p_stock_item_id      uuid,
  p_movement_type      text,
  p_quantity           numeric,
  p_unit_cost          numeric DEFAULT NULL,
  p_source_type        text    DEFAULT 'manual',
  p_source_id          uuid    DEFAULT NULL,
  p_warehouse_location text    DEFAULT 'Main Store',
  p_created_by_email   text    DEFAULT NULL,
  p_notes              text    DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO stock_movements (
    stock_item_id, movement_type, quantity, unit_cost,
    source_type, source_id, warehouse_location, created_by_email, notes
  ) VALUES (
    p_stock_item_id, p_movement_type, p_quantity, p_unit_cost,
    p_source_type, p_source_id, p_warehouse_location, p_created_by_email, p_notes
  )
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;
