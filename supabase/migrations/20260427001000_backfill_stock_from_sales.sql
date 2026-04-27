-- ============================================================
-- Backfill stock_items from sales-history goods (2026-04-27)
--
-- Why: GRN POST silently skips lines that don't have a matching
-- stock_items.item_name. If we've sold goods that were never in the
-- stock master, future receipts against those goods get dropped from
-- the inventory ledger. This migration walks every place a sold-good
-- name lives — items catalog, quote lines, proforma lines, order
-- lines — and seeds it into stock_items at quantity=0 if absent.
--
-- Idempotent: NOT EXISTS guards prevent duplicates on re-run.
-- Each INSERT runs sequentially, so later sources see rows seeded by
-- earlier sources.
-- ============================================================

-- ── 1. From items catalog (the sell-side master) ─────────────────────────────
INSERT INTO stock_items (item_name, item_code, hsn_code, unit, quantity, unit_cost, category, is_active, notes)
SELECT
  TRIM(i.name),
  -- Reuse the sales SKU as item_code only if it doesn't already collide with an
  -- existing stock_items.item_code (which is UNIQUE).
  CASE
    WHEN i.sku_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM stock_items s WHERE s.item_code = i.sku_id)
    THEN i.sku_id
    ELSE NULL
  END,
  i.hsn_code,
  COALESCE(NULLIF(TRIM(i.unit), ''), 'pcs'),
  0,
  COALESCE(i.mrp, 0),
  COALESCE(i.category, 'Sold goods'),
  true,
  'Backfilled 2026-04-27 from items catalog (sell-side master)'
FROM items i
WHERE i.item_type = 'goods'
  AND i.name IS NOT NULL
  AND TRIM(i.name) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM stock_items s
    WHERE LOWER(TRIM(s.item_name)) = LOWER(TRIM(i.name))
  );

-- ── 2. From quote line items (JSONB) ─────────────────────────────────────────
INSERT INTO stock_items (item_name, hsn_code, unit, quantity, unit_cost, category, is_active, notes)
SELECT DISTINCT ON (LOWER(TRIM(line->>'name')))
  TRIM(line->>'name'),
  line->>'hsn_code',
  COALESCE(NULLIF(TRIM(line->>'unit'), ''), 'pcs'),
  0,
  COALESCE((line->>'unit_price')::numeric, 0),
  'Sold goods',
  true,
  'Backfilled 2026-04-27 from quote line items'
FROM quotes q, jsonb_array_elements(q.items) AS line
WHERE line->>'name' IS NOT NULL
  AND TRIM(line->>'name') <> ''
  AND COALESCE(line->>'item_type', 'goods') = 'goods'
  AND NOT EXISTS (
    SELECT 1 FROM stock_items s
    WHERE LOWER(TRIM(s.item_name)) = LOWER(TRIM(line->>'name'))
  );

-- ── 3. From proforma invoice line items (JSONB) ──────────────────────────────
INSERT INTO stock_items (item_name, hsn_code, unit, quantity, unit_cost, category, is_active, notes)
SELECT DISTINCT ON (LOWER(TRIM(line->>'name')))
  TRIM(line->>'name'),
  line->>'hsn_code',
  COALESCE(NULLIF(TRIM(line->>'unit'), ''), 'pcs'),
  0,
  COALESCE((line->>'unit_price')::numeric, 0),
  'Sold goods',
  true,
  'Backfilled 2026-04-27 from proforma invoice line items'
FROM proforma_invoices p, jsonb_array_elements(p.items) AS line
WHERE line->>'name' IS NOT NULL
  AND TRIM(line->>'name') <> ''
  AND COALESCE(line->>'item_type', 'goods') = 'goods'
  AND NOT EXISTS (
    SELECT 1 FROM stock_items s
    WHERE LOWER(TRIM(s.item_name)) = LOWER(TRIM(line->>'name'))
  );

-- ── 4. From order line items (JSONB on orders.items where present) ───────────
INSERT INTO stock_items (item_name, hsn_code, unit, quantity, unit_cost, category, is_active, notes)
SELECT DISTINCT ON (LOWER(TRIM(line->>'name')))
  TRIM(line->>'name'),
  line->>'hsn_code',
  COALESCE(NULLIF(TRIM(line->>'unit'), ''), 'pcs'),
  0,
  COALESCE((line->>'unit_price')::numeric, 0),
  'Sold goods',
  true,
  'Backfilled 2026-04-27 from order line items'
FROM orders o, jsonb_array_elements(o.items) AS line
WHERE o.items IS NOT NULL
  AND o.order_type = 'goods'
  AND line->>'name' IS NOT NULL
  AND TRIM(line->>'name') <> ''
  AND COALESCE(line->>'item_type', 'goods') = 'goods'
  AND NOT EXISTS (
    SELECT 1 FROM stock_items s
    WHERE LOWER(TRIM(s.item_name)) = LOWER(TRIM(line->>'name'))
  );

-- Note: stock_items inserted with quantity=0 don't write a stock_movements
-- row, so opening_balance is correctly zero. The first GRN against any of
-- these will post a 'receipt' movement and the recompute trigger updates
-- the on-hand quantity automatically.
