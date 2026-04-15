-- ── Goods Receipt Notes (GRN) ────────────────────────────────────────────────
-- Tracks physical receipt of goods against Purchase Orders
CREATE TABLE IF NOT EXISTS goods_receipt_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_no TEXT UNIQUE NOT NULL,
  po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_by TEXT,
  warehouse_location TEXT DEFAULT 'Main Store',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'inspected', 'accepted', 'rejected', 'partial')),
  inspection_notes TEXT,
  delivery_note_no TEXT,
  vehicle_no TEXT,
  transporter TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grn_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_id UUID NOT NULL REFERENCES goods_receipt_notes(id) ON DELETE CASCADE,
  po_item_id UUID REFERENCES po_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  hsn_code TEXT,
  ordered_qty NUMERIC NOT NULL DEFAULT 0,
  received_qty NUMERIC NOT NULL DEFAULT 0,
  accepted_qty NUMERIC NOT NULL DEFAULT 0,
  rejected_qty NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'NOS',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Budget Tracking ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year TEXT NOT NULL,             -- e.g., '2025-26'
  department TEXT NOT NULL,              -- e.g., 'Operations', 'IT', 'Sales'
  category TEXT NOT NULL DEFAULT 'operating', -- 'operating', 'capital', 'project'
  budget_amount NUMERIC NOT NULL DEFAULT 0,
  actual_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(fiscal_year, department, category)
);

-- ── Fixed Assets Register ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fixed_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'furniture', -- furniture, equipment, vehicle, computer, building, land, other
  location TEXT,
  department TEXT,
  purchase_date DATE,
  purchase_value NUMERIC NOT NULL DEFAULT 0,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  invoice_ref TEXT,
  useful_life_years NUMERIC DEFAULT 5,
  depreciation_method TEXT DEFAULT 'straight_line', -- straight_line, wdv (written down value)
  depreciation_rate NUMERIC DEFAULT 20,  -- percentage per year
  accumulated_depreciation NUMERIC DEFAULT 0,
  current_book_value NUMERIC NOT NULL DEFAULT 0,
  salvage_value NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disposed', 'under_repair', 'written_off')),
  disposal_date DATE,
  disposal_value NUMERIC,
  warranty_expiry DATE,
  amc_expiry DATE,
  serial_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Stock Reorder Levels ────────────────────────────────────────────────────
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS reorder_level NUMERIC DEFAULT 5;
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS reorder_qty NUMERIC DEFAULT 10;
ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS last_alert_sent TIMESTAMPTZ;

-- ── Enable RLS ──────────────────────────────────────────────────────────────
ALTER TABLE goods_receipt_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grn_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;

-- Service role policies
CREATE POLICY "service_grn" ON goods_receipt_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_grn_items" ON grn_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_budgets" ON budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_fixed_assets" ON fixed_assets FOR ALL USING (true) WITH CHECK (true);
