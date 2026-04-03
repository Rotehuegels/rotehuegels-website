-- ============================================================
-- Final order cleanup — establish correct 6-order view
-- ============================================================

-- 1. Fix SVC-003 (bus bar bending) — wrongly hidden as reimbursement
UPDATE orders SET order_category = 'order'
WHERE order_no = 'SVC-003';

-- 2. Delete SVC-005 duplicate bus bar
DELETE FROM order_payments
WHERE order_id = (SELECT id FROM orders WHERE order_no = 'SVC-005');

DELETE FROM order_payment_stages
WHERE order_id = (SELECT id FROM orders WHERE order_no = 'SVC-005');

DELETE FROM orders WHERE order_no = 'SVC-005';

-- 3. SVC-006 was a pre-existing travel reimbursement — hide it
UPDATE orders SET order_category = 'reimbursement'
WHERE order_no = 'SVC-006';

-- 4. SVC-007 plumbing advance — covered within SVC-002 ₹50k cash payment
UPDATE orders SET status = 'cancelled'
WHERE order_no = 'SVC-007';

-- 5. SVC-2026-002 old combined order — superseded by SVC-002 + SVC-003
UPDATE orders SET status = 'cancelled'
WHERE order_no = 'SVC-2026-002';

-- 6. Create AutoREX as SVC-004 (slot freed since SVC-004 became REIMB-002)
INSERT INTO orders (
  order_no, order_type, order_category,
  client_name, client_gstin, client_address, client_contact,
  description, order_date, entry_date,
  base_value, gst_rate, cgst_amount, sgst_amount, igst_amount,
  total_value_incl_gst,
  tds_applicable, tds_rate, tds_deducted_total,
  place_of_supply, status, notes,
  customer_id
) VALUES (
  'SVC-004', 'service', 'complimentary',
  'M/s India Zinc Inc', '33BZWPS7278C2ZN',
  'No. 224, 1A/1B/1A, 1st Floor, Venkiteshwara Nagar, Vadaperambakkam, Puzhal Village, Madhavaram, Chennai – 600060, Tamil Nadu, India',
  'Mr. Sabare Alam, Director & CEO',
  'AutoREX Implementation — Complimentary with 1-Year Upgradation Support',
  '2026-01-31', '2026-04-03',
  0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
  false, 0.00, 0.00,
  'Tamil Nadu (33)',
  'active',
  'AutoREX system implementation and commissioning provided as complimentary service. Includes 1-year software upgradation and technical support.',
  (SELECT id FROM customers WHERE customer_id = 'CUST-001')
) ON CONFLICT (order_no) DO NOTHING;
