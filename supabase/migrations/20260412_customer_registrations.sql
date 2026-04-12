-- ============================================================
-- Customer Registration + KYC + Lead Management
-- ============================================================

-- Customer registrations (public form submissions, pending KYC)
CREATE TABLE IF NOT EXISTS customer_registrations (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reg_no           TEXT UNIQUE NOT NULL,            -- REG-2026-001

  -- Basic info
  company_name     TEXT NOT NULL,
  contact_person   TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT,
  website          TEXT,

  -- KYC mandatory
  country          TEXT DEFAULT 'India',
  gstin            TEXT,
  pan              TEXT,
  tax_id           TEXT,                             -- for international customers (VAT, EIN, TIN, etc.)
  business_type    TEXT CHECK (business_type IN (
    'proprietorship', 'partnership', 'llp', 'pvt_ltd', 'public_ltd', 'trust', 'govt', 'other'
  )),
  industry         TEXT,
  billing_address  JSONB NOT NULL DEFAULT '{}',     -- {line1, line2, city, state, pincode, country}
  shipping_address JSONB DEFAULT '{}',

  -- Verification
  email_verified   BOOLEAN DEFAULT false,
  verify_token     TEXT,
  verify_expires   TIMESTAMPTZ,

  -- Approval workflow
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'email_verified', 'kyc_submitted', 'approved', 'rejected')),
  rejection_reason TEXT,
  approved_by      TEXT,
  approved_at      TIMESTAMPTZ,
  customer_id      UUID REFERENCES customers(id),   -- set when approved and promoted

  -- Terms
  terms_accepted   BOOLEAN DEFAULT false,

  -- Meta
  source           TEXT DEFAULT 'website',           -- website, referral, sales, other
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Customer leads (discussions, no registration yet)
CREATE TABLE IF NOT EXISTS sales_leads (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_code        TEXT UNIQUE NOT NULL,             -- LEAD-2026-001
  company_name     TEXT NOT NULL,
  contact_person   TEXT,
  email            TEXT,
  phone            TEXT,
  industry         TEXT,
  source           TEXT DEFAULT 'inquiry',           -- inquiry, referral, market_intel, event, cold_call
  status           TEXT NOT NULL DEFAULT 'new'
                     CHECK (status IN ('new', 'contacted', 'interested', 'proposal_sent', 'negotiating', 'converted', 'lost')),
  notes            TEXT,
  next_follow_up   DATE,
  assigned_to      TEXT,
  converted_reg_id UUID REFERENCES customer_registrations(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cust_reg_email ON customer_registrations(email);
CREATE INDEX idx_cust_reg_status ON customer_registrations(status);
CREATE INDEX idx_cust_reg_gstin ON customer_registrations(gstin);
CREATE INDEX idx_cust_leads_status ON sales_leads(status);
CREATE INDEX idx_cust_leads_followup ON sales_leads(next_follow_up);

-- Triggers
CREATE TRIGGER cust_reg_updated_at
  BEFORE UPDATE ON customer_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER cust_leads_updated_at
  BEFORE UPDATE ON sales_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
