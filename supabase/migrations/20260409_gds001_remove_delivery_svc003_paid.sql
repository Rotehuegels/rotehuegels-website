-- ── GDS-001: Remove ₹20,000 delivery charge (customer concession) ─────────────
-- Reverts to 2-item invoice: Cathode ₹3,50,000 + Anode ₹4,88,440.05 = ₹8,38,440.05

UPDATE orders SET
  items = jsonb_build_array(
    jsonb_build_object('description','High Purity Aluminium Cathode (Custom Fabricated). Ref. Drawing: ZDP0002 V04 (27 Nov 2025). Spec: 520mm(W) x 1100mm(H) x 5mm(T), Al header 1100mm(L) x 50mm(W), Cu tips 20x60mm, horizontal config, PVC strips both ends. Rotehuegels branding; heavy-duty packing and delivery to site.','qty','12 Nos','hsn','76061110','base',296610.17,'cgst',26694.92,'sgst',26694.91,'igst',0,'total',350000.00),
    jsonb_build_object('description','High Purity Lead Anodes (Custom Fabricated). Ref. Drawing: ZDP0003 V05 (13 Mar 2026). Bus bar 40mm x 16mm used vs customer-approved 35mm x 15mm (heavier cross-section). Spec: 520mm(W) x 1100mm(H) x 6mm(T), Cu bus bar 40mm(T) x 16mm(W) x 1000mm(L) with 5mm Pb overlay, Cu tips 30x60mm.','qty','12 Nos','hsn','78041110','base',413932.25,'cgst',37253.90,'sgst',37253.90,'igst',0,'total',488440.05)
  ),
  base_value           = 710542.42,
  cgst_amount          = 63948.82,
  sgst_amount          = 63948.81,
  igst_amount          = 0.00,
  total_value_incl_gst = 838440.05,
  advance_note         = 'Advance of Rs.7,10,000 received on 1 Feb 2026. Delivery charges waived as per customer request. Net balance due: Rs.1,28,440.05.'
WHERE order_no = 'GDS-001';

-- Revert balance stage to ₹1,28,440.05
UPDATE order_payment_stages SET
  amount_due     = 128440.05,
  net_receivable = 128440.05
WHERE order_id     = (SELECT id FROM orders WHERE order_no = 'GDS-001')
  AND stage_number = 2;


-- SVC-003 handled in 20260409_svc003_reduce_to_20k.sql
