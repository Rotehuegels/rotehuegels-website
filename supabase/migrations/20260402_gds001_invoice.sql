-- ============================================================
-- GDS-001: Combined Invoice — Pb Anodes + Al Cathode
-- Invoice date: 31 Mar 2026 | Delivery: 31 Mar 2026
-- Client: M/s India Zinc Inc (33BZWPS7278C2ZN) — intra-state
-- Total: ₹8,38,440.05 | Advance: ₹7,10,000 | Balance: ₹1,28,440.05
-- HSN: Pb Anodes 78041110 (ZDP0003 V05) | Al Cathode 76061110 (ZDP0002 V04)
-- ============================================================

UPDATE orders SET
  invoice_date    = '2026-03-31',
  delivery_date   = '2026-03-31',
  client_name     = 'M/s India Zinc Inc',
  client_gstin    = '33BZWPS7278C2ZN',
  client_address  = 'No. 224, 1A/1B/1A, 1st Floor, Venkiteshwara Nagar, Vadaperambakkam, Puzhal Village, Madhavaram, Chennai – 600060, Tamil Nadu, India',
  client_contact  = 'Mr. Sabare Alam, Proprietor / Director & CEO',
  place_of_supply = 'Tamil Nadu (33)',
  hsn_sac_code    = '78041110',
  description     = 'Manufacture and Supply of High Purity Lead Anodes and High Purity Aluminium Cathode (Custom Fabricated) — as per customer specification',
  items           = $$[
    {
      "description": "High Purity Aluminium Cathode (Custom Fabricated)\nRef. Drawing: ZDP0002 V04 (27 Nov 2025)\nSpec: 520 mm (W) \u00d7 1100 mm (H) \u00d7 5 mm (T), Al header 1100 mm (L) \u00d7 50 mm (W), Cu tips 20 \u00d7 60 mm, horizontal configuration, PVC strips at both ends for easy zinc stripping\nIncludes: \"Rotehuegels\" branding on headers/tags; heavy-duty packing and free delivery to site",
      "qty": "12 Nos",
      "hsn": "76061110",
      "base": 296610.17,
      "cgst": 26694.92,
      "sgst": 26694.91,
      "igst": 0,
      "total": 350000.00
    },
    {
      "description": "High Purity Lead Anodes (Custom Fabricated)\nRef. Drawing: ZDP0003 V05 (13 Mar 2026) — Rev. updated from V04: bus bar 40 mm \u00d7 16 mm used vs. customer-approved 35 mm \u00d7 15 mm (heavier cross-section)\nSpec: 520 mm (W) \u00d7 1100 mm (H) \u00d7 6 mm (T), Cu bus bar 40 mm (T) \u00d7 16 mm (W) \u00d7 1000 mm (L) with 5 mm Pb overlay, Cu tips 30 \u00d7 60 mm, Pb removed on one side at bottom for electrical contact",
      "qty": "12 Nos",
      "hsn": "78041110",
      "base": 413932.25,
      "cgst": 37253.90,
      "sgst": 37253.90,
      "igst": 0,
      "total": 488440.05
    }
  ]$$::jsonb,
  advance_note    = 'Advance of ₹7,10,000 received on 1 Feb 2026 at the time of order confirmation. Net balance due on this invoice: ₹1,28,440.05.',
  notes           = 'Order received 31 Jan 2026 late evening; entered 3 Feb 2026. Advance ₹7,10,000 received 1 Feb 2026. Both items delivered and invoiced 31 Mar 2026. Customer agreed to pay balance ₹1,28,440.05. GDS-001-1 (partial cathode sub-invoice) superseded by this combined invoice.'
WHERE order_no = 'GDS-001';

-- Mark GDS-001-1 as superseded
UPDATE orders SET
  status = 'cancelled',
  notes  = 'Superseded by combined invoice GDS-001 (dated 31 Mar 2026) covering both Pb Anodes and Al Cathode.'
WHERE order_no = 'GDS-001-1';
