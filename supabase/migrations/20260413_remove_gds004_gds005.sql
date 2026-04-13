-- Remove GDS-004 and GDS-005 from orders table
-- These were cash reimbursements (FY 2025-26), not proper GST invoices.
-- Expense records in expenses table are retained.

-- 1. Delete payment records
DELETE FROM order_payments
WHERE order_id IN (SELECT id FROM orders WHERE order_no IN ('GDS-004', 'GDS-005'));

-- 2. Delete payment stages
DELETE FROM order_payment_stages
WHERE order_id IN (SELECT id FROM orders WHERE order_no IN ('GDS-004', 'GDS-005'));

-- 3. Delete the orders themselves
DELETE FROM orders WHERE order_no IN ('GDS-004', 'GDS-005');

-- 4. Update related expenses to clarify they were cash reimbursements (not invoiced)
UPDATE expenses
SET notes = notes || ' | Reclassified: cash reimbursement from India Zinc (not invoiced, no GST).'
WHERE description ILIKE '%GDS-004%' OR description ILIKE '%GDS-005%';
