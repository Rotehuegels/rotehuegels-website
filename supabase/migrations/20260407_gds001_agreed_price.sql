-- ============================================================
-- GDS-001: Correct to agreed all-in price
-- Goods (anodes + cathodes): ₹7,10,000 all-in (fully paid by advance)
-- Delivery: ₹20,000 incl. GST (pending)
-- Grand total: ₹7,30,000 | Received: ₹7,10,000 | Pending: ₹20,000
--
-- Cathodes: ₹3,50,000 total → base ₹2,96,610.17 + CGST ₹26,694.92 + SGST ₹26,694.91
-- Anodes:   ₹3,60,000 total → base ₹3,05,084.75 + CGST ₹27,457.63 + SGST ₹27,457.62
-- Delivery: ₹20,000  total → base ₹16,949.15   + CGST ₹1,525.42  + SGST ₹1,525.43
-- ============================================================

UPDATE orders SET
  base_value           = 618644.07,
  cgst_amount          = 55677.97,
  sgst_amount          = 55677.96,
  igst_amount          = 0.00,
  total_value_incl_gst = 730000.00,
  advance_note         = 'Advance of ₹7,10,000 received on 1 Feb 2026 — full payment for goods (anodes and cathodes). Net balance due on this invoice: ₹20,000 (delivery charges only).',
  items = $$[
    {
      "description": "High Purity Aluminium Cathode (Custom Fabricated)\nRef. Drawing: ZDP0002 V04 (27 Nov 2025)\nSpec: 520 mm (W) × 1100 mm (H) × 5 mm (T), Al header 1100 mm (L) × 50 mm (W), Cu tips 20 × 60 mm, horizontal configuration, PVC strips at both ends for easy zinc stripping\nIncludes: \"Rotehuegels\" branding on headers/tags; heavy-duty packing",
      "qty": "12 Nos",
      "hsn": "76061110",
      "base": 296610.17,
      "cgst": 26694.92,
      "sgst": 26694.91,
      "igst": 0,
      "total": 350000.00
    },
    {
      "description": "High Purity Lead Anodes (Custom Fabricated)\nRef. Drawing: ZDP0003 V05 (13 Mar 2026) — Rev. updated from V04: bus bar 40 mm × 16 mm used vs. customer-approved 35 mm × 15 mm (heavier cross-section)\nSpec: 520 mm (W) × 1100 mm (H) × 6 mm (T), Cu bus bar 40 mm (T) × 16 mm (W) × 1000 mm (L) with 5 mm Pb overlay, Cu tips 30 × 60 mm, Pb removed on one side at bottom for electrical contact",
      "qty": "12 Nos",
      "hsn": "78041110",
      "base": 305084.75,
      "cgst": 27457.63,
      "sgst": 27457.62,
      "igst": 0,
      "total": 360000.00
    },
    {
      "description": "Freight, Packing and Delivery Charges\nDelivery to site: India Zinc Project, Madhavaram, Chennai",
      "qty": "1 Lot",
      "hsn": "9965",
      "base": 16949.15,
      "cgst": 1525.42,
      "sgst": 1525.43,
      "igst": 0,
      "total": 20000.00
    }
  ]$$::jsonb
WHERE order_no = 'GDS-001';

-- Stage 1 advance: update to reflect full goods payment
UPDATE order_payment_stages SET
  stage_name     = 'Full Advance — Goods (Anodes & Cathodes)',
  amount_due     = 710000.00,
  gst_on_stage   = 0.00,
  net_receivable = 710000.00
WHERE order_id     = (SELECT id FROM orders WHERE order_no = 'GDS-001')
  AND stage_number = 1;

-- Stage 2 balance: delivery charges only
UPDATE order_payment_stages SET
  stage_name     = 'Balance — Delivery Charges',
  amount_due     = 20000.00,
  gst_on_stage   = 0.00,
  net_receivable = 20000.00,
  trigger_condition = 'On delivery to site'
WHERE order_id     = (SELECT id FROM orders WHERE order_no = 'GDS-001')
  AND stage_number = 2;
