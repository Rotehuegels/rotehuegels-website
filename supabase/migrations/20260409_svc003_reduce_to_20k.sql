-- SVC-003: Reduce invoice to ₹20,000 incl. GST (customer concession — drawing charge waived)
-- ₹20,000 already received as advance = full settlement, no balance due.
-- Base: ₹16,949.15 | CGST 9%: ₹1,525.42 | SGST 9%: ₹1,525.43

UPDATE orders SET
  base_value           = 16949.15,
  cgst_amount          = 1525.42,
  sgst_amount          = 1525.43,
  total_value_incl_gst = 20000.00,
  status               = 'completed',
  notes                = '₹20,000 received in full. Invoice reduced from ₹29,500 to ₹20,000 incl. GST — bus bar drawing charges waived as per customer agreement.'
WHERE order_no = 'SVC-003';

-- Remove the pending balance stage (waived)
DELETE FROM order_payment_stages
WHERE order_id     = (SELECT id FROM orders WHERE order_no = 'SVC-003')
  AND stage_number = 2;

-- Update stage 1 to reflect full invoice value incl. GST split
UPDATE order_payment_stages SET
  amount_due     = 16949.15,
  gst_on_stage   = 3050.85,
  net_receivable = 20000.00
WHERE order_id     = (SELECT id FROM orders WHERE order_no = 'SVC-003')
  AND stage_number = 1;
