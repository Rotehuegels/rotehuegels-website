-- ============================================================
-- Fix GDS-001 dates
-- Client paid ₹7,10,000 advance on 1 Feb 2026
-- Order entered into system on 3 Feb 2026
-- ============================================================

-- Update order dates
UPDATE orders SET
  order_date = '2026-02-01',
  entry_date = '2026-02-03',
  notes      = 'Advance ₹7,10,000 received on 1 Feb 2026. Order entered into system on 3 Feb 2026. Balance ₹1,28,440.05 pending. Partial delivery: 12 Nos Aluminium Cathode invoiced (GDS-001-1, 31 Mar 2026). Lead Anodes delivery and invoice pending.'
WHERE order_no = 'GDS-001';

-- Update advance payment date
UPDATE order_payments SET
  payment_date = '2026-02-01',
  notes        = 'Advance ₹7,10,000 received on 1 Feb 2026 at order confirmation'
WHERE order_id = (SELECT id FROM orders WHERE order_no = 'GDS-001')
  AND amount_received = 710000.00;
