-- Add reg_no to supplier_registrations (was missing)
ALTER TABLE supplier_registrations ADD COLUMN IF NOT EXISTS reg_no TEXT UNIQUE;

-- Backfill existing supplier registrations with random refs
UPDATE supplier_registrations
SET reg_no = 'SR-' || upper(substr(md5(random()::text), 1, 8))
WHERE reg_no IS NULL;
