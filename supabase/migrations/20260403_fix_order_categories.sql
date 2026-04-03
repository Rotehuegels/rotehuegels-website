-- ============================================================
-- Fix order_category assignments after migration sequencing issues
-- ============================================================

-- GDS-004, GDS-005 are expense reimbursements — mark them
UPDATE orders SET order_category = 'reimbursement'
WHERE order_no IN ('GDS-003', 'GDS-004', 'GDS-005');

-- REIMB-001, REIMB-002 should already be 'reimbursement' — ensure it
UPDATE orders SET order_category = 'reimbursement'
WHERE order_no IN ('REIMB-001', 'REIMB-002');

-- SVC-003 (bus bar bending) was wrongly marked 'reimbursement' by the
-- final migration run (which still had the old WHERE order_no = 'SVC-003')
-- Fix it back to 'order'
UPDATE orders SET order_category = 'order'
WHERE order_no = 'SVC-003';

-- SVC-005 is a duplicate bus bar order created by the final migration run
-- (after SVC-005 had already been renamed to SVC-003). Cancel it.
DELETE FROM order_payments
WHERE order_id = (SELECT id FROM orders WHERE order_no = 'SVC-005');

DELETE FROM order_payment_stages
WHERE order_id = (SELECT id FROM orders WHERE order_no = 'SVC-005');

DELETE FROM orders WHERE order_no = 'SVC-005';
