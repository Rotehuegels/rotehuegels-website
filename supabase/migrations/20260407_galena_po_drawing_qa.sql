-- ============================================================
-- PO-2026-001 (Galena Metals): Update drawing reference V04 → V05
-- and record quality communication (email 07 Apr 2026)
-- ============================================================

-- 1. Update line item 1 — correct drawing ref and bus bar dimensions
UPDATE po_items SET
  description = 'Lead Anodes 99.99% — 1100×520×6mm with Copper Bus Bar 40×16×1000mm (Drg. ZDP0003 V05 dated 13 Mar 2026)',
  notes       = 'Proforma GMPL_VAP_048 dated 28/03/2026. Original quote ₹27,300/pc; deducted ₹7,080/pc '
                'for copper busbar supplied by us (5.9 kg × ₹1,200/kg). Packed on 1 wooden pallet. '
                'Sample lead sheets + test certificates + additional copper contacts to be included in package. '
                'Drawing revised: V04 (35×15mm bus bar, customer-approved spec) → V05 (40×16mm, heavier cross-section as actually supplied). '
                'Third-party testing at independent Chennai lab to be conducted on receipt.'
WHERE po_id = (SELECT id FROM purchase_orders WHERE po_no = 'PO-2026-001')
  AND sl_no = 1;

-- 2. Update PO terms — add QA requirements for PDF
UPDATE purchase_orders SET
  terms = 'Inter-state supply (Gujarat → Tamil Nadu). IGST @ 18% applicable. '
          'Advance ₹84,000 paid. Balance ₹2,25,915 due on delivery and acceptance. '
          'Drawing Reference: ZDP0003 V05 dated 13 Mar 2026 | Bus Bar: 40 × 16 mm. '
          'Material to be accompanied by Certificate of Analysis (CoA) reflecting: method of analysis (ICP-OES/AAS/AES), '
          'applicable standard (ASTM/ISO/BIS), detection limits (LOD/LOQ), instrument details and calibration standards, '
          'sample preparation method, sample receipt and analysis dates, batch/lot/heat number, and authorised signatory name and designation. '
          'Third-party testing will be conducted at an independent laboratory in Chennai on receipt. '
          'In case of quality deviation, all logistics and replacement costs shall be borne by the supplier. '
          'Formal warranty/quality assurance letter required prior to payment of balance.',

  notes = 'High Purity Lead Anodes for M/s India Zinc (GDS-001). '
          'Original spec: 20mm welded copper tips — revised to 30mm brazed copper tips at last moment. '
          'Copper busbars supplied by us; deducted @ ₹7,080/anode (5.9 kg × ₹1,200/kg). '
          'Sample lead sheets with test certificates and additional copper contacts to be packed inside. '
          '— Quality Communication (07 Apr 2026): '
          'CoA received and reviewed. Requested Galena to incorporate: (1) method of analysis (ICP-OES/AAS/AES) and applicable standard; '
          '(2) detection limits (LOD/LOQ); (3) instrument make/model and calibration standards; '
          '(4) sample preparation method; (5) sample receipt and analysis dates; '
          '(6) batch/lot/heat number for traceability; (7) authorised signatory name and designation. '
          'Also confirmed: drawing reference ZDP0003 V05 dated 13 Mar 2026 and copper bus bar dimensions 40×16mm must be reflected in CoA. '
          'Third-party testing to be conducted at independent lab in Chennai on receipt. '
          'Quality deviation clause communicated: all logistics and replacement costs at supplier end. '
          'Requested written confirmation and formal warranty/quality assurance letter.'
WHERE po_no = 'PO-2026-001';
