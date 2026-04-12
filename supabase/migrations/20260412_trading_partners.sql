-- ============================================================
-- Trading Partners — Commodity Broker Network
-- ============================================================

CREATE TABLE IF NOT EXISTS trading_partners (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reg_no           TEXT UNIQUE NOT NULL,            -- TP-2026-001

  -- Company info
  company_name     TEXT NOT NULL,
  contact_person   TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT,
  website          TEXT,
  country          TEXT DEFAULT 'India',

  -- KYC
  gstin            TEXT,
  pan              TEXT,
  tax_id           TEXT,                             -- for international
  business_type    TEXT,

  -- Trading details
  commodities      TEXT[] NOT NULL DEFAULT '{}',     -- {copper, zinc, lead, tin, nickel, aluminium, ...}
  trade_type       TEXT DEFAULT 'seller',             -- seller, buyer, both
  typical_volume   TEXT,                              -- e.g. "50-100 MT/month"
  origin_countries TEXT[],                            -- where they source from
  certifications   TEXT,                              -- ISO, LBMA, etc.

  -- Verification
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'verified', 'rejected', 'suspended')),
  verified_by      TEXT,
  verified_at      TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Terms
  terms_accepted   BOOLEAN DEFAULT false,

  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trading_partners_status ON trading_partners(status);
CREATE INDEX idx_trading_partners_email ON trading_partners(email);
CREATE INDEX idx_trading_partners_commodities ON trading_partners USING gin(commodities);

CREATE TRIGGER trading_partners_updated_at
  BEFORE UPDATE ON trading_partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
