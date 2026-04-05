-- ============================================================
-- Galena Metals Pvt. Ltd. PO — migrated from Tally (PO No. 7 dated 13/02/2026)
-- Purpose: High Purity Lead Anodes (12 NOS) for India Zinc order (GDS-001)
--
-- Pricing (per Galena email 30-Mar-2026, Dharmesh Gandhi):
--   Original quote:          ₹27,300 per anode × 12 = ₹3,27,600
--   Less copper busbar dedn: ₹7,080 per anode × 12 = ₹84,960  (copper supplied by us)
--   Net anode price:         ₹20,220 × 12            = ₹2,42,640
--   Add freight:                                        ₹10,000
--   Add forwarding/packing:                             ₹10,000
--   Taxable total:                                     ₹2,62,640
--   IGST 18% (Gujarat → Tamil Nadu):                   ₹47,275
--   Grand total:                                       ₹3,09,915
--   Less advance paid:                                 ₹84,000
--   Net payable:                                       ₹2,25,915
--
-- Delivery address: No. 1/584, 7th Street, Jothi Nagar, Padianallur, Redhills, Chennai-600052
-- Supplier: Galena Metals Pvt. Ltd. (GSTIN: 24AAICG3555D1ZU, Vapi, Gujarat)
-- Run AFTER 20260406_purchase_orders.sql
-- ============================================================

DO $$
DECLARE
  v_supplier_id   UUID;
  v_order_id      UUID;
  v_po_id         UUID;
BEGIN
  SELECT id INTO v_supplier_id FROM suppliers WHERE gstin = '24AAICG3555D1ZU' LIMIT 1;
  SELECT id INTO v_order_id    FROM orders    WHERE order_no = 'GDS-001'        LIMIT 1;

  INSERT INTO purchase_orders (
    po_no, supplier_id, po_date, expected_delivery,
    status, supplier_ref, linked_order_id,
    bill_to, ship_to,
    subtotal, taxable_value,
    igst_amount, cgst_amount, sgst_amount,
    total_amount, notes, terms
  ) VALUES (
    'PO-2026-001',          -- renaming to FY2026 since PO was placed Feb 2026
    v_supplier_id,
    '2026-02-13',           -- PO date as per Galena "P.O. No: 7, Date: 13/02/2026"
    '2026-04-15',           -- expected delivery (proforma raised 28-Mar-2026; dispatch pending)
    'received',             -- goods received; balance payment pending
    'GMPL_VAP_048',         -- Galena's proforma invoice no. (28/03/2026)
    v_order_id,
    -- Bill to: Rotehügels registered office
    '{"line1": "No. 1/584, 7th Street, Jothi Nagar, Padianallur", "line2": "Redhills", "city": "Chennai", "state": "Tamil Nadu", "pincode": "600052", "gstin": "33AAPCR0554G1ZE"}',
    -- Ship to: same (delivery address as confirmed in email)
    '{"line1": "No. 1/584, 7th Street, Jothi Nagar, Padianallur", "line2": "Redhills", "city": "Chennai", "state": "Tamil Nadu", "pincode": "600052"}',
    262640.00,              -- subtotal = taxable (no discount)
    262640.00,
    47275.00,               -- IGST 18% on ₹2,62,640 (inter-state: Gujarat → Tamil Nadu)
    0.00,
    0.00,
    309915.00,              -- grand total
    'High Purity Lead Anodes for M/s India Zinc (GDS-001). '
    'Original spec: 20mm welded copper tips — revised to 30mm brazed copper tips at last moment. '
    'Copper busbars supplied by us; deducted @ ₹7,080/anode (5.9 kg × ₹1,200/kg). '
    'Sample lead sheets with test certificates and additional copper contacts to be packed inside.',
    'Inter-state supply (Gujarat → Tamil Nadu). IGST @ 18% applicable. '
    'Advance ₹84,000 paid. Balance ₹2,25,915 due (net payable = grand total − advance).'
  )
  RETURNING id INTO v_po_id;

  -- ── Line Items ───────────────────────────────────────────────
  INSERT INTO po_items (
    po_id, sl_no, description, hsn_code, unit,
    quantity, unit_price,
    taxable_amount, gst_rate, igst_rate, cgst_rate, sgst_rate,
    gst_amount, total, notes
  ) VALUES
  (
    v_po_id, 1,
    'Lead Anodes 99.99% — 1100×520×6mm with Copper Bus Bar 35×15×1000mm (Drg. ZDP0003 V04)',
    '7806',           -- Other articles of lead (HSN, as per Galena proforma category)
    'NOS',
    12, 20220.00,
    242640.00, 18, 18, 0, 0,
    43675.20, 286315.20,
    'Proforma GMPL_VAP_048 dated 28/03/2026. Original quote ₹27,300/pc; deducted ₹7,080/pc '
    'for copper busbar supplied by us (5.9 kg × ₹1,200/kg). Packed on 1 wooden pallet. '
    'Sample lead sheets + test certificates + additional copper contacts to be included in package.'
  ),
  (
    v_po_id, 2,
    'Freight Charges',
    '996511',         -- SAC: Road transport services
    'LS',
    1, 10000.00,
    10000.00, 18, 18, 0, 0,
    1800.00, 11800.00,
    'Freight from Vapi (Gujarat) to Chennai.'
  ),
  (
    v_po_id, 3,
    'Forwarding & Packing Charges',
    '998540',         -- SAC: Packing/forwarding services
    'LS',
    1, 10000.00,
    10000.00, 18, 18, 0, 0,
    1800.00, 11800.00,
    'Packing in wooden boxes for transit.'
  );
  -- Taxable total: 2,42,640 + 10,000 + 10,000 = 2,62,640 ✓
  -- IGST total: 43,675.20 + 1,800 + 1,800 = 47,275.20 ≈ 47,275 ✓
  -- Grand total: 2,86,315.20 + 11,800 + 11,800 = 3,09,915.20 ≈ 3,09,915 ✓

  -- ── Payments ────────────────────────────────────────────────
  -- Only the advance is recorded as paid. Balance ₹2,25,915 is still outstanding.
  INSERT INTO po_payments (po_id, payment_date, amount, payment_type, reference, notes)
  VALUES (
    v_po_id,
    '2026-02-13',     -- advance date (approximate, around PO date)
    84000.00,
    'advance',
    NULL,
    'Advance paid to Galena Metals. Copper busbars (approx. ₹84,940 value) also supplied separately by us.'
  );

  RAISE NOTICE 'PO-2025-001 seeded (ID: %). Balance due: ₹2,25,915 (gross ₹3,09,915 − advance ₹84,000)', v_po_id;
END $$;
