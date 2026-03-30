-- ============================================================
-- Rotehügels Accounts Module — Seed Data
-- Run AFTER the schema migration (20260330_accounts_module.sql)
-- Contains the 3 real orders as of 30 March 2026
-- ============================================================

-- ─── SERVICE ORDER SVC-001 ─────────────────────────────────
-- ₹10,00,000 base + 18% GST = ₹11,80,000 total
-- Payment: 40% (paid) + 40% (paid) + 20% (pending)
-- TDS: 2% on base (194C) — ₹16,000 deducted on 80% received
-- Stage 3 TDS: 10% on base per client terms
-- ──────────────────────────────────────────────────────────
DO $$
DECLARE
  svc_id   UUID;
  s1_id    UUID;
  s2_id    UUID;
  s3_id    UUID;
BEGIN
  INSERT INTO orders (
    order_no, order_type, client_name, description,
    order_date, entry_date,
    total_value_incl_gst, base_value, gst_rate, cgst_amount, sgst_amount,
    tds_applicable, tds_rate, tds_deducted_total, status, notes
  ) VALUES (
    'SVC-001', 'service',
    'Update Client Name',
    'Service Order — Plumbing, electrical installation and water system commissioning (post plumbing and electrical water testing)',
    '2025-01-01', '2025-01-01',
    1180000.00, 1000000.00, 18.00, 90000.00, 90000.00,
    true, 2.00, 16000.00, 'active',
    'Three-stage payment: 40% at order placement | 40% against major equipment setup | 20% on water testing post plumbing and electrical. Stage 3 (₹2,00,000 + GST) is pending with 10% TDS deduction.'
  ) RETURNING id INTO svc_id;

  -- Stage 1: 40% advance — PAID (TDS 2% = ₹8,000)
  INSERT INTO order_payment_stages (
    order_id, stage_number, stage_name, percentage,
    amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
    trigger_condition, status
  ) VALUES (
    svc_id, 1, '40% Advance at Order', 40.00,
    400000.00, 72000.00, 2.00, 8000.00, 464000.00,
    'At the time of order placement', 'paid'
  ) RETURNING id INTO s1_id;

  -- Stage 2: 40% equipment setup — PAID (TDS 2% = ₹8,000)
  INSERT INTO order_payment_stages (
    order_id, stage_number, stage_name, percentage,
    amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
    trigger_condition, status
  ) VALUES (
    svc_id, 2, '40% Against Major Equipment Setup', 40.00,
    400000.00, 72000.00, 2.00, 8000.00, 464000.00,
    'Against major equipment setup', 'paid'
  ) RETURNING id INTO s2_id;

  -- Stage 3: 20% post water testing — PENDING (TDS 10% = ₹20,000)
  INSERT INTO order_payment_stages (
    order_id, stage_number, stage_name, percentage,
    amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
    trigger_condition, status
  ) VALUES (
    svc_id, 3, '20% on Water Testing Post Plumbing & Electrical', 20.00,
    200000.00, 36000.00, 10.00, 20000.00, 216000.00,
    'On water testing post plumbing and electrical', 'pending'
  ) RETURNING id INTO s3_id;

  -- Payment for Stage 1 (update order_date when known)
  INSERT INTO order_payments (
    order_id, stage_id, payment_date,
    amount_received, tds_deducted, net_received, notes
  ) VALUES (
    svc_id, s1_id, '2025-01-01',
    472000.00, 8000.00, 464000.00,
    '40% advance — Stage 1 received (update date)'
  );

  -- Payment for Stage 2 (update date to actual receipt date)
  INSERT INTO order_payments (
    order_id, stage_id, payment_date,
    amount_received, tds_deducted, net_received, notes
  ) VALUES (
    svc_id, s2_id, '2025-06-01',
    472000.00, 8000.00, 464000.00,
    '40% against equipment setup — Stage 2 received (update date)'
  );
END $$;


-- ─── GOODS ORDER GDS-001 ───────────────────────────────────
-- High Purity Lead Anodes + Aluminium Cathode (custom)
-- Received: 31 Jan 2026 (Sat evening) | Entered: 2 Feb 2026
-- Total: ₹8,38,440.05 incl GST (18%)
-- Base: ₹7,10,542.42 | GST: ₹1,27,897.63
-- Advance: ₹71,000 on 31 Jan 2026 | Balance: pending
-- ──────────────────────────────────────────────────────────
DO $$
DECLARE
  gds1_id  UUID;
  s1_id    UUID;
  s2_id    UUID;
BEGIN
  INSERT INTO orders (
    order_no, order_type, client_name, description,
    order_date, entry_date,
    total_value_incl_gst, base_value, gst_rate, cgst_amount, sgst_amount,
    tds_applicable, tds_rate, tds_deducted_total, status, notes
  ) VALUES (
    'GDS-001', 'goods',
    'Update Client Name',
    'Manufacture and supply of High Purity Lead Anodes and High Purity Aluminium Cathode — custom made as per customer specification',
    '2026-01-31', '2026-02-02',
    838440.05, 710542.42, 18.00, 63948.81, 63948.81,
    false, 0.00, 0.00, 'active',
    'Order received Saturday 31 Jan 2026 late evening; entered on 2 Feb 2026 (1 Feb being Sunday). Advance ₹71,000 received on 31 Jan 2026. Balance pending as of 30 Mar 2026.'
  ) RETURNING id INTO gds1_id;

  -- Stage 1: Advance — PAID
  INSERT INTO order_payment_stages (
    order_id, stage_number, stage_name, percentage,
    amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
    trigger_condition, status
  ) VALUES (
    gds1_id, 1, 'Advance Payment', NULL,
    71000.00, 0.00, 0.00, 0.00, 71000.00,
    'At the time of order confirmation', 'paid'
  ) RETURNING id INTO s1_id;

  -- Stage 2: Balance — PENDING
  INSERT INTO order_payment_stages (
    order_id, stage_number, stage_name, percentage,
    amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
    trigger_condition, status
  ) VALUES (
    gds1_id, 2, 'Balance on Delivery', NULL,
    767440.05, 0.00, 0.00, 0.00, 767440.05,
    'On delivery / as agreed', 'pending'
  ) RETURNING id INTO s2_id;

  -- Advance payment received 31 Jan 2026
  INSERT INTO order_payments (
    order_id, stage_id, payment_date,
    amount_received, tds_deducted, net_received, notes
  ) VALUES (
    gds1_id, s1_id, '2026-01-31',
    71000.00, 0.00, 71000.00,
    'Advance received on 31 Jan 2026 at order confirmation'
  );
END $$;


-- ─── GOODS ORDER GDS-002 ───────────────────────────────────
-- Sensors for AutoREX Implementation
-- Received & entered: 30 Mar 2026
-- Total: ₹57,192.24 incl GST (18%)
-- Base: ₹48,468.00 | GST: ₹8,724.24
-- Full amount pending
-- ──────────────────────────────────────────────────────────
DO $$
DECLARE
  gds2_id UUID;
BEGIN
  INSERT INTO orders (
    order_no, order_type, client_name, description,
    order_date, entry_date,
    total_value_incl_gst, base_value, gst_rate, cgst_amount, sgst_amount,
    tds_applicable, tds_rate, tds_deducted_total, status, notes
  ) VALUES (
    'GDS-002', 'goods',
    'AutoREX Implementation — Update Client Name',
    'Supply of Sensors for AutoREX implementation',
    '2026-03-30', '2026-03-30',
    57192.24, 48468.00, 18.00, 4362.12, 4362.12,
    false, 0.00, 0.00, 'active',
    'New order received 30 Mar 2026. Full amount pending.'
  ) RETURNING id INTO gds2_id;

  -- Single stage: full payment pending
  INSERT INTO order_payment_stages (
    order_id, stage_number, stage_name, percentage,
    amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
    trigger_condition, status
  ) VALUES (
    gds2_id, 1, 'Full Payment on Delivery', 100.00,
    48468.00, 8724.24, 0.00, 0.00, 57192.24,
    'On delivery', 'pending'
  );
END $$;
