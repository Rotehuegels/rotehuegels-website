-- Add CIN + GPS coordinates to recycler directory
-- GSTIN already exists on the table (see 20260415200000_ewaste_platform.sql).
-- CIN (Corporate Identification Number) is the MCA-issued company ID.
-- Latitude/longitude enable map display + nearest-recycler queries.
-- Runs after 20260419350000_rename_ewaste_tables.sql, so target is `recyclers`.

ALTER TABLE recyclers
  ADD COLUMN IF NOT EXISTS cin TEXT,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6);

-- Lightweight lookup indexes for identifier search
CREATE INDEX IF NOT EXISTS idx_recyclers_cin    ON recyclers (cin)   WHERE cin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recyclers_gstin  ON recyclers (gstin) WHERE gstin IS NOT NULL;

-- Composite index for geo queries (only where both coords are populated)
CREATE INDEX IF NOT EXISTS idx_recyclers_geo
  ON recyclers (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON COLUMN recyclers.cin       IS 'Corporate Identification Number issued by MCA';
COMMENT ON COLUMN recyclers.latitude  IS 'Facility latitude in decimal degrees (WGS84)';
COMMENT ON COLUMN recyclers.longitude IS 'Facility longitude in decimal degrees (WGS84)';
