-- ============================================================
-- Add HSN/SAC code to orders + create suppliers table
-- Run in Supabase SQL Editor
-- ============================================================

-- Add HSN/SAC code column to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS hsn_sac_code TEXT;

-- Suppliers / vendors master
CREATE TABLE IF NOT EXISTS suppliers (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gstin         TEXT UNIQUE,
  legal_name    TEXT NOT NULL,
  trade_name    TEXT,
  pan           TEXT,
  address       TEXT,
  state         TEXT,
  pincode       TEXT,
  gst_status    TEXT,                        -- Active / Cancelled / Suspended
  reg_date      DATE,                        -- GST registration date
  entity_type   TEXT,                        -- Private Limited / Proprietorship etc.
  email         TEXT,
  phone         TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
