-- Add adjustments JSONB column to orders for credit notes, excess adjustments, etc.
-- Format: [{"description": "...", "amount": 2887, "reference": "GDS-002"}]
ALTER TABLE orders ADD COLUMN IF NOT EXISTS adjustments JSONB DEFAULT '[]'::jsonb;

-- GDS-004: Add excess credit adjustment from GDS-002 float revision
UPDATE orders SET
  adjustments = '[
    {
      "description": "Excess credit — GDS-002 Float & Scale Indicator price revised from Rs.11,287.50 to Rs.8,400 (M/s Venkat Engineers, 14 Apr 2026)",
      "amount": 2887,
      "reference": "GDS-002"
    }
  ]'::jsonb
WHERE order_no = 'GDS-004';
