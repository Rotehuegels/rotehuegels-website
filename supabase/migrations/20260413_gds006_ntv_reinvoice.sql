-- GDS-004: Zero-margin re-invoice of NTV materials + labour to India Zinc Inc
-- Supplier: National Tubes and Valves (PI/17/26-27 dated 11-Apr + NTV/0104/26-27 dated 13-Apr)
-- Re-invoiced at cost (no margin) so customer can claim GST input credit

INSERT INTO orders (
  order_no, order_type, order_category,
  client_name, client_gstin, client_pan, client_address, client_contact,
  description, order_date, invoice_date, entry_date, delivery_date,
  base_value, gst_rate, cgst_amount, sgst_amount, igst_amount,
  total_value_incl_gst, tds_applicable, tds_rate,
  place_of_supply, hsn_sac_code, status, notes,
  items
) VALUES (
  'GDS-004', 'goods', 'order',
  'M/s India Zinc Inc',
  '33BZWPS7278C2ZN',
  'BZWPS7278C',
  'No. 224, 1A/1B/1A, 1st Floor, Venkiteshwara Nagar, Vadaperumbakkam, Puzhal Village, Madhavaram, Chennai – 600060, Tamil Nadu, India',
  'Mr. Sabare Alam, Director & CEO',
  'Supply of CPVC Piping, Fittings, MS Pipes, Transportation & Plumbing Labour for India Zinc ETP/Plant Site',
  '2026-04-13',
  '2026-04-13',
  '2026-04-13',
  '2026-04-13',
  56775.30,
  18,
  5109.78,
  5109.78,
  0,
  66995.00,
  false,
  0,
  'Tamil Nadu (33)',
  '3917',
  'active',
  'Zero-margin re-invoice of materials purchased from National Tubes and Valves (PI/17/26-27 dt. 11-Apr-26 + NTV/0104/26-27 dt. 13-Apr-26). Includes ₹2,000 delivery charges (paid cash) and ₹10,000 plumbing labour (1 day). No margin added — customer claims GST input credit on our invoice.',
  $$[
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
      "name": "Plumbing Labour Charges (1 Day)",
      "hsn_code": "998121",
      "quantity": 1,
      "unit": "Day",
      "rate": 10000.00,
      "taxable_amount": 10000.00,
      "gst_amount": 1800.00,
      "total": 11800.00
    }
  ]$$::jsonb
)
ON CONFLICT (order_no) DO UPDATE SET
  items               = EXCLUDED.items,
  base_value          = EXCLUDED.base_value,
  cgst_amount         = EXCLUDED.cgst_amount,
  sgst_amount         = EXCLUDED.sgst_amount,
  total_value_incl_gst = EXCLUDED.total_value_incl_gst,
  invoice_date        = EXCLUDED.invoice_date,
  notes               = EXCLUDED.notes;

-- Single payment stage: full amount due immediately
INSERT INTO order_payment_stages (
  order_id, stage_number, stage_name, percentage,
  amount_due, gst_on_stage, tds_rate, tds_amount, net_receivable,
  due_date, trigger_condition, status
)
SELECT
  id, 1, 'Full Payment', 100,
  56775.30, 10219.56, 0, 0, 66995.00,
  '2026-04-30', 'On delivery of materials', 'pending'
FROM orders WHERE order_no = 'GDS-004'
ON CONFLICT DO NOTHING;
