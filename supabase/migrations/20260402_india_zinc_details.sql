-- ============================================================
-- India Zinc Inc — full client details + delivery date
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_address  TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_contact  TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date   DATE;

-- Update GDS-001 and GDS-001-1 with full client details
UPDATE orders SET
  client_name    = 'M/s India Zinc Inc',
  client_gstin   = '33BZWPS7278C2ZN',
  client_address = 'No. 224, 1A/1B/1A, 1st Floor, Venkiteshwara Nagar, Vadaperumbakkam, Puzhal Village, Madhavaram, Chennai – 600060, Tamil Nadu, India',
  client_contact = 'Mr. Sabare Alam, Proprietor / Director & CEO'
WHERE order_no IN ('GDS-001', 'GDS-001-1');

-- Delivery date for GDS-001-1 (Aluminium Cathodes delivered 23 Feb 2026)
UPDATE orders SET
  delivery_date = '2026-02-23'
WHERE order_no = 'GDS-001-1';
