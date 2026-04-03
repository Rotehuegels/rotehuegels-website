-- ============================================================
-- Rotehügels CRM Module — Customers, Items, Quotes, Proforma
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Customer Master ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id      TEXT UNIQUE NOT NULL,        -- CUST-001
  name             TEXT NOT NULL,
  gstin            TEXT,
  pan              TEXT,
  billing_address  JSONB NOT NULL DEFAULT '{}', -- {line1, line2, city, state, pincode}
  shipping_address JSONB,
  contact_person   TEXT,
  email            TEXT,
  phone            TEXT,
  state            TEXT,                         -- e.g. "Tamil Nadu" for intra/inter-state GST
  state_code       TEXT,                         -- e.g. "33"
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Item / Product Catalog (sell-side) ───────────────────────
CREATE TABLE IF NOT EXISTS items (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku_id           TEXT UNIQUE NOT NULL,         -- SKU-001 for goods, SRV-001 for services
  item_type        TEXT NOT NULL CHECK (item_type IN ('goods', 'service')),
  name             TEXT NOT NULL,
  description      TEXT,
  hsn_code         TEXT,                         -- for goods
  sac_code         TEXT,                         -- for services
  unit             TEXT NOT NULL DEFAULT 'pcs',  -- kg, MT, pcs, litre, hours, days, project, lump sum
  mrp              NUMERIC(14,2),                -- maximum / standard price
  default_gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18,
  category         TEXT,
  is_active        BOOLEAN DEFAULT true,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Quotations ───────────────────────────────────────────────
-- items JSONB structure:
-- [{
--   item_id, sku_id, name, item_type, hsn_code, sac_code, unit,
--   quantity, mrp, unit_price, discount_pct, discount_amount,
--   taxable_amount, gst_rate, cgst_rate, sgst_rate, igst_rate,
--   gst_amount, total
-- }]
CREATE TABLE IF NOT EXISTS quotes (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_no           TEXT UNIQUE NOT NULL,   -- QT-2026-001
  customer_id        UUID NOT NULL REFERENCES customers(id),
  quote_date         DATE NOT NULL,
  valid_until        DATE,
  items              JSONB NOT NULL DEFAULT '[]',
  subtotal           NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_amount    NUMERIC(14,2) DEFAULT 0,
  taxable_value      NUMERIC(14,2) NOT NULL DEFAULT 0,
  cgst_amount        NUMERIC(14,2) DEFAULT 0,
  sgst_amount        NUMERIC(14,2) DEFAULT 0,
  igst_amount        NUMERIC(14,2) DEFAULT 0,
  total_amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes              TEXT,
  terms              TEXT,
  status             TEXT NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','sent','accepted','rejected','expired','converted')),
  converted_order_id UUID REFERENCES orders(id),
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── Proforma Invoices ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proforma_invoices (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pi_no           TEXT UNIQUE NOT NULL,   -- PI-2026-001
  quote_id        UUID REFERENCES quotes(id),
  order_id        UUID REFERENCES orders(id),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  pi_date         DATE NOT NULL,
  items           JSONB NOT NULL DEFAULT '[]',
  subtotal        NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(14,2) DEFAULT 0,
  taxable_value   NUMERIC(14,2) NOT NULL DEFAULT 0,
  cgst_amount     NUMERIC(14,2) DEFAULT 0,
  sgst_amount     NUMERIC(14,2) DEFAULT 0,
  igst_amount     NUMERIC(14,2) DEFAULT 0,
  total_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','sent','paid','cancelled')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Triggers ─────────────────────────────────────────────────
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER proforma_invoices_updated_at
  BEFORE UPDATE ON proforma_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
