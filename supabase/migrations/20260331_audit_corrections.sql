-- ============================================================
-- Rotehügels — Audit Corrections + Missing Records
-- 31 Mar 2026
-- Based on bank statement reconciliation
-- ============================================================


-- ─── 1. FIX SVC-001: ORDER DATE + PAYMENT RECORDS ───────────
-- Bank confirms Stage 1 advance received 8 Oct 2025.
-- Stage 2 paid in two parts: ₹3L (16 Dec 2025) + ₹1L (2 Jan 2026).
-- GST settlement (stages 1+2): ₹1,44,000 − ₹16,000 TDS = ₹1,28,000 on 29 Jan 2026.

DO $$
DECLARE
  svc_id UUID;
  s1_id  UUID;
  s2_id  UUID;
BEGIN
  SELECT id INTO svc_id FROM orders WHERE order_no = 'SVC-001';
  SELECT id INTO s1_id  FROM order_payment_stages WHERE order_id = svc_id AND stage_number = 1;
  SELECT id INTO s2_id  FROM order_payment_stages WHERE order_id = svc_id AND stage_number = 2;

  -- Correct the order/entry date (was placeholder 2025-01-01)
  UPDATE orders
  SET order_date = '2025-10-08', entry_date = '2025-10-08',
      client_name = 'India Zinc Inc',
      notes = 'Three-stage payment: 40% advance on 8 Oct 2025 | 40% equipment setup (₹3L on 16 Dec 2025 + ₹1L on 2 Jan 2026) | 20% water testing pending. GST settled 29 Jan 2026. TDS ₹16,000 total deducted under 194C.'
  WHERE id = svc_id;

  -- Delete existing placeholder payment records
  DELETE FROM order_payments WHERE order_id = svc_id;

  -- Stage 1: ₹4,00,000 base received 8 Oct 2025
  -- Client had no GSTIN at order placement; GST paid separately on 29 Jan 2026
  INSERT INTO order_payments (
    order_id, stage_id, payment_date,
    amount_received, tds_deducted, net_received, notes
  ) VALUES (
    svc_id, s1_id, '2025-10-08',
    400000.00, 0.00, 400000.00,
    '40% advance — base only (₹4,00,000). Client had no GSTIN; GST ₹72,000 collected separately on 29 Jan 2026.'
  );

  -- Stage 2 Part A: ₹3,00,000 received 16 Dec 2025
  INSERT INTO order_payments (
    order_id, stage_id, payment_date,
    amount_received, tds_deducted, net_received, notes
  ) VALUES (
    svc_id, s2_id, '2025-12-16',
    300000.00, 0.00, 300000.00,
    'Stage 2 partial — ₹3,00,000 of ₹4,00,000 base. RTGS from Standard Chartered.'
  );

  -- Stage 2 Part B: ₹1,00,000 received 2 Jan 2026
  INSERT INTO order_payments (
    order_id, stage_id, payment_date,
    amount_received, tds_deducted, net_received, notes
  ) VALUES (
    svc_id, s2_id, '2026-01-02',
    100000.00, 0.00, 100000.00,
    'Stage 2 balance — ₹1,00,000. Stage 2 base now fully received. NEFT from Standard Chartered.'
  );

  -- GST settlement covering stages 1+2 (received 29 Jan 2026)
  -- GST due: ₹72,000 × 2 = ₹1,44,000 | TDS 2% on ₹8,00,000 base = ₹16,000 | Net: ₹1,28,000
  INSERT INTO order_payments (
    order_id, stage_id, payment_date,
    amount_received, tds_deducted, net_received, notes
  ) VALUES (
    svc_id, s2_id, '2026-01-29',
    144000.00, 16000.00, 128000.00,
    'GST settlement for Stages 1+2 (₹72,000 × 2 = ₹1,44,000). TDS ₹16,000 deducted by India Zinc under 194C (2% on ₹8,00,000 base). Net received ₹1,28,000. NEFT from Standard Chartered.'
  );

  -- ₹14,098 received 3 Mar 2026 — India Zinc materials reimbursement (purpose TBC)
  INSERT INTO order_payments (
    order_id, stage_id, payment_date,
    amount_received, tds_deducted, net_received, notes
  ) VALUES (
    svc_id, s2_id, '2026-03-03',
    14098.00, 0.00, 14098.00,
    'Materials reimbursement from India Zinc — purpose not yet confirmed. NEFT ref SCBLH06200685362. Park against Stage 2 until clarified.'
  );
END $$;


-- ─── 2. MARK GDS-002 AS PAID ─────────────────────────────────
-- AutoREX sensors ₹57,192.24 — received 30 Mar 2026
-- Part of ₹82,320 NEFT from India Zinc

DO $$
DECLARE
  gds2_id UUID;
  s1_id   UUID;
BEGIN
  SELECT id INTO gds2_id FROM orders WHERE order_no = 'GDS-002';
  SELECT id INTO s1_id   FROM order_payment_stages WHERE order_id = gds2_id AND stage_number = 1;

  UPDATE orders SET status = 'completed', client_name = 'India Zinc Inc' WHERE id = gds2_id;
  UPDATE order_payment_stages SET status = 'paid' WHERE id = s1_id;

  INSERT INTO order_payments (
    order_id, stage_id, payment_date,
    amount_received, tds_deducted, net_received, notes
  ) VALUES (
    gds2_id, s1_id, '2026-03-30',
    57192.24, 0.00, 57192.24,
    'Full payment received. Part of ₹82,320 NEFT from India Zinc (₹25,127.76 balance was for CPVC pipe procurement — see GDS-003).'
  );
END $$;


-- ─── 3. UPDATE SVC-003: CLIENT + MARK PAID ───────────────────
-- Phulchand Export paid ₹5,000 on 6 Feb 2026 for Zamin Group travel reimbursement
-- Pure reimbursement at cost — no GST charged

DO $$
DECLARE
  svc3_id UUID;
  s1_id   UUID;
BEGIN
  SELECT id INTO svc3_id FROM orders WHERE order_no = 'SVC-003';
  SELECT id INTO s1_id   FROM order_payment_stages WHERE order_id = svc3_id AND stage_number = 1;

  UPDATE orders
  SET client_name           = 'Phulchand Export',
      total_value_incl_gst  = 5000.00,
      base_value            = 5000.00,
      gst_rate              = 0.00,
      cgst_amount           = 0.00,
      sgst_amount           = 0.00,
      status                = 'completed',
      notes                 = 'Travel expense reimbursement for Zamin Group Founder Meet (Chile consultation). Paid by Phulchand Export on 6 Feb 2026 via NEFT (Kotak Bank). Pure reimbursement at cost — no GST.'
  WHERE id = svc3_id;

  UPDATE order_payment_stages
  SET amount_due = 5000.00, gst_on_stage = 0.00, net_receivable = 5000.00, status = 'paid'
  WHERE id = s1_id;

  INSERT INTO order_payments (
    order_id, stage_id, payment_date,
    amount_received, tds_deducted, net_received, notes
  ) VALUES (
    svc3_id, s1_id, '2026-02-06',
    5000.00, 0.00, 5000.00,
    'Full reimbursement received from Phulchand Export. NEFT from Kotak Bank (ref KKBKH26037834379).'
  );
END $$;


-- ─── 4. NEW ORDER GDS-003: CPVC PIPE PROCUREMENT ─────────────
-- Rotehügels procured CPVC pipes from National Tubes And Valves (₹25,127)
-- and supplied to India Zinc site — reimbursed ₹25,127.76 on 30 Mar 2026

DO $$
DECLARE
  gds3_id UUID;
  s1_id   UUID;
BEGIN
  INSERT INTO orders (
    order_no, order_type, client_name, description,
    order_date, entry_date,
    total_value_incl_gst, base_value, gst_rate, cgst_amount, sgst_amount,
    tds_applicable, tds_rate, tds_deducted_total, status, notes
  ) VALUES (
    'GDS-003', 'goods',
    'India Zinc Inc',
    'CPVC Pipe Procurement — supply of CPVC pipes and fittings for India Zinc project site',
    '2026-03-30', '2026-03-31',
    25127.76, 21294.71, 18.00, 1916.52, 1916.52,
    false, 0.00, 0.00, 'completed',
    'Procured from National Tubes And Valves (paid ₹25,127 on 30 Mar 2026). Reimbursed by India Zinc at ₹25,127.76 as part of ₹82,320 NEFT (balance after ₹57,192.24 for GDS-002 sensors).'
  ) RETURNING id INTO gds3_id;

  INSERT INTO order_payment_stages (
    order_id, stage_number, stage_name, percentage,
    amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
    trigger_condition, status
  ) VALUES (
    gds3_id, 1, 'Full Reimbursement on Procurement', 100.00,
    21294.71, 3832.20, 0.00, 0.00, 25127.76,
    'On procurement and delivery to site', 'paid'
  ) RETURNING id INTO s1_id;

  INSERT INTO order_payments (
    order_id, stage_id, payment_date,
    amount_received, tds_deducted, net_received, notes
  ) VALUES (
    gds3_id, s1_id, '2026-03-30',
    25127.76, 0.00, 25127.76,
    'Reimbursement from India Zinc — part of ₹82,320 NEFT (SCBLH08901718244), balance after ₹57,192.24 for AutoREX sensors.'
  );
END $$;


-- ─── 5. MISSING EXPENSES ─────────────────────────────────────

INSERT INTO expenses (
  expense_type, category, description, vendor_name,
  amount, gst_input_credit, expense_date, payment_mode, notes
) VALUES

-- Auditor fee — 31 Oct 2025 (bank: IMPS ₹2,950 to IOBA Auditor)
('other', 'Professional Fees',
  'Auditor Fee — FY 2025-26',
  'Auditor',
  2500.00, 450.00, '2025-10-31', 'IMPS',
  'CGST ₹225 + SGST ₹225 | Total ₹2,950 | Paid via IMPS to IOB account'),

-- Plumbing work — 6 Mar 2026 (bank: IMPS ₹33,634 — "Plumbing" in description)
('other', 'Labour & Job Work',
  'Plumbing Work — India Zinc Site (SVC-001)',
  'Plumber (site contractor)',
  33634.00, 0.00, '2026-03-06', 'IMPS',
  'Plumbing work at India Zinc project site for SVC-001. Paid via IMPS ₹33,634. No GST (informal/unregistered contractor).'),

-- National Tubes And Valves — CPVC pipes — 30 Mar 2026
('purchase', 'Raw Materials',
  'CPVC Pipes and Fittings — GDS-003 (India Zinc site)',
  'National Tubes And Valves',
  21294.07, 3832.93, '2026-03-30', 'NEFT',
  'CGST ₹1,916.47 + SGST ₹1,916.47 | Total paid ₹25,127 | Procured for India Zinc site. Reimbursed by India Zinc (GDS-003).'),

-- Bank maintenance charges — 12 Mar 2026
('other', 'Bank Charges',
  'A/C Maintenance Charges — Mar 2026 (mid)',
  'State Bank of India',
  0.29, 0.00, '2026-03-12', 'Bank Debit',
  'Account keeping charges auto-debited'),

-- Bank maintenance charges — 30 Mar 2026
('other', 'Bank Charges',
  'A/C Maintenance Charges — Mar 2026 (quarter end)',
  'State Bank of India',
  291.15, 0.00, '2026-03-30', 'Bank Debit',
  'Account keeping charges auto-debited | Total bank charges FY 2025-26: ₹291.44'),

-- Tamilnad Aluminium refund — 18 Feb 2026 (credit against GDS-001 material cost)
('purchase', 'Raw Materials',
  'Tamilnad Aluminium — Partial Refund (GDS-001)',
  'Tamilnad Aluminium Company',
  -12318.27, -2217.28, '2026-02-18', 'UPI',
  'Refund of ₹14,535.55 received via UPI (tamilnadal). Reversed at base ₹12,318.27 + GST ₹2,217.28. ITC reversed accordingly. Net against earlier aluminium purchases for GDS-001.');
