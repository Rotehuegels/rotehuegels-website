-- ============================================================
-- Travel Reimbursement Orders — M/s India Zinc Inc
-- SVC-005: Nov 2025 Supplier Visit (Ahmedabad / Coimbatore)
-- SVC-006: Jan 2026 Akshaya Engineers Visit (Coimbatore)
-- SVC-007: Plumbing Work Advance — ₹10,000 (5 Mar 2026)
-- ============================================================


-- ─── SVC-005: NOV 2025 SUPPLIER VISIT ───────────────────────
-- Ahmedabad → Coimbatore → Chennai
-- Advance ₹20,000 received 2 Nov 2025 via UPI from India Zinc
-- Balance ₹1,251 pending

DO $$
DECLARE
  svc5_id UUID;
  s1_id   UUID;
BEGIN
  INSERT INTO orders (
    order_no, order_type, client_name, description,
    order_date, entry_date,
    total_value_incl_gst, base_value, gst_rate, cgst_amount, sgst_amount,
    tds_applicable, tds_rate, tds_deducted_total, status, notes
  ) VALUES (
    'SVC-005', 'service',
    'M/s India Zinc Inc',
    'Travel Reimbursement — Supplier Visit, Ahmedabad & Coimbatore (Nov 2025)',
    '2025-11-02', '2026-03-31',
    21251.00, 21251.00, 0.00, 0.00, 0.00,
    false, 0.00, 0.00, 'active',
    'Supplier visit — Ahmedabad and Coimbatore. Micro Lab sample testing. Advance ₹20,000 received 2 Nov 2025 via UPI (India Zinc). Balance ₹1,251 pending.'
  ) RETURNING id INTO svc5_id;

  INSERT INTO order_payment_stages (
    order_id, stage_number, stage_name, percentage,
    amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
    trigger_condition, status
  ) VALUES (
    svc5_id, 1, 'Full Reimbursement', 100.00,
    21251.00, 0.00, 0.00, 0.00, 21251.00,
    'On submission of expense statement', 'partial'
  ) RETURNING id INTO s1_id;

  -- Advance ₹20,000 received 2 Nov 2025
  INSERT INTO order_payments (
    order_id, stage_id, payment_date,
    amount_received, tds_deducted, net_received, notes
  ) VALUES (
    svc5_id, s1_id, '2025-11-02',
    20000.00, 0.00, 20000.00,
    'Travel advance from M/s India Zinc Inc. UPI — sabare729@okax (Axis Bank). Balance ₹1,251 pending.'
  );
END $$;


-- SVC-005 Expenses
INSERT INTO expenses (
  expense_type, category, description, vendor_name,
  amount, gst_input_credit, expense_date, payment_mode, notes
) VALUES
('other', 'Travel & Conveyance',
  'Food & Cab — Ahmedabad | SVC-005',
  'Misc (Ahmedabad)',
  2000.00, 0.00, '2025-11-02', 'UPI',
  'Food and local cab expenses in Ahmedabad. Supplier visit trip.'),

('other', 'Travel & Conveyance',
  'Ahmedabad to Coimbatore — Travel | SVC-005',
  'Airlines / Transport',
  5828.00, 0.00, '2025-11-03', 'UPI',
  'Travel from Ahmedabad to Coimbatore for supplier visit.'),

('other', 'Travel & Conveyance',
  'Food & Cab — Coimbatore | SVC-005',
  'Misc (Coimbatore)',
  2000.00, 0.00, '2025-11-03', 'UPI',
  'Food and local cab expenses in Coimbatore.'),

('other', 'Professional Fees',
  'Micro Lab Sample Testing Charges | SVC-005',
  'Micro Lab',
  4000.00, 0.00, '2025-11-04', 'UPI',
  'Sample testing charges at Micro Lab, Coimbatore.'),

('other', 'Travel & Conveyance',
  'Coimbatore to Chennai — Travel | SVC-005',
  'Railways / Transport',
  5423.00, 0.00, '2025-11-06', 'UPI',
  'Return travel from Coimbatore to Chennai.'),

('other', 'Travel & Conveyance',
  'Food & Cab — Chennai | SVC-005',
  'Misc (Chennai)',
  2000.00, 0.00, '2025-11-06', 'UPI',
  'Food and cab expenses in Chennai on return day.');


-- ─── SVC-006: JAN 2026 AKSHAYA ENGINEERS VISIT ──────────────
-- Coimbatore — 6 to 11 Jan 2026
-- ₹10,000 advance from Lakshmi B (India Zinc) on 7 Jan 2026 via UPI
-- ₹3,000 cash refund from M/s Metal Source during trip
-- Balance ₹3,270.40 pending from India Zinc

DO $$
DECLARE
  svc6_id UUID;
  s1_id   UUID;
BEGIN
  INSERT INTO orders (
    order_no, order_type, client_name, description,
    order_date, entry_date,
    total_value_incl_gst, base_value, gst_rate, cgst_amount, sgst_amount,
    tds_applicable, tds_rate, tds_deducted_total, status, notes
  ) VALUES (
    'SVC-006', 'service',
    'M/s India Zinc Inc',
    'Travel Reimbursement — Akshaya Engineers Supplier Visit, Coimbatore (Jan 2026)',
    '2026-01-06', '2026-03-31',
    16270.40, 16270.40, 0.00, 0.00, 0.00,
    false, 0.00, 0.00, 'active',
    'Supplier visit to M/s Akshaya Engineers, Coimbatore (6–11 Jan 2026). Also visited Metal Source and Latha Steel. Total trip cost ₹16,270.40. ₹10,000 advance via UPI from Lakshmi B (India Zinc, lakshmiprabhu0@kvb) on 7 Jan 2026. ₹3,000 cash refund received from M/s Metal Source during trip. Balance ₹3,270.40 pending from India Zinc.'
  ) RETURNING id INTO svc6_id;

  INSERT INTO order_payment_stages (
    order_id, stage_number, stage_name, percentage,
    amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
    trigger_condition, status
  ) VALUES (
    svc6_id, 1, 'Full Reimbursement', 100.00,
    16270.40, 0.00, 0.00, 0.00, 16270.40,
    'On submission of expense statement', 'partial'
  ) RETURNING id INTO s1_id;

  -- ₹10,000 advance from Lakshmi B (India Zinc) on 7 Jan 2026
  INSERT INTO order_payments (
    order_id, stage_id, payment_date,
    amount_received, tds_deducted, net_received, notes
  ) VALUES (
    svc6_id, s1_id, '2026-01-07',
    10000.00, 0.00, 10000.00,
    'Travel advance from Lakshmi B (M/s India Zinc Inc). UPI — lakshmiprabhu0 (Karur Vysya Bank). Balance ₹3,270.40 pending.'
  );

  -- ₹3,000 cash refund from Metal Source
  INSERT INTO order_payments (
    order_id, stage_id, payment_date,
    amount_received, tds_deducted, net_received, notes
  ) VALUES (
    svc6_id, s1_id, '2026-01-09',
    3000.00, 0.00, 3000.00,
    'Cash refund from M/s Metal Source during trip (excess payment refund). Reduces balance payable by India Zinc.'
  );
END $$;


-- SVC-006 Expenses (individual line items)
INSERT INTO expenses (
  expense_type, category, description, vendor_name,
  amount, gst_input_credit, expense_date, payment_mode, notes
) VALUES
('other', 'Travel & Conveyance',
  'Cab to Chennai Airport | SVC-006',
  'Cab',
  1000.00, 0.00, '2026-01-06', 'UPI',
  'Cab to Chennai Airport on departure day.'),

('other', 'Travel & Conveyance',
  'Chennai to Coimbatore — Flight | SVC-006',
  'Airlines',
  4290.00, 0.00, '2026-01-07', 'UPI',
  'Chennai to Coimbatore flight for Akshaya Engineers supplier visit.'),

('other', 'Travel & Conveyance',
  'Airport to Hotel (MX Lodge) | SVC-006',
  'Cab',
  750.00, 0.00, '2026-01-07', 'UPI',
  'Cab from Coimbatore airport to MX Lodge.'),

('other', 'Travel & Conveyance',
  'Hotel to Akshaya Engineers | SVC-006',
  'Cab',
  150.00, 0.00, '2026-01-07', 'UPI',
  ''),

('other', 'Travel & Conveyance',
  'Akshaya Engineers to Hotel | SVC-006',
  'Cab',
  150.00, 0.00, '2026-01-07', 'UPI',
  ''),

('other', 'Travel & Conveyance',
  'MX Lodge — Night 1 | SVC-006',
  'MX Lodge',
  950.00, 0.00, '2026-01-07', 'UPI',
  'Accommodation — 7 Jan 2026.'),

('other', 'Travel & Conveyance',
  'Hotel to Akshaya Engineers | SVC-006',
  'Cab',
  150.00, 0.00, '2026-01-08', 'UPI',
  ''),

('other', 'Travel & Conveyance',
  'Akshaya Engineers to Metal Source | SVC-006',
  'Cab',
  350.00, 0.00, '2026-01-08', 'UPI',
  ''),

('other', 'Travel & Conveyance',
  'MX Lodge — Night 2 | SVC-006',
  'MX Lodge',
  950.00, 0.00, '2026-01-08', 'UPI',
  'Accommodation — 8 Jan 2026.'),

('other', 'Travel & Conveyance',
  'Food & Water | SVC-006',
  'Misc',
  1000.00, 0.00, '2026-01-09', 'Cash',
  'Food and water expenses.'),

('other', 'Travel & Conveyance',
  'Latha Steel — Visit | SVC-006',
  'Latha Steel',
  100.00, 0.00, '2026-01-09', 'Cash',
  'Miscellaneous expense at Latha Steel visit.'),

('other', 'Travel & Conveyance',
  'Metal Source to Hotel | SVC-006',
  'Cab',
  350.00, 0.00, '2026-01-09', 'UPI',
  ''),

('other', 'Travel & Conveyance',
  'MX Lodge — Night 3 | SVC-006',
  'MX Lodge',
  950.00, 0.00, '2026-01-09', 'UPI',
  'Accommodation — 9 Jan 2026.'),

('other', 'Travel & Conveyance',
  'Hotel to Akshaya Engineers | SVC-006',
  'Cab',
  150.00, 0.00, '2026-01-10', 'UPI',
  ''),

('other', 'Travel & Conveyance',
  'Akshaya Engineers to Hotel | SVC-006',
  'Cab',
  150.00, 0.00, '2026-01-10', 'UPI',
  ''),

('other', 'Travel & Conveyance',
  'MX Lodge — Night 4 | SVC-006',
  'MX Lodge',
  950.00, 0.00, '2026-01-10', 'UPI',
  'Accommodation — 10 Jan 2026.'),

('other', 'Travel & Conveyance',
  'Hotel to Coimbatore Railway Station | SVC-006',
  'Cab',
  350.00, 0.00, '2026-01-11', 'UPI',
  ''),

('other', 'Travel & Conveyance',
  'Coimbatore to Chennai — Train | SVC-006',
  'Indian Railways',
  2930.40, 0.00, '2026-01-11', 'UPI',
  'Return train from Coimbatore to Chennai Central.'),

('other', 'Travel & Conveyance',
  'Chennai Central to Home | SVC-006',
  'Cab',
  600.00, 0.00, '2026-01-11', 'UPI',
  'Cab from Chennai Central on return.');


-- ─── SVC-007: PLUMBING WORK ADVANCE ─────────────────────────
-- ₹10,000 advance from India Zinc on 5 Mar 2026 via UPI (personal account)
-- Description: "plumbing s/" — advance for plumbing-related site work

DO $$
DECLARE
  svc7_id UUID;
  s1_id   UUID;
BEGIN
  INSERT INTO orders (
    order_no, order_type, client_name, description,
    order_date, entry_date,
    total_value_incl_gst, base_value, gst_rate, cgst_amount, sgst_amount,
    tds_applicable, tds_rate, tds_deducted_total, status, notes
  ) VALUES (
    'SVC-007', 'service',
    'M/s India Zinc Inc',
    'Plumbing Work Advance — site work (Mar 2026)',
    '2026-03-05', '2026-03-31',
    10000.00, 10000.00, 0.00, 0.00, 0.00,
    false, 0.00, 0.00, 'active',
    '₹10,000 advance received from M/s India Zinc Inc on 5 Mar 2026 via UPI (sabare729@okax, Axis Bank) for plumbing site work. Full scope and invoice amount to be determined. Park as advance until finalised.'
  ) RETURNING id INTO svc7_id;

  INSERT INTO order_payment_stages (
    order_id, stage_number, stage_name, percentage,
    amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
    trigger_condition, status
  ) VALUES (
    svc7_id, 1, 'Advance', 100.00,
    10000.00, 0.00, 0.00, 0.00, 10000.00,
    'Advance received — invoice to be raised', 'partial'
  ) RETURNING id INTO s1_id;

  INSERT INTO order_payments (
    order_id, stage_id, payment_date,
    amount_received, tds_deducted, net_received, notes
  ) VALUES (
    svc7_id, s1_id, '2026-03-05',
    10000.00, 0.00, 10000.00,
    'Advance from M/s India Zinc Inc. UPI — sabare729@okax (Axis Bank). Ref: AXI7865a495f3ea4a56bcbd158b7ac4e05b.'
  );
END $$;
