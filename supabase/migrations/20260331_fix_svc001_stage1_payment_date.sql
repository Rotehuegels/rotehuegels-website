-- Fix SVC-001 Stage 1 payment date
-- Stage 1 advance was received on the same day the order was entered.
-- The seed used a placeholder (2025-01-01, FY 2024-25) — update to actual entry_date.

UPDATE order_payments
SET
  payment_date = (SELECT entry_date FROM orders WHERE order_no = 'SVC-001'),
  notes        = '40% advance — received on order entry date (Stage 1)'
WHERE order_id = (SELECT id FROM orders WHERE order_no = 'SVC-001')
  AND stage_id = (
    SELECT id FROM order_payment_stages
    WHERE order_id = (SELECT id FROM orders WHERE order_no = 'SVC-001')
      AND stage_number = 1
  );
