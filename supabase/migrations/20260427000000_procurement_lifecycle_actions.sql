-- ============================================================
-- Procurement lifecycle actions (2026-04-27)
--
--   1. PO closure / cancellation reason capture
--   2. GRN 'voided' status (for create-time mistakes — distinct from inspection-rejected)
--   3. is_active flag on master data (customers, suppliers, stock_items)
--      so soft-delete replaces the current hard DELETE on these tables.
-- ============================================================

-- ── 1. Purchase Orders ──────────────────────────────────────────────────────
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS closure_type        TEXT,                        -- 'full' | 'short' | NULL
  ADD COLUMN IF NOT EXISTS closure_reason      TEXT,                        -- mandatory when status='closed' & closure_type='short'
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;                        -- mandatory when status='cancelled'

ALTER TABLE purchase_orders
  DROP CONSTRAINT IF EXISTS purchase_orders_closure_type_check;
ALTER TABLE purchase_orders
  ADD CONSTRAINT purchase_orders_closure_type_check
  CHECK (closure_type IS NULL OR closure_type IN ('full', 'short'));

-- ── 2. Goods Receipt Notes — extend status enum with 'voided' ──────────────
ALTER TABLE goods_receipt_notes
  DROP CONSTRAINT IF EXISTS goods_receipt_notes_status_check;
ALTER TABLE goods_receipt_notes
  ADD CONSTRAINT goods_receipt_notes_status_check
  CHECK (status IN ('pending', 'inspected', 'accepted', 'rejected', 'partial', 'voided'));

-- Capture *why* a GRN was voided / rejected so the audit trail is self-contained
ALTER TABLE goods_receipt_notes
  ADD COLUMN IF NOT EXISTS void_reason     TEXT,                            -- when status='voided'
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;                           -- when status='rejected' (was inspection_notes; keep both)

-- ── 3. Master-data soft-delete ─────────────────────────────────────────────
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE stock_items
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_customers_active   ON customers   (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_suppliers_active   ON suppliers   (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_stock_items_active ON stock_items (is_active) WHERE is_active = true;
