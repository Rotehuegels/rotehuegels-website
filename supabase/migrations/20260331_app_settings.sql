-- App settings table for runtime key-value config
CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- GSTINCheck API credit tracking
INSERT INTO app_settings (key, value) VALUES
  ('gstin_credits_total',  '20'),
  ('gstin_credits_used',   '0'),
  ('gstin_credits_expiry', '2026-04-30')
ON CONFLICT (key) DO NOTHING;
