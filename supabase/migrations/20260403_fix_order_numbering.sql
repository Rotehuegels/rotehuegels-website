-- ============================================================
-- Fix order numbering — reimbursements don't get SVC numbers
-- ============================================================
-- Reimbursements → REIMB-001, REIMB-002
-- SVC-005 (bus bar) → SVC-003
-- SVC-002 order_date corrected to 26 Feb 2026
-- ============================================================

-- Rename reimbursements out of the SVC sequence
UPDATE orders SET order_no = 'REIMB-001' WHERE order_no = 'SVC-003';
UPDATE orders SET order_no = 'REIMB-002' WHERE order_no = 'SVC-004';

-- Rename bus bar bending to the correct sequence position
UPDATE orders SET order_no = 'SVC-003' WHERE order_no = 'SVC-005';

-- Fix SVC-002 order date
UPDATE orders SET order_date = '2026-02-26' WHERE order_no = 'SVC-002';
