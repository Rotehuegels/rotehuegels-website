-- Market Intelligence tables: supplier_leads, customer_leads, crawl_jobs

CREATE TABLE IF NOT EXISTS supplier_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  gstin TEXT,
  products_services TEXT[],
  industry TEXT,
  source_url TEXT,
  source_type TEXT,
  confidence_score INT DEFAULT 50,
  relevance_notes TEXT,
  status TEXT DEFAULT 'new',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  tags TEXT[],
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT,
  designation TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  gstin TEXT,
  industry TEXT,
  potential_needs TEXT[],
  estimated_value TEXT,
  source_url TEXT,
  source_type TEXT,
  confidence_score INT DEFAULT 50,
  relevance_notes TEXT,
  status TEXT DEFAULT 'new',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  tags TEXT[],
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crawl_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  search_queries TEXT[],
  status TEXT DEFAULT 'pending',
  results_count INT DEFAULT 0,
  errors JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_leads_status ON supplier_leads(status);
CREATE INDEX IF NOT EXISTS idx_supplier_leads_industry ON supplier_leads(industry);
CREATE INDEX IF NOT EXISTS idx_customer_leads_status ON customer_leads(status);
CREATE INDEX IF NOT EXISTS idx_customer_leads_industry ON customer_leads(industry);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_status ON crawl_jobs(status);
