-- ============================================================
-- SVC-003 currently holds a travel reimbursement record.
-- Rename it to REIMB-003, then create fresh SVC-003 for
-- Copper Bus Bar Bending & Drilling (10 Mar 2026, ₹25,000 + GST)
-- ============================================================

-- 1. Rename existing SVC-003 (travel reimbursement) out of the way
UPDATE orders SET
  order_no       = 'REIMB-003',
  order_category = 'reimbursement'
WHERE order_no = 'SVC-003';

-- 2. Create SVC-003: Copper Bus Bar Bending & Drilling
INSERT INTO orders (
  order_no, order_type, order_category,
  client_name, client_gstin, client_address, client_contact,
  description, order_date, entry_date,
  base_value, gst_rate, cgst_amount, sgst_amount, igst_amount,
  total_value_incl_gst,
  tds_applicable, tds_rate, tds_deducted_total,
  place_of_supply, hsn_sac_code, status, notes,
  customer_id
) VALUES (
  'SVC-003', 'service', 'order',
  'M/s India Zinc Inc', '33BZWPS7278C2ZN',
  'No. 224, 1A/1B/1A, 1st Floor, Venkiteshwara Nagar, Vadaperambakkam, Puzhal Village, Madhavaram, Chennai – 600060, Tamil Nadu, India',
  'Mr. Sabare Alam, Director & CEO',
  'Copper Bus Bar Bending, Drilling and Fabrication as per Customer Requirement',
  '2026-03-10', '2026-04-03',
  25000.00, 18.00, 2250.00, 2250.00, 0.00,
  29500.00,
  false, 0.00, 0.00,
  'Tamil Nadu (33)', '9988',
  'active',
  '₹20,000 received. Pending: Bus Bar Drawing ₹5,000 + GST ₹4,500 = ₹9,500.',
  (SELECT id FROM customers WHERE customer_id = 'CUST-001')
) ON CONFLICT (order_no) DO NOTHING;

-- 3. Payment stages
INSERT INTO order_payment_stages (
  order_id, stage_number, stage_name, percentage,
  amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
  trigger_condition, status
) VALUES
  (
    (SELECT id FROM orders WHERE order_no = 'SVC-003'),
    1, 'Advance — Fabrication Work', 80.00,
    20000.00, 0.00, 0.00, 0.00, 20000.00,
    'On delivery of fabricated bus bars',
    'paid'
  ),
  (
    (SELECT id FROM orders WHERE order_no = 'SVC-003'),
    2, 'Balance — Drawing & GST', 20.00,
    5000.00, 4500.00, 0.00, 0.00, 9500.00,
    'On submission of fabrication drawing and invoicing',
    'pending'
  );

-- 4. Payment record — ₹20,000 cash received
INSERT INTO order_payments (
  order_id, payment_date, amount_received, tds_deducted, net_received,
  payment_mode, reference_no, notes
) VALUES (
  (SELECT id FROM orders WHERE order_no = 'SVC-003'),
  '2026-03-31',
  20000.00, 0.00, 20000.00,
  'Cash', '',
  'Payment for bus bar bending, drilling and fabrication work'
);
