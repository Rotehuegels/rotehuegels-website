-- Store ALL sourced contacts per company (not just one email / one phone).
-- Primary recyclers.email and recyclers.phone stay for quick access, but the
-- full history of values we've seen (MRAI, CPCB seed, website scrape, etc.)
-- lives in the jsonb arrays so nothing is lost.

ALTER TABLE recyclers
  ADD COLUMN IF NOT EXISTS emails_all    JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS phones_all    JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS contacts_all  JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS websites_all  JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN recyclers.emails_all    IS 'All emails ever sourced — [{ email, source, first_seen }]. Primary is recyclers.email.';
COMMENT ON COLUMN recyclers.phones_all    IS 'All phones ever sourced — [{ phone, source, first_seen }]. Primary is recyclers.phone.';
COMMENT ON COLUMN recyclers.contacts_all  IS 'All contact persons — [{ name, title, source, first_seen }].';
COMMENT ON COLUMN recyclers.websites_all  IS 'All websites — [{ url, source, first_seen }]. Primary is recyclers.website.';

-- GIN indexes for jsonb lookup (e.g., "recyclers with email@domain")
CREATE INDEX IF NOT EXISTS idx_recyclers_emails_all_gin   ON recyclers USING gin (emails_all);
CREATE INDEX IF NOT EXISTS idx_recyclers_phones_all_gin   ON recyclers USING gin (phones_all);
CREATE INDEX IF NOT EXISTS idx_recyclers_websites_all_gin ON recyclers USING gin (websites_all);
