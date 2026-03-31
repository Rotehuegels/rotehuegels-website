-- ============================================================
-- GDS-005: NTV Plumbing Materials — India Zinc Site (SVC-001)
-- Purchased from National Tubes And Valves on 4 Mar 2026
-- Two UPI payments: ₹17,123 + ₹14,772 = ₹31,895 + ₹355 delivery
-- Reimbursed ₹32,250 by Lakshmi B (India Zinc) on 4 Mar 2026
-- ============================================================

DO $$
DECLARE
  gds5_id UUID;
  s1_id   UUID;
BEGIN
  INSERT INTO orders (
    order_no, order_type, client_name, description,
    order_date, entry_date,
    total_value_incl_gst, base_value, gst_rate, cgst_amount, sgst_amount,
    tds_applicable, tds_rate, tds_deducted_total, status, notes
  ) VALUES (
    'GDS-005', 'goods',
    'M/s India Zinc Inc',
    'Plumbing Materials & Fittings — NTV Purchase (SVC-001 site)',
    '2026-03-04', '2026-03-31',
    32250.00, 32250.00, 0.00, 0.00, 0.00,
    false, 0.00, 0.00, 'completed',
    'Plumbing materials and fittings procured from National Tubes And Valves on 4 Mar 2026. Paid via two UPI payments: ₹17,123 + ₹14,772 = ₹31,895 (materials) + ₹355 (delivery) = ₹32,250. Reimbursed in full by M/s India Zinc Inc via UPI (Lakshmi B / lakshmiprabhu0, KVB) on 4 Mar 2026.'
  ) RETURNING id INTO gds5_id;

  INSERT INTO order_payment_stages (
    order_id, stage_number, stage_name, percentage,
    amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
    trigger_condition, status
  ) VALUES (
    gds5_id, 1, 'Full Reimbursement on Procurement', 100.00,
    32250.00, 0.00, 0.00, 0.00, 32250.00,
    'On procurement and delivery to site', 'paid'
  ) RETURNING id INTO s1_id;

  INSERT INTO order_payments (
    order_id, stage_id, payment_date,
    amount_received, tds_deducted, net_received, notes
  ) VALUES (
    gds5_id, s1_id, '2026-03-04',
    32250.00, 0.00, 32250.00,
    'Full reimbursement from M/s India Zinc Inc. UPI — Lakshmi B (lakshmiprabhu0, Karur Vysya Bank).'
  );
END $$;


-- Expenses: NTV payments on 4 Mar 2026
INSERT INTO expenses (
  expense_type, category, description, vendor_name,
  amount, gst_input_credit, expense_date, payment_mode, notes
) VALUES
(
  'purchase', 'Raw Materials',
  'Plumbing Materials & Fittings — NTV Payment 1 | GDS-005',
  'National Tubes And Valves',
  14510.17, 2612.83, '2026-03-04', 'UPI',
  'CGST ₹1,306.42 + SGST ₹1,306.42 | UPI ₹17,123. Part of GDS-005 procurement for SVC-001 site.'
),
(
  'purchase', 'Raw Materials',
  'Plumbing Materials & Fittings — NTV Payment 2 | GDS-005',
  'National Tubes And Valves',
  12518.64, 2253.36, '2026-03-04', 'UPI',
  'CGST ₹1,126.68 + SGST ₹1,126.68 | UPI ₹14,772. Part of GDS-005 procurement for SVC-001 site.'
),
(
  'purchase', 'Logistics & Delivery',
  'Delivery Charges — NTV GDS-005',
  'National Tubes And Valves',
  355.00, 0.00, '2026-03-04', 'UPI',
  'Delivery charges for NTV plumbing materials to India Zinc site.'
);
