-- ============================================================
-- GDS-001: Add delivery / freight charge as extra line item
-- ₹20,000 incl. 18% GST → base ₹16,949.15 + CGST ₹1,525.42 + SGST ₹1,525.43
-- New order total: ₹8,38,440.05 + ₹20,000 = ₹8,58,440.05
-- New balance due: ₹1,28,440.05 + ₹20,000 = ₹1,48,440.05
-- ============================================================

UPDATE orders SET
  items = $$[
    {
      "description": "High Purity Aluminium Cathode (Custom Fabricated)\nRef. Drawing: ZDP0002 V04 (27 Nov 2025)\nSpec: 520 mm (W) × 1100 mm (H) × 5 mm (T), Al header 1100 mm (L) × 50 mm (W), Cu tips 20 × 60 mm, horizontal configuration, PVC strips at both ends for easy zinc stripping\nIncludes: \"Rotehuegels\" branding on headers/tags; heavy-duty packing and free delivery to site",
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
      "base": 413932.25,
      "cgst": 37253.90,
      "sgst": 37253.90,
      "igst": 0,
      "total": 488440.05
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
  ]$$::jsonb,
  base_value           = 727491.57,
  cgst_amount          = 65474.24,
  sgst_amount          = 65474.24,
  igst_amount          = 0.00,
  total_value_incl_gst = 858440.05,
  advance_note         = 'Advance of ₹7,10,000 received on 1 Feb 2026 at the time of order confirmation. Net balance due on this invoice: ₹1,48,440.05.'
WHERE order_no = 'GDS-001';

-- Update balance payment stage (lump-sum, no base/GST split)
UPDATE order_payment_stages SET
  amount_due     = 148440.05,
  net_receivable = 148440.05
WHERE order_id     = (SELECT id FROM orders WHERE order_no = 'GDS-001')
  AND stage_number = 2;
