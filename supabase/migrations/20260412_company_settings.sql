-- Company settings: single-row table for all company configuration
CREATE TABLE IF NOT EXISTS company_settings (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT NOT NULL,
  short_name       TEXT,
  address_line1    TEXT,
  address_line2    TEXT,
  cin              TEXT,
  gstin            TEXT,
  pan              TEXT,
  tan              TEXT,
  email            TEXT,
  procurement_email TEXT,
  noreply_email    TEXT,
  phone            TEXT,
  website          TEXT,
  bank_name        TEXT,
  bank_account     TEXT,
  bank_ifsc        TEXT,
  bank_branch      TEXT,
  upi_id           TEXT,
  fy_start_month   INT NOT NULL DEFAULT 4,    -- April
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_company_settings_ts()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_company_settings_ts
  BEFORE UPDATE ON company_settings
  FOR EACH ROW EXECUTE FUNCTION update_company_settings_ts();

-- Seed with current values
INSERT INTO company_settings (
  name, short_name,
  address_line1, address_line2,
  cin, gstin, pan, tan,
  email, procurement_email, noreply_email,
  phone, website,
  bank_name, bank_account, bank_ifsc, bank_branch,
  upi_id, fy_start_month
) VALUES (
  'Rotehuegel Research Business Consultancy Private Limited',
  'Rotehügels',
  'No. 1/584, 7th Street, Jothi Nagar, Padianallur,',
  'Near Gangaiamman Kovil, Redhills, Chennai – 600052, Tamil Nadu, India',
  'U70200TN2025PTC184573',
  '33AAPCR0554G1ZE',
  'AAPCR0554G',
  'CHER28694B',
  'sales@rotehuegels.com',
  'procurements@rotehuegels.com',
  'noreply@rotehuegels.com',
  '+91-90044 91275',
  'www.rotehuegels.com',
  'State Bank of India, Padianallur Branch',
  '44512115640',
  'SBIN0014160',
  'Padianallur',
  'rotehuegels@sbi',
  4
);
