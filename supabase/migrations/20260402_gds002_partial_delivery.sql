-- ============================================================
-- GDS-002: Update to partial delivery invoice (31 Mar 2026)
-- Delivered: 3 Pressure Transmitters + 9 Temp Transmitters + 1 Thermometer
-- Pending:   2 Pressure Transmitters + 1 Float & Board Level Indicator
-- Full advance ₹57,192.24 received on 30 Mar 2026
-- ============================================================

-- Update GDS-002 to reflect actual delivery only
UPDATE orders SET
  base_value           = 29830.50,
  cgst_amount          = 2684.75,
  sgst_amount          = 2684.74,
  igst_amount          = 0.00,
  total_value_incl_gst = 35199.99,
  description          = 'Supply of Instruments and Sensors for AutoREX Implementation (Partial Delivery):
  1.  Pressure Transmitter (0–4 Bar)            —  3 Nos  ×  ₹3,675.00    =  ₹11,025.00
  2.  Temperature Transmitter + Thermocouple    —  9 Nos  ×  ₹1,879.50   =  ₹16,915.50
  3.  Thermometer (UT 300S)                     —  1 No   ×  ₹1,890.00    =   ₹1,890.00',
  advance_note         = 'Full advance of ₹57,192.24 received on 30.03.2026 against proforma for 5 Nos Pressure Transmitters, 9 Nos Temp Transmitters + Thermocouples, 1 No Float & Board Level Indicator and 1 No Thermometer. This invoice covers partial delivery. Balance advance ₹21,992.25 applicable to pending delivery (2 Nos Pressure Transmitter + 1 No Float & Board Level Indicator — to be invoiced separately as GDS-002-2).',
  notes                = 'Partial delivery. Pending: 2 Nos Pressure Transmitter (0-4 Bar) + 1 No Float & Board Level Indicator. Full proforma value ₹57,192.24 incl GST. Full advance received 30 Mar 2026.'
WHERE order_no = 'GDS-002';

-- Update payment stage to match actual delivery value
UPDATE order_payment_stages SET
  amount_due     = 29830.50,
  gst_on_stage   = 5369.49,
  net_receivable = 35199.99
WHERE order_id = (SELECT id FROM orders WHERE order_no = 'GDS-002');

-- ============================================================
-- GDS-002-2: Pending delivery order (to be invoiced on delivery)
-- 2 Nos Pressure Transmitter (0–4 Bar) + 1 No Float & Board Level Indicator
-- ============================================================
INSERT INTO orders (
  order_no, order_type, client_name, client_gstin, client_address, client_contact,
  description,
  order_date, entry_date,
  total_value_incl_gst, base_value, gst_rate, cgst_amount, sgst_amount, igst_amount,
  tds_applicable, tds_rate, tds_deducted_total,
  place_of_supply, hsn_sac_code, status, notes
) VALUES (
  'GDS-002-2',
  'goods',
  'M/s India Zinc Inc',
  '33BZWPS7278C2ZN',
  'No. 224, 1A/1B/1A, 1st Floor, Venkiteshwara Nagar, Vadaperumbakkam, Puzhal Village, Madhavaram, Chennai – 600060, Tamil Nadu, India',
  'Mr. Sabare Alam, Proprietor / Director & CEO',
  'Supply of Instruments for AutoREX Implementation (Balance Delivery — GDS-002):
  1.  Pressure Transmitter (0–4 Bar)            —  2 Nos  ×  ₹3,675.00    =   ₹7,350.00
  2.  Float & Board Level Indicator             —  1 No   ×  ₹11,287.50  =  ₹11,287.50',
  '2026-03-30',
  '2026-04-02',
  21992.25,
  18637.50,
  18.00,
  1677.38,
  1677.37,
  0.00,
  false, 0.00, 0.00,
  'Tamil Nadu (33)',
  '9026',
  'active',
  'Pending delivery under GDS-002 proforma. Advance already received (₹21,992.25 balance from ₹57,192.24 paid on 30 Mar 2026). Invoice to be raised on delivery. Float & Board Level Indicator in stock — deliver at earliest.'
)
ON CONFLICT (order_no) DO NOTHING;

INSERT INTO order_payment_stages (
  order_id, stage_number, stage_name, percentage,
  amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
  trigger_condition, status
) VALUES (
  (SELECT id FROM orders WHERE order_no = 'GDS-002-2'),
  1, 'Full Payment on Delivery', 100.00,
  18637.50, 3354.75, 0.00, 0.00, 21992.25,
  'On delivery of 2 Nos Pressure Transmitter + 1 No Float & Board Level Indicator',
  'pending'
);
