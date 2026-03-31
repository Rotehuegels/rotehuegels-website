-- Fix SVC-001 Stage 3 TDS
-- Was incorrectly seeded as 10% (₹20,000). Correct rate is 2% (194C) on base = ₹4,000.
-- net_receivable = ₹2,00,000 base + ₹36,000 GST − ₹4,000 TDS = ₹2,32,000

UPDATE order_payment_stages
SET
  tds_rate       = 2.00,
  tds_amount     = 4000.00,
  net_receivable = 232000.00
WHERE order_id = (SELECT id FROM orders WHERE order_no = 'SVC-001')
  AND stage_number = 3;

-- Fix order notes — remove incorrect "10% TDS" reference
UPDATE orders
SET notes = 'Three-stage payment: 40% at order placement | 40% against major equipment setup | 20% on water testing post plumbing and electrical. Stage 3 (₹2,00,000 + GST, ₹4,000 TDS @ 2%) pending.'
WHERE order_no = 'SVC-001';
