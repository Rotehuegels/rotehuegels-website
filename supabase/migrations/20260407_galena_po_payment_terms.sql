-- ============================================================
-- PO-2026-001: Correct payment terms — balance against documents,
-- not on delivery. Supplier dispatches only after full payment.
-- ============================================================

UPDATE purchase_orders SET
  terms = 'Inter-state supply (Gujarat → Tamil Nadu). IGST @ 18% applicable. '
          'Advance ₹84,000 paid. Balance ₹2,25,915 payable against submission of required documents '
          '(revised Certificate of Analysis and formal Warranty / Quality Assurance letter). '
          'Full payment will be released upon receipt and review of the above documents. '
          'Supplier to dispatch goods only after confirmation of full payment. '
          'Drawing Reference: ZDP0003 V05 dated 13 Mar 2026 | Bus Bar: 40 × 16 mm. '
          'Material CoA must reflect: method of analysis (ICP-OES/AAS/AES), applicable standard (ASTM/ISO/BIS), '
          'detection limits (LOD/LOQ), instrument details and calibration standards, '
          'sample preparation method, sample receipt and analysis dates, batch/lot/heat number, and authorised signatory. '
          'Third-party testing will be conducted at an independent laboratory in Chennai on receipt. '
          'In case of quality deviation, all logistics and replacement costs shall be borne by the supplier.'
WHERE po_no = 'PO-2026-001';
