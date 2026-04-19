-- Drop unused contact-array columns.
-- contacts_all (table-shaped jsonb) replaces the separate emails_all/phones_all.
-- Keep websites_all.
ALTER TABLE recyclers
  DROP COLUMN IF EXISTS emails_all,
  DROP COLUMN IF EXISTS phones_all;
