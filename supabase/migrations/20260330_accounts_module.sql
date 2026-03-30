-- ============================================================
-- Rotehügels Accounts Module — Schema
-- Run this in Supabase SQL Editor before the seed file
-- ============================================================

-- Orders (sales orders — goods and services)
CREATE TABLE IF NOT EXISTS orders (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_no              TEXT UNIQUE NOT NULL,
  order_type            TEXT NOT NULL CHECK (order_type IN ('goods', 'service')),
  client_name           TEXT NOT NULL,
  client_gstin          TEXT,
  client_pan            TEXT,
  description           TEXT,
  order_date            DATE NOT NULL,       -- date order was received from client
  entry_date            DATE NOT NULL,       -- date entered in our system
  total_value_incl_gst  NUMERIC(14,2) NOT NULL,
  base_value            NUMERIC(14,2),       -- value before GST
  gst_rate              NUMERIC(5,2) DEFAULT 18,
  cgst_amount           NUMERIC(14,2) DEFAULT 0,
  sgst_amount           NUMERIC(14,2) DEFAULT 0,
  igst_amount           NUMERIC(14,2) DEFAULT 0,
  tds_applicable        BOOLEAN DEFAULT false,
  tds_rate              NUMERIC(5,2) DEFAULT 0,
  tds_deducted_total    NUMERIC(14,2) DEFAULT 0,  -- running total of TDS deducted so far
  status                TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Payment stages (the plan — e.g. 40%/40%/20% milestones)
CREATE TABLE IF NOT EXISTS order_payment_stages (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stage_number      INT NOT NULL,
  stage_name        TEXT NOT NULL,
  percentage        NUMERIC(5,2),             -- optional percentage of base value
  amount_due        NUMERIC(14,2) NOT NULL,   -- base amount for this stage (excl GST)
  gst_on_stage      NUMERIC(14,2) DEFAULT 0,  -- GST applicable on this stage
  tds_rate          NUMERIC(5,2) DEFAULT 0,
  tds_amount        NUMERIC(14,2) DEFAULT 0,  -- expected TDS deduction on this stage
  net_receivable    NUMERIC(14,2),            -- amount_due + gst_on_stage - tds_amount
  due_date          DATE,
  trigger_condition TEXT,                     -- e.g. "Against major equipment setup"
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Actual payments received (records each bank receipt)
CREATE TABLE IF NOT EXISTS order_payments (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id         UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stage_id         UUID REFERENCES order_payment_stages(id),
  payment_date     DATE NOT NULL,
  amount_received  NUMERIC(14,2) NOT NULL,  -- gross invoice amount (base + GST) for this receipt
  tds_deducted     NUMERIC(14,2) DEFAULT 0, -- TDS deducted by client
  net_received     NUMERIC(14,2),           -- amount_received - tds_deducted (what hits our bank)
  payment_mode     TEXT DEFAULT 'NEFT'
                     CHECK (payment_mode IN ('NEFT', 'RTGS', 'IMPS', 'Cheque', 'Cash', 'UPI', 'Other')),
  reference_no     TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses (salary, purchases, TDS paid, GST paid, etc.)
CREATE TABLE IF NOT EXISTS expenses (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_type        TEXT NOT NULL
                        CHECK (expense_type IN ('salary', 'purchase', 'tds_paid', 'advance_tax', 'gst_paid', 'other')),
  category            TEXT,
  description         TEXT NOT NULL,
  vendor_name         TEXT,
  vendor_gstin        TEXT,
  amount              NUMERIC(14,2) NOT NULL,
  gst_input_credit    NUMERIC(14,2) DEFAULT 0, -- input GST credit claimable
  expense_date        DATE NOT NULL,
  reference_no        TEXT,
  payment_mode        TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Stock items / inventory
CREATE TABLE IF NOT EXISTS stock_items (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_code    TEXT UNIQUE,
  item_name    TEXT NOT NULL,
  description  TEXT,
  category     TEXT,
  hsn_code     TEXT,
  unit         TEXT DEFAULT 'pcs',
  quantity     NUMERIC(12,3) DEFAULT 0,
  unit_cost    NUMERIC(14,2) DEFAULT 0,
  order_id     UUID REFERENCES orders(id),   -- linked supply order if applicable
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on orders
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER stock_items_updated_at
  BEFORE UPDATE ON stock_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
