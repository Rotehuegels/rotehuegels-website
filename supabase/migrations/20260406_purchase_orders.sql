-- ============================================================
-- Purchase Orders Module
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Purchase Orders ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_no               TEXT UNIQUE NOT NULL,               -- PO-2026-001
  supplier_id         UUID REFERENCES suppliers(id),
  po_date             DATE NOT NULL,
  expected_delivery   DATE,
  status              TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','sent','acknowledged','partial','received','closed','cancelled')),
  supplier_ref        TEXT,                               -- supplier's quote/invoice ref
  linked_order_id     UUID REFERENCES orders(id),         -- which sales order this PO is for
  -- Addresses (JSONB: {line1, line2, city, state, pincode})
  bill_to             JSONB NOT NULL DEFAULT '{}',
  ship_to             JSONB,
  -- Financials
  subtotal            NUMERIC(14,2) NOT NULL DEFAULT 0,
  taxable_value       NUMERIC(14,2) NOT NULL DEFAULT 0,
  igst_amount         NUMERIC(14,2) NOT NULL DEFAULT 0,
  cgst_amount         NUMERIC(14,2) NOT NULL DEFAULT 0,
  sgst_amount         NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_amount        NUMERIC(14,2) NOT NULL DEFAULT 0,
  -- Notes
  notes               TEXT,
  terms               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── PO Line Items ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS po_items (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id               UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  sl_no               INTEGER NOT NULL,
  description         TEXT NOT NULL,
  hsn_code            TEXT,
  unit                TEXT NOT NULL DEFAULT 'pcs',
  quantity            NUMERIC(14,3) NOT NULL,
  unit_price          NUMERIC(14,2) NOT NULL,
  taxable_amount      NUMERIC(14,2) NOT NULL,
  gst_rate            NUMERIC(5,2) NOT NULL DEFAULT 18,
  igst_rate           NUMERIC(5,2) NOT NULL DEFAULT 0,
  cgst_rate           NUMERIC(5,2) NOT NULL DEFAULT 0,
  sgst_rate           NUMERIC(5,2) NOT NULL DEFAULT 0,
  gst_amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
  total               NUMERIC(14,2) NOT NULL,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── PO Payments (advances, milestones, final) ─────────────────
CREATE TABLE IF NOT EXISTS po_payments (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id               UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  payment_date        DATE NOT NULL,
  amount              NUMERIC(14,2) NOT NULL,
  payment_type        TEXT NOT NULL DEFAULT 'advance'
                      CHECK (payment_type IN ('advance','milestone','balance','final')),
  reference           TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_po_items_po_id      ON po_items(po_id);
CREATE INDEX IF NOT EXISTS idx_po_payments_po_id   ON po_payments(po_id);
CREATE INDEX IF NOT EXISTS idx_po_supplier         ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_linked_order     ON purchase_orders(linked_order_id);
