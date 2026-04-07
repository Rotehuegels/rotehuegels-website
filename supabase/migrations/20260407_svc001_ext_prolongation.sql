-- ============================================================
-- SVC-001-EXT: Extension / Prolongation Charges
-- Supplementary invoice to SVC-001 (India Zinc main contract)
-- ₹2,00,000 base + 18% GST = ₹2,36,000 | Invoice date: 31 Mar 2026
-- TDS @ 2% (194C) = ₹4,000 | Net receivable: ₹2,32,000
-- ============================================================

INSERT INTO orders (
  order_no, order_type, order_category,
  client_name, client_gstin, client_address, client_contact,
  description, order_date, invoice_date, entry_date,
  base_value, gst_rate, cgst_amount, sgst_amount, igst_amount,
  total_value_incl_gst,
  tds_applicable, tds_rate, tds_deducted_total,
  place_of_supply, hsn_sac_code, status,
  advance_note, notes,
  customer_id
) VALUES (
  'SVC-001-EXT', 'service', 'order',
  'M/s India Zinc Inc', '33BZWPS7278C2ZN',
  'No. 224, 1A/1B/1A, 1st Floor, Venkiteshwara Nagar, Vadaperumbakkam, Puzhal Village, Madhavaram, Chennai – 600060, Tamil Nadu, India',
  'Mr. Sabare Alam, Director & CEO',
  'Extension / Prolongation Charges — Supplementary to Service Order SVC-001 (Plumbing, Electrical Installation and Water System Commissioning)',
  '2026-03-31', '2026-03-31', '2026-04-07',
  200000.00, 18.00, 18000.00, 18000.00, 0.00,
  236000.00,
  true, 2.00, 0.00,
  'Tamil Nadu (33)', '9983', 'active',
  'Supplementary charge raised against original order SVC-001 dated 2025-01-01. Extension and prolongation of commissioning scope as mutually agreed.',
  'Extension/prolongation charge ₹2,36,000 (incl. GST) pending. TDS @ 2% (194C) = ₹4,000. Net receivable ₹2,32,000.',
  (SELECT id FROM customers WHERE customer_id = 'CUST-001')
) ON CONFLICT (order_no) DO NOTHING;

-- Single payment stage — full amount pending
INSERT INTO order_payment_stages (
  order_id, stage_number, stage_name, percentage,
  amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
  trigger_condition, status, invoice_date
) VALUES (
  (SELECT id FROM orders WHERE order_no = 'SVC-001-EXT'),
  1, 'Full Payment — Extension Charges', 100.00,
  200000.00, 36000.00, 2.00, 4000.00, 232000.00,
  'On invoicing (31 Mar 2026)',
  'pending', '2026-03-31'
);
