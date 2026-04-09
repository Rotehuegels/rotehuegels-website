-- ── GDS-001: Final invoice ₹7,10,000 incl. GST (customer concession) ───────────
-- Cathode ₹3,50,000 + Anode ₹3,60,000 = ₹7,10,000 total
-- Advance ₹7,10,000 already received = full settlement, no balance due.

UPDATE orders SET
  items = jsonb_build_array(
    jsonb_build_object('description','High Purity Aluminium Cathode (Custom Fabricated). Ref. Drawing: ZDP0002 V04 (27 Nov 2025). Spec: 520mm(W) x 1100mm(H) x 5mm(T), Al header 1100mm(L) x 50mm(W), Cu tips 20x60mm, horizontal config, PVC strips both ends. Rotehuegels branding; heavy-duty packing and delivery to site.','qty','12 Nos','hsn','76061110','base',296610.17,'cgst',26694.92,'sgst',26694.91,'igst',0,'total',350000.00),
    jsonb_build_object('description','High Purity Lead Anodes (Custom Fabricated). Ref. Drawing: ZDP0003 V05 (13 Mar 2026). Bus bar 40mm x 16mm used vs customer-approved 35mm x 15mm (heavier cross-section). Spec: 520mm(W) x 1100mm(H) x 6mm(T), Cu bus bar 40mm(T) x 16mm(W) x 1000mm(L) with 5mm Pb overlay, Cu tips 30x60mm.','qty','12 Nos','hsn','78041110','base',305084.75,'cgst',27457.63,'sgst',27457.62,'igst',0,'total',360000.00)
  ),
  base_value           = 601694.92,
  cgst_amount          = 54152.55,
  sgst_amount          = 54152.53,
  igst_amount          = 0.00,
  total_value_incl_gst = 710000.00,
  status               = 'completed',
  advance_note         = 'Advance of Rs.7,10,000 received on 1 Feb 2026 — full and final settlement. No balance due.'
WHERE order_no = 'GDS-001';

UPDATE order_payment_stages SET
  amount_due     = 601694.92,
  gst_on_stage   = 108305.08,
  net_receivable = 710000.00,
  status         = 'paid'
WHERE order_id=(SELECT id FROM orders WHERE order_no='GDS-001') AND stage_number=2;

-- SVC-003 handled in 20260409_svc003_reduce_to_20k.sql
