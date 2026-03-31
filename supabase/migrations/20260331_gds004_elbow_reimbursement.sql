-- ============================================================
-- GDS-004: Miscellaneous Expense Reimbursement — India Zinc
-- Backdated site expenses (elbow/plumbing related) bundled
-- Reimbursed ₹14,098 by India Zinc on 3 Mar 2026
-- ============================================================

DO $$
DECLARE
  gds4_id UUID;
  s1_id   UUID;
  svc1_id UUID;
BEGIN
  -- ── 1. Create GDS-004 order ──────────────────────────────────
  INSERT INTO orders (
    order_no, order_type, client_name, description,
    order_date, entry_date,
    total_value_incl_gst, base_value, gst_rate, cgst_amount, sgst_amount,
    tds_applicable, tds_rate, tds_deducted_total, status, notes
  ) VALUES (
    'GDS-004', 'goods',
    'M/s India Zinc Inc',
    'Miscellaneous Expense Reimbursement — SVC-001 site (plumbing/fittings)',
    '2026-03-03', '2026-03-31',
    14098.00, 14098.00, 0.00, 0.00, 0.00,
    false, 0.00, 0.00, 'completed',
    'Reimbursement of backdated site expenses (elbow fittings and related plumbing items for SVC-001). Multiple expenses bundled — individual invoice values not tracked separately. Reimbursed by India Zinc via NEFT on 3 Mar 2026 (ref SCBLH06200685362).'
  ) RETURNING id INTO gds4_id;

  -- ── 2. Payment stage ─────────────────────────────────────────
  INSERT INTO order_payment_stages (
    order_id, stage_number, stage_name, percentage,
    amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
    trigger_condition, status
  ) VALUES (
    gds4_id, 1, 'Full Reimbursement', 100.00,
    14098.00, 0.00, 0.00, 0.00, 14098.00,
    'On submission of expense statement', 'paid'
  ) RETURNING id INTO s1_id;

  -- ── 3. Payment record ────────────────────────────────────────
  INSERT INTO order_payments (
    order_id, stage_id, payment_date,
    amount_received, tds_deducted, net_received, notes
  ) VALUES (
    gds4_id, s1_id, '2026-03-03',
    14098.00, 0.00, 14098.00,
    'Reimbursement from M/s India Zinc Inc. NEFT ref SCBLH06200685362.'
  );

  -- ── 4. Remove the misparked payment from SVC-001 ─────────────
  SELECT id INTO svc1_id FROM orders WHERE order_no = 'SVC-001';

  DELETE FROM order_payments
  WHERE order_id = svc1_id
    AND payment_date = '2026-03-03'
    AND amount_received = 14098.00;
END $$;
