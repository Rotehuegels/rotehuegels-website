-- ── Purchase Invoices — Three-way match (PO ↔ GRN ↔ Invoice) ─────────────────
-- Closes the AP-control gap flagged in the procurement audit.
--
-- Each supplier invoice line is matched against:
--   • the PO line it was ordered on (po_items.id)             — for price
--   • the cumulative accepted GRN qty for that PO line         — for quantity
-- Tolerances are configurable via app_settings (defaults: 2% price, 5% qty).
-- Lines outside tolerance flag the invoice as not-matched, which blocks
-- payment until a procurement / finance reviewer either fixes the source
-- documents or explicitly overrides with a note.

CREATE TABLE IF NOT EXISTS purchase_invoices (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no          text        NOT NULL,                              -- supplier's invoice number
  supplier_id         uuid        REFERENCES suppliers(id) ON DELETE SET NULL,
  po_id               uuid        REFERENCES purchase_orders(id) ON DELETE SET NULL,
  invoice_date        date        NOT NULL,
  received_date       date        DEFAULT CURRENT_DATE,
  due_date            date,
  -- Amounts (from supplier invoice)
  subtotal            numeric(14,2) NOT NULL DEFAULT 0,
  taxable_value       numeric(14,2) NOT NULL DEFAULT 0,
  igst_amount         numeric(14,2) NOT NULL DEFAULT 0,
  cgst_amount         numeric(14,2) NOT NULL DEFAULT 0,
  sgst_amount         numeric(14,2) NOT NULL DEFAULT 0,
  total_amount        numeric(14,2) NOT NULL DEFAULT 0,
  -- Match status (rolled up from line-level status)
  match_status        text        NOT NULL DEFAULT 'pending'
                        CHECK (match_status IN (
                          'pending','matched','price_variance','qty_variance',
                          'over_billed','under_billed','unmatched','overridden')),
  match_notes         text,
  -- Approval / payment block
  approved_by_email   text,
  approved_at         timestamptz,
  payment_status      text        NOT NULL DEFAULT 'unpaid'
                        CHECK (payment_status IN ('unpaid','partial','paid','on_hold')),
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supplier_id, invoice_no)                                       -- prevent duplicate booking
);

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_po          ON purchase_invoices (po_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier    ON purchase_invoices (supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_match       ON purchase_invoices (match_status);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_payment     ON purchase_invoices (payment_status);

CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id          uuid        NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  po_item_id          uuid        REFERENCES po_items(id) ON DELETE SET NULL,
  description         text        NOT NULL,
  hsn_code            text,
  quantity            numeric(14,3) NOT NULL,
  unit                text        DEFAULT 'pcs',
  unit_price          numeric(14,2) NOT NULL,
  taxable_amount      numeric(14,2) NOT NULL,
  gst_rate            numeric(5,2)  DEFAULT 18,
  gst_amount          numeric(14,2) DEFAULT 0,
  total               numeric(14,2) NOT NULL,
  -- Per-line match
  match_status        text        DEFAULT 'pending'
                        CHECK (match_status IN (
                          'pending','matched','price_variance','qty_variance',
                          'over_billed','unmatched')),
  variance_price_pct  numeric(7,3),                                      -- vs po_items.unit_price
  variance_qty_pct    numeric(7,3),                                      -- vs cumulative accepted GRN qty
  matched_grn_qty     numeric(14,3) DEFAULT 0,                           -- snapshot at match time
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pi_items_invoice ON purchase_invoice_items (invoice_id);
CREATE INDEX IF NOT EXISTS idx_pi_items_po_item ON purchase_invoice_items (po_item_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION touch_purchase_invoices_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_purchase_invoices_updated_at ON purchase_invoices;
CREATE TRIGGER trg_purchase_invoices_updated_at
  BEFORE UPDATE ON purchase_invoices
  FOR EACH ROW
  EXECUTE FUNCTION touch_purchase_invoices_updated_at();

-- Default tolerances (app_settings)
INSERT INTO app_settings (key, value) VALUES
  ('ap.price_tolerance_pct', '2'),
  ('ap.qty_tolerance_pct',   '5')
ON CONFLICT (key) DO NOTHING;
