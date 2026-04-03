-- ============================================================
-- Restructure Orders — Accurate picture of India Zinc work
-- ============================================================
-- Orders kept:
--   SVC-001  Main service contract ₹10L (unchanged)
--   SVC-002  Plumbing work ₹80,000 (was Bus Bending & Plumbing ₹1L)
--   SVC-005  Copper Bus Bar Bending & Drilling ₹25,000 (new)
--   SVC-006  AutoREX Implementation (complimentary, new)
--   GDS-001  Lead Anodes + Al Cathode (unchanged)
--   GDS-002  Full Sensor Package ₹48,468 (consolidated from GDS-002 + GDS-002-2)
-- Reimbursements (excluded from orders view):
--   SVC-003, SVC-004, GDS-003
-- ============================================================

-- ── 1. Add order_category column ─────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_category TEXT NOT NULL DEFAULT 'order'
  CHECK (order_category IN ('order', 'reimbursement', 'complimentary'));

-- ── 2. Mark reimbursements ────────────────────────────────────
UPDATE orders
SET order_category = 'reimbursement'
WHERE order_no IN ('SVC-003', 'SVC-004', 'GDS-003');

-- ── 3. Update SVC-002 → Plumbing only, ₹80,000 ───────────────
UPDATE orders SET
  description          = 'Plumbing Work — India Zinc Project Site',
  base_value           = 80000.00,
  gst_rate             = 18.00,
  cgst_amount          = 7200.00,
  sgst_amount          = 7200.00,
  igst_amount          = 0.00,
  total_value_incl_gst = 94400.00,
  hsn_sac_code         = '9954',
  status               = 'active',
  notes                = '₹50,000 received in cash. Balance ₹30,000 + GST ₹14,400 = ₹44,400 pending on invoicing.',
  customer_id          = (SELECT id FROM customers WHERE customer_id = 'CUST-001')
WHERE order_no = 'SVC-002';

-- Clear and recreate payment stages for SVC-002 (payments first — FK constraint)
DELETE FROM order_payments
WHERE order_id = (SELECT id FROM orders WHERE order_no = 'SVC-002');

DELETE FROM order_payment_stages
WHERE order_id = (SELECT id FROM orders WHERE order_no = 'SVC-002');

INSERT INTO order_payment_stages (
  order_id, stage_number, stage_name, percentage,
  amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
  trigger_condition, status
) VALUES
  (
    (SELECT id FROM orders WHERE order_no = 'SVC-002'),
    1, 'Cash Advance Received', 62.50,
    50000.00, 0.00, 0.00, 0.00, 50000.00,
    'Cash received at commencement',
    'paid'
  ),
  (
    (SELECT id FROM orders WHERE order_no = 'SVC-002'),
    2, 'Balance on Invoicing', 37.50,
    30000.00, 14400.00, 0.00, 0.00, 44400.00,
    'On raising invoice after completion',
    'pending'
  );

-- Re-insert ₹50,000 cash payment for SVC-002

INSERT INTO order_payments (
  order_id, payment_date, amount_received, tds_deducted, net_received,
  payment_mode, reference_no, notes
) VALUES (
  (SELECT id FROM orders WHERE order_no = 'SVC-002'),
  '2026-02-01',
  50000.00, 0.00, 50000.00,
  'Cash', '',
  'Cash advance for plumbing work'
);

-- ── 4. Insert SVC-005: Copper Bus Bar Bending & Drilling ──────
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
  'SVC-005', 'service', 'order',
  'M/s India Zinc Inc', '33BZWPS7278C2ZN',
  'No. 224, 1A/1B/1A, 1st Floor, Venkiteshwara Nagar, Vadaperambakkam, Puzhal Village, Madhavaram, Chennai – 600060, Tamil Nadu, India',
  'Mr. Sabare Alam, Director & CEO',
  'Copper Bus Bar Bending, Drilling and Fabrication as per Customer Requirement',
  '2026-02-01', '2026-04-03',
  25000.00, 18.00, 2250.00, 2250.00, 0.00,
  29500.00,
  false, 0.00, 0.00,
  'Tamil Nadu (33)', '9988',
  'active',
  '₹20,000 received. Pending: Bus Bar Drawing ₹5,000 + GST ₹4,500 = ₹9,500.',
  (SELECT id FROM customers WHERE customer_id = 'CUST-001')
) ON CONFLICT (order_no) DO NOTHING;

INSERT INTO order_payment_stages (
  order_id, stage_number, stage_name, percentage,
  amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
  trigger_condition, status
)
SELECT
  id, 1, 'Advance — Fabrication Work', 80.00,
  20000.00, 0.00, 0.00, 0.00, 20000.00,
  'On delivery of fabricated bus bars',
  'paid'
FROM orders WHERE order_no = 'SVC-005'
  AND NOT EXISTS (
    SELECT 1 FROM order_payment_stages ops
    WHERE ops.order_id = (SELECT id FROM orders WHERE order_no = 'SVC-005')
  );

INSERT INTO order_payment_stages (
  order_id, stage_number, stage_name, percentage,
  amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
  trigger_condition, status
)
SELECT
  id, 2, 'Balance — Drawing & GST', 20.00,
  5000.00, 4500.00, 0.00, 0.00, 9500.00,
  'On submission of fabrication drawing and invoicing',
  'pending'
FROM orders WHERE order_no = 'SVC-005'
  AND NOT EXISTS (
    SELECT 1 FROM order_payment_stages ops
    WHERE ops.order_id = (SELECT id FROM orders WHERE order_no = 'SVC-005')
      AND ops.stage_number = 2
  );

INSERT INTO order_payments (
  order_id, payment_date, amount_received, tds_deducted, net_received,
  payment_mode, reference_no, notes
)
SELECT
  id, '2026-03-31',
  20000.00, 0.00, 20000.00,
  'Cash', '',
  'Payment for bus bar bending, drilling and fabrication work'
FROM orders WHERE order_no = 'SVC-005'
  AND NOT EXISTS (
    SELECT 1 FROM order_payments op
    WHERE op.order_id = (SELECT id FROM orders WHERE order_no = 'SVC-005')
  );

-- ── 5. Insert SVC-006: AutoREX Implementation (Complimentary) ─
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
  'SVC-006', 'service', 'complimentary',
  'M/s India Zinc Inc', '33BZWPS7278C2ZN',
  'No. 224, 1A/1B/1A, 1st Floor, Venkiteshwara Nagar, Vadaperambakkam, Puzhal Village, Madhavaram, Chennai – 600060, Tamil Nadu, India',
  'Mr. Sabare Alam, Director & CEO',
  'AutoREX Implementation — Complimentary with 1-Year Upgradation Support',
  '2026-01-31', '2026-04-03',
  0.00, 0.00, 0.00, 0.00, 0.00,
  0.00,
  false, 0.00, 0.00,
  'Tamil Nadu (33)',
  'active',
  'AutoREX system implementation and commissioning provided as complimentary service. Includes 1-year software upgradation and technical support.',
  (SELECT id FROM customers WHERE customer_id = 'CUST-001')
) ON CONFLICT (order_no) DO NOTHING;

-- ── 6. Consolidate GDS-002 — Full Sensor Package ─────────────

-- Cancel GDS-002-2 (was split; merging back)
UPDATE orders SET
  status = 'cancelled',
  notes  = 'Merged back into GDS-002. Full sensor order consolidated into single entry.'
WHERE order_no = 'GDS-002-2';

-- Restore GDS-002 to full package value
UPDATE orders SET
  description          = 'Supply of Instruments and Sensors for AutoREX Implementation — Full Package',
  base_value           = 48468.00,
  gst_rate             = 18.00,
  cgst_amount          = 4362.12,
  sgst_amount          = 4362.12,
  igst_amount          = 0.00,
  total_value_incl_gst = 57192.24,
  advance_note         = 'Full advance ₹57,192.24 received 30 Mar 2026. All items delivered except Float & Board Level Indicator (ETA 1–2 weeks).',
  items = $$[
    {
      "description": "Temperature Transmitter with Thermocouple",
      "qty": "9 Nos",
      "unit_price": 1879.50,
      "hsn": "9032",
      "base": 16915.50,
      "cgst": 1522.40,
      "sgst": 1522.39,
      "igst": 0,
      "total": 19960.29,
      "delivered": true,
      "delivered_qty": "9 Nos"
    },
    {
      "description": "Pressure Transmitter (0–4 Bar)",
      "qty": "5 Nos",
      "unit_price": 3675.00,
      "hsn": "9026",
      "base": 18375.00,
      "cgst": 1653.75,
      "sgst": 1653.75,
      "igst": 0,
      "total": 21682.50,
      "delivered": true,
      "delivered_qty": "5 Nos"
    },
    {
      "description": "Float & Board Level Indicator",
      "qty": "1 No",
      "unit_price": 11287.50,
      "hsn": "9032",
      "base": 11287.50,
      "cgst": 1015.88,
      "sgst": 1015.87,
      "igst": 0,
      "total": 13319.25,
      "delivered": false,
      "delivery_eta": "1-2 weeks"
    },
    {
      "description": "Infrared Industrial Thermometer (UT 300S)",
      "qty": "1 No",
      "unit_price": 1890.00,
      "hsn": "9025",
      "base": 1890.00,
      "cgst": 170.10,
      "sgst": 170.10,
      "igst": 0,
      "total": 2230.20,
      "delivered": true,
      "delivered_qty": "1 No"
    }
  ]$$::jsonb,
  notes = 'Consolidated sensor order for AutoREX implementation. All delivered except Float & Board Level Indicator (pending 1–2 weeks). Full advance ₹57,192.24 received 30 Mar 2026.'
WHERE order_no = 'GDS-002';

-- Rebuild GDS-002 payment stage (payments first — FK constraint)
DELETE FROM order_payments
WHERE order_id = (SELECT id FROM orders WHERE order_no = 'GDS-002');

DELETE FROM order_payment_stages
WHERE order_id = (SELECT id FROM orders WHERE order_no = 'GDS-002');

INSERT INTO order_payment_stages (
  order_id, stage_number, stage_name, percentage,
  amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
  trigger_condition, status
) VALUES (
  (SELECT id FROM orders WHERE order_no = 'GDS-002'),
  1, 'Full Advance Received', 100.00,
  48468.00, 8724.24, 0.00, 0.00, 57192.24,
  'Full advance received on 30 Mar 2026',
  'paid'
);

INSERT INTO order_payments (
  order_id, payment_date, amount_received, tds_deducted, net_received,
  payment_mode, reference_no, notes
) VALUES (
  (SELECT id FROM orders WHERE order_no = 'GDS-002'),
  '2026-03-30',
  57192.24, 0.00, 57192.24,
  'NEFT', '',
  'Full advance for complete sensor package. NEFT received 30 Mar 2026 as part of ₹82,320 transfer from India Zinc.'
);
