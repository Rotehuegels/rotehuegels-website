-- ============================================================
-- Add unique vendor_code column to suppliers (VND-001, VND-002, …)
-- Auto-generated for new suppliers via a trigger.
-- ============================================================

ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS vendor_code TEXT UNIQUE;

-- Backfill existing suppliers in creation order
DO $$
DECLARE
  rec RECORD;
  seq INT := 0;
BEGIN
  FOR rec IN SELECT id FROM suppliers ORDER BY created_at LOOP
    seq := seq + 1;
    UPDATE suppliers SET vendor_code = 'VND-' || LPAD(seq::TEXT, 3, '0') WHERE id = rec.id;
  END LOOP;
END $$;

-- Auto-generate vendor_code for new suppliers
CREATE OR REPLACE FUNCTION generate_vendor_code()
RETURNS TRIGGER AS $$
DECLARE
  next_seq INT;
BEGIN
  IF NEW.vendor_code IS NULL OR NEW.vendor_code = '' THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(vendor_code FROM 5) AS INT)), 0) + 1
    INTO next_seq
    FROM suppliers
    WHERE vendor_code ~ '^VND-[0-9]+$';
    NEW.vendor_code := 'VND-' || LPAD(next_seq::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vendor_code ON suppliers;
CREATE TRIGGER trg_vendor_code
  BEFORE INSERT ON suppliers
  FOR EACH ROW EXECUTE FUNCTION generate_vendor_code();
