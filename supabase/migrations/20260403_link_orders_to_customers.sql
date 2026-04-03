-- ============================================================
-- Add customer_id FK to orders + link all India Zinc orders
-- ============================================================

-- Add optional customer_id column (nullable so existing orders don't break)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- Link all India Zinc orders to CUST-001
UPDATE orders
SET customer_id = (SELECT id FROM customers WHERE customer_id = 'CUST-001')
WHERE client_name = 'M/s India Zinc Inc'
   OR client_name = 'India Zinc Inc';
