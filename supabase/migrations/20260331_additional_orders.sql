-- ============================================================
-- Rotehügels — Additional Orders (To Be Raised) — 31 Mar 2026
-- SVC-002: Bus Bending & Plumbing
-- SVC-003: Chile Consultation — Zamin Group Travel Reimbursement
-- SVC-004: CEG Workshop — Travel Expenses (13 Mar 2026)
-- Run AFTER 20260330_accounts_seed.sql
-- ============================================================


-- ─── SERVICE ORDER SVC-002 ─────────────────────────────────
-- Bus Bending & Plumbing
-- Base: ₹1,00,000 + 18% GST (CGST ₹9,000 + SGST ₹9,000) = ₹1,18,000
-- TDS: Nil | Status: Invoice to be raised
-- ──────────────────────────────────────────────────────────
DO $$
DECLARE
  svc2_id UUID;
BEGIN
  INSERT INTO orders (
    order_no, order_type, client_name, description,
    order_date, entry_date,
    total_value_incl_gst, base_value, gst_rate, cgst_amount, sgst_amount,
    tds_applicable, tds_rate, tds_deducted_total, status, notes
  ) VALUES (
    'SVC-002', 'service',
    'Update Client Name',
    'Bus Bending & Plumbing — supply and installation services',
    '2026-03-31', '2026-03-31',
    118000.00, 100000.00, 18.00, 9000.00, 9000.00,
    false, 0.00, 0.00, 'active',
    'Invoice to be raised. No TDS applicable.'
  ) RETURNING id INTO svc2_id;

  INSERT INTO order_payment_stages (
    order_id, stage_number, stage_name, percentage,
    amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
    trigger_condition, status
  ) VALUES (
    svc2_id, 1, 'Full Payment on Invoice', 100.00,
    100000.00, 18000.00, 0.00, 0.00, 118000.00,
    'On invoice / as agreed', 'pending'
  );
END $$;


-- ─── SERVICE ORDER SVC-003 ─────────────────────────────────
-- Chile Consultation — Zamin Group Founder Meet
-- Travel Expense Reimbursement
-- Base: ₹5,000 + 18% GST (CGST ₹450 + SGST ₹450) = ₹5,900
-- TDS: Nil | Status: Invoice to be raised
-- ──────────────────────────────────────────────────────────
DO $$
DECLARE
  svc3_id UUID;
BEGIN
  INSERT INTO orders (
    order_no, order_type, client_name, description,
    order_date, entry_date,
    total_value_incl_gst, base_value, gst_rate, cgst_amount, sgst_amount,
    tds_applicable, tds_rate, tds_deducted_total, status, notes
  ) VALUES (
    'SVC-003', 'service',
    'Zamin Group',
    'Chile Consultation — Founder Meet Travel Expense Reimbursement',
    '2026-03-31', '2026-03-31',
    5900.00, 5000.00, 18.00, 450.00, 450.00,
    false, 0.00, 0.00, 'active',
    'Travel expense reimbursement for Zamin Group Founder Meet. Invoice to be raised.'
  ) RETURNING id INTO svc3_id;

  INSERT INTO order_payment_stages (
    order_id, stage_number, stage_name, percentage,
    amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
    trigger_condition, status
  ) VALUES (
    svc3_id, 1, 'Full Reimbursement on Invoice', 100.00,
    5000.00, 900.00, 0.00, 0.00, 5900.00,
    'On invoice submission', 'pending'
  );
END $$;


-- ─── SERVICE ORDER SVC-004 ─────────────────────────────────
-- CEG Workshop — Travel Expenses
-- Service date: 13 Mar 2026
-- Base: ₹3,000 + 18% GST (CGST ₹270 + SGST ₹270) = ₹3,540
-- TDS: Nil | Status: Invoice to be raised
-- ──────────────────────────────────────────────────────────
DO $$
DECLARE
  svc4_id UUID;
BEGIN
  INSERT INTO orders (
    order_no, order_type, client_name, description,
    order_date, entry_date,
    total_value_incl_gst, base_value, gst_rate, cgst_amount, sgst_amount,
    tds_applicable, tds_rate, tds_deducted_total, status, notes
  ) VALUES (
    'SVC-004', 'service',
    'CEG (Update Client Name)',
    'CEG Workshop — Travel Expenses reimbursement',
    '2026-03-13', '2026-03-31',
    3540.00, 3000.00, 18.00, 270.00, 270.00,
    false, 0.00, 0.00, 'active',
    'Travel expenses for CEG Workshop on 13 Mar 2026. Invoice to be raised. Update client name.'
  ) RETURNING id INTO svc4_id;

  INSERT INTO order_payment_stages (
    order_id, stage_number, stage_name, percentage,
    amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
    trigger_condition, status
  ) VALUES (
    svc4_id, 1, 'Full Reimbursement on Invoice', 100.00,
    3000.00, 540.00, 0.00, 0.00, 3540.00,
    'On invoice submission', 'pending'
  );
END $$;
