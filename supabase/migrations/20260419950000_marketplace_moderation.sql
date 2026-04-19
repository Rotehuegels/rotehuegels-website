-- ─────────────────────────────────────────────────────────────────────────
-- Marketplace moderation layer — adds admin review fields to listings so
-- user-submitted posts pass through a queue before becoming publicly
-- visible. Required for Terms/Privacy compliance + spam control.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS moderation_status text
    NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS moderation_notes text,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderated_by text,                -- admin email
  ADD COLUMN IF NOT EXISTS submitter_name text,              -- who posted it
  ADD COLUMN IF NOT EXISTS submitter_ip text,                -- for abuse tracking
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS match_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_listings_moderation ON listings (moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_public     ON listings (status, moderation_status, listing_type, item_category_id);

-- Public visibility = status='active' AND moderation_status='approved' AND valid_until >= today (or null).
-- Implemented at the query layer so we can change the rule without a migration.
