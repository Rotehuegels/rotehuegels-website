-- Trading partner leads — AI-discovered potential trading partners
CREATE TABLE IF NOT EXISTS trading_leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name     TEXT NOT NULL,
  contact_person   TEXT,
  designation      TEXT,
  email            TEXT,
  phone            TEXT,
  website          TEXT,
  address          TEXT,
  city             TEXT,
  state            TEXT,
  country          TEXT DEFAULT 'India',
  gstin            TEXT,
  industry         TEXT,
  commodities      TEXT[],
  trade_type       TEXT DEFAULT 'both',
  typical_volume   TEXT,
  origin_countries TEXT[],
  certifications   TEXT,
  source_type      TEXT DEFAULT 'groq_discovery',
  confidence_score INT DEFAULT 50,
  relevance_notes  TEXT,
  status           TEXT DEFAULT 'new',
  reviewed_by      UUID,
  reviewed_at      TIMESTAMPTZ,
  tags             TEXT[],
  raw_data         JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trading_leads_status ON trading_leads(status);
CREATE INDEX IF NOT EXISTS idx_trading_leads_commodities ON trading_leads USING gin(commodities);
CREATE INDEX IF NOT EXISTS idx_trading_leads_country ON trading_leads(country);
