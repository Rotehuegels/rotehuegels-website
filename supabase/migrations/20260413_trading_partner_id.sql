-- Add permanent partner ID column (assigned on approval)
ALTER TABLE trading_partners ADD COLUMN IF NOT EXISTS partner_id TEXT UNIQUE;
