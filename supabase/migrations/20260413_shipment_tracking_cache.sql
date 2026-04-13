-- Add tracking data cache to shipments table
-- Scraper runs in background, stores results here. Page reads from DB, not live.
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS tracking_data JSONB;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS tracking_updated_at TIMESTAMPTZ;
