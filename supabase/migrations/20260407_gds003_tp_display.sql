-- ============================================================
-- GDS-003: Temperature & Pressure Display Panels + Rotameter
-- Converted from QT-2026-001 (approved by India Zinc)
-- Local display of T&P at measurement points (standalone,
--   independent of AutoREX central computer)
-- Base: ₹46,900.35 | GST 18%: ₹8,442.07 | Total: ₹55,342.42
-- Invoice date: 07 Apr 2026 (FY 2026-27) | Status: active, pending
-- ============================================================

-- Remove any pre-existing order with this number (e.g. misclassified reimbursement entry)
DELETE FROM order_payment_stages
WHERE order_id = (SELECT id FROM orders WHERE order_no = 'GDS-003');
DELETE FROM orders WHERE order_no = 'GDS-003';

INSERT INTO orders (
  order_no, order_type, order_category,
  client_name, client_gstin, client_address, client_contact,
  description, order_date, invoice_date, entry_date,
  base_value, gst_rate, cgst_amount, sgst_amount, igst_amount,
  total_value_incl_gst,
  tds_applicable, tds_rate, tds_deducted_total,
  place_of_supply, hsn_sac_code, status,
  notes,
  customer_id
) VALUES (
  'GDS-003', 'goods', 'order',
  'M/s India Zinc Inc', '33BZWPS7278C2ZN',
  'No. 224, 1A/1B/1A, 1st Floor, Venkiteshwara Nagar, Vadaperumbakkam, Puzhal Village, Madhavaram, Chennai – 600060, Tamil Nadu, India',
  'Mr. Sabare Alam, Director & CEO',
  'Supply of Temperature & Pressure Display cum Indicator Panels — Local Display at Point of Measurement: 5 Nos. Bigger Panel (Metal Box + Pressure Controller + Temperature Indicator), 4 Nos. Smaller Panel (Metal Box + Temperature Indicator), 1 No. Rotameter. Standalone local display system, independent of central computer.',
  '2026-04-07', '2026-04-07', '2026-04-07',
  46900.35, 18.00, 4221.04, 4221.03, 0.00,
  55342.42,
  false, 0.00, 0.00,
  'Tamil Nadu (33)', '8537', 'active',
  'Converted from QT-2026-001 (approved). Payment: 100% advance before dispatch. Full amount ₹55,342.42 pending.',
  (SELECT id FROM customers WHERE customer_id = 'CUST-001')
);
-- Note: delete any pre-existing order with same order_no before running this insert.
-- Pattern for all future order migrations:
--   DELETE FROM order_payment_stages WHERE order_id = (SELECT id FROM orders WHERE order_no = '...');
--   DELETE FROM orders WHERE order_no = '...';
--   Then INSERT.

-- Single payment stage — full amount pending
INSERT INTO order_payment_stages (
  order_id, stage_number, stage_name, percentage,
  amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
  trigger_condition, status, invoice_date
) VALUES (
  (SELECT id FROM orders WHERE order_no = 'GDS-003'),
  1, 'Full Payment — Advance Before Dispatch', 100.00,
  46900.35, 8442.07, 0.00, 0.00, 55342.42,
  '100% advance before dispatch',
  'pending', '2026-04-07'
);

-- Mark QT-2026-001 as converted
UPDATE quotes
SET status = 'converted'
WHERE quote_no = 'QT-2026-001';
