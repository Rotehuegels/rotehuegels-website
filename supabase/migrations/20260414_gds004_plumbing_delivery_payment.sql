-- ============================================================
-- GDS-004: Add plumbing (14 Apr 2026) + record ₹1,838 payment
--
-- Changes:
--   1. Add: Plumbing Labour (14 Apr 2026) — ₹10,000 + GST = ₹11,800
--   2. Record: ₹1,838 payment received from India Zinc
--
-- Revised GDS-004: base ₹66,775.30 | total ₹78,795.00
--
-- Outstanding position (up to GDS-004):
--   GDS-004 revised       ₹78,795.00
--   Less: payment          -₹1,838.00
--   Less: GDS-002 excess   -₹2,887.00 (base credit from float price revision)
--   Net outstanding       ₹74,070.00
-- ============================================================

-- 1. Update GDS-004 items, totals, and notes
UPDATE orders SET
  items = $$[
    {
      "name": "PIPE CPVC IND GREY SCH-80 1½\"",
      "hsn_code": "39172390",
      "quantity": 6,
      "unit": "NOS",
      "rate": 5070.00,
      "discount": "30%",
      "taxable_amount": 21294.00,
      "gst_amount": 3832.92,
      "total": 25126.92
    },
    {
      "name": "FLANGE CPVC IND GREY 40MM 1½\"",
      "hsn_code": "39171000",
      "quantity": 40,
      "unit": "NOS",
      "rate": 644.00,
      "discount": "30%",
      "taxable_amount": 18032.00,
      "gst_amount": 3245.76,
      "total": 21277.76
    },
    {
      "name": "SOLVENT CPVC 500ML",
      "hsn_code": "35061000",
      "quantity": 2,
      "unit": "NOS",
      "rate": 1494.00,
      "discount": "15%",
      "taxable_amount": 2539.80,
      "gst_amount": 457.16,
      "total": 2996.96
    },
    {
      "name": "PIPE MS C CLASS JINDAL 25MM 1\"",
      "hsn_code": "73063090",
      "quantity": 6,
      "unit": "MTR",
      "rate": 221.00,
      "taxable_amount": 1326.00,
      "gst_amount": 238.68,
      "total": 1564.68
    },
    {
      "name": "ELBOW MS C 25MM 1\"",
      "hsn_code": "73079190",
      "quantity": 1,
      "unit": "NOS",
      "rate": 26.00,
      "taxable_amount": 26.00,
      "gst_amount": 4.68,
      "total": 30.68
    },
    {
      "name": "UNION CPVC IND GREY 40MM 1½\"",
      "hsn_code": "39171000",
      "quantity": 5,
      "unit": "NOS",
      "rate": 445.00,
      "discount": "30%",
      "taxable_amount": 1557.50,
      "gst_amount": 280.36,
      "total": 1837.86
    },
    {
      "name": "Transportation & Delivery Charges",
      "hsn_code": "996511",
      "quantity": 1,
      "unit": "LS",
      "rate": 2000.00,
      "taxable_amount": 2000.00,
      "gst_amount": 360.00,
      "total": 2360.00
    },
    {
      "name": "Plumbing Labour Charges (13 Apr 2026)",
      "hsn_code": "998121",
      "quantity": 1,
      "unit": "Day",
      "rate": 10000.00,
      "taxable_amount": 10000.00,
      "gst_amount": 1800.00,
      "total": 11800.00
    },
    {
      "name": "Plumbing Labour Charges (14 Apr 2026)",
      "hsn_code": "998121",
      "quantity": 1,
      "unit": "Day",
      "rate": 10000.00,
      "taxable_amount": 10000.00,
      "gst_amount": 1800.00,
      "total": 11800.00
    }
  ]$$::jsonb,
  -- Revised totals: 56775.30 + 10000 (plumbing 14 Apr) = 66775.30
  base_value           = 66775.30,
  cgst_amount          = 6009.78,
  sgst_amount          = 6009.77,
  igst_amount          = 0.00,
  total_value_incl_gst = 78794.85,
  customer_id          = (SELECT id FROM customers WHERE customer_id = 'CUST-001'),
  order_date           = '2026-04-14',
  invoice_date         = '2026-04-14',
  delivery_date        = '2026-04-15',
  description          = 'Supply of CPVC Piping, Fittings, MS Pipes, Transportation & Plumbing Labour for India Zinc ETP/Plant Site',
  notes                = 'Zero-margin re-invoice of materials purchased from National Tubes and Valves (PI/17/26-27 dt. 11-Apr-26 + NTV/0104/26-27 dt. 13-Apr-26). '
                         'Includes ₹2,000 delivery charges (paid cash), ₹10,000 plumbing labour (13 Apr), ₹10,000 plumbing labour (14 Apr). '
                         'No margin added — customer claims GST input credit on our invoice. '
                         'Payment received: ₹1,838 (for CPVC unions). '
                         'GDS-002 (FY 2025-26, closed): Float & Board Level Indicator was on hold — finalised 14 Apr 2026 with M/s Venkat Engineers at ₹8,400 + GST (PO placed). '
                         'Original GDS-002 float price ₹11,287.50 base — excess ₹2,887 (base) to be adjusted against this invoice. '
                         'Float delivery expected 20 Apr 2026 by M/s Venkat Engineers; delivery via Porter from Poonamallee — charges as applicable on that day (to be added to this invoice on delivery). '
                         'Net outstanding after excess credit and payment: customer to pay remaining balance.'
WHERE order_no = 'GDS-004';

-- 2. Update payment stage — revised total
UPDATE order_payment_stages SET
  amount_due     = 66775.30,
  gst_on_stage   = 12019.55,
  net_receivable = 78794.85,
  status         = 'partial'
WHERE order_id = (SELECT id FROM orders WHERE order_no = 'GDS-004')
  AND stage_number = 1;

-- 3. Record ₹1,838 payment received from India Zinc
INSERT INTO order_payments (
  order_id, payment_date, amount_received, tds_deducted, net_received,
  payment_mode, reference_no, notes
) VALUES (
  (SELECT id FROM orders WHERE order_no = 'GDS-004'),
  '2026-04-13',
  1838.00, 0.00, 1838.00,
  'Cash', '',
  'Partial payment for CPVC Unions (₹1,557.50 base + ₹280.36 GST = ₹1,838). Balance pending.'
);
