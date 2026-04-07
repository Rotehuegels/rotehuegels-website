-- ============================================================
-- SVC-001: Set invoice date to 11 Apr 2026 (Saturday)
-- Stage 3 commissioning balance ₹2,36,000 to be released post commissioning
-- ============================================================

UPDATE orders
SET invoice_date = '2026-04-11'
WHERE order_no = 'SVC-001';
