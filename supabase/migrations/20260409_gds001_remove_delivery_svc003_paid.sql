-- ── GDS-001: Remove ₹20,000 delivery charge (customer concession) ─────────────
-- Reverts to 2-item invoice: Cathode ₹3,50,000 + Anode ₹4,88,440.05 = ₹8,38,440.05

UPDATE orders SET
  items = $$[
    {
      "description": "High Purity Aluminium Cathode (Custom Fabricated)\nRef. Drawing: ZDP0002 V04 (27 Nov 2025)\nSpec: 520 mm (W) × 1100 mm (H) × 5 mm (T), Al header 1100 mm (L) × 50 mm (W), Cu tips 20 × 60 mm, horizontal configuration, PVC strips at both ends for easy zinc stripping\nIncludes: \"Rotehuegels\" branding on headers/tags; heavy-duty packing and delivery to site",
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
    }
  ]$$::jsonb,
  base_value           = 710542.42,
  cgst_amount          = 63948.82,
  sgst_amount          = 63948.81,
  igst_amount          = 0.00,
  total_value_incl_gst = 838440.05,
  advance_note         = 'Advance of ₹7,10,000 received on 1 Feb 2026 at the time of order confirmation. Delivery charges waived as per customer request. Net balance due on this invoice: ₹1,28,440.05.'
WHERE order_no = 'GDS-001';

-- Revert balance stage to ₹1,28,440.05
UPDATE order_payment_stages SET
  amount_due     = 128440.05,
  net_receivable = 128440.05
WHERE order_id     = (SELECT id FROM orders WHERE order_no = 'GDS-001')
  AND stage_number = 2;


-- ── SVC-003: Record ₹9,500 balance payment (drawing + GST) ───────────────────

INSERT INTO order_payments (
  order_id, payment_date, amount_received, tds_deducted, net_received,
  payment_mode, notes
) VALUES (
  (SELECT id FROM orders WHERE order_no = 'SVC-003'),
  '2026-04-09',
  9500.00, 0.00, 9500.00,
  'Bank Transfer',
  'Balance payment — Bus Bar fabrication drawing and GST (₹5,000 base + ₹4,500 GST)'
);

-- Mark stage 2 as paid
UPDATE order_payment_stages SET status = 'paid'
WHERE order_id     = (SELECT id FROM orders WHERE order_no = 'SVC-003')
  AND stage_number = 2;

-- Mark order as completed
UPDATE orders SET status = 'completed'
WHERE order_no = 'SVC-003';
