-- ============================================================
-- QT-2026-003 amendment: add heavy-item delivery charges
-- Tiles (1 lot) + Rubber (4.5 rolls) are bulky vs. the rotameter
-- /PP-sheet consignment, so a separate ₹4,000 delivery line is
-- added for them. Existing ₹2,000 delivery (item 7) retained
-- for the instrumentation/PP-sheet consignment.
--
-- Totals:  Subtotal ₹2,41,000 − Disc ₹4,200
--          = Taxable ₹2,36,800 + 18% GST = ₹2,79,424.00
-- ============================================================

UPDATE quotes
SET
  items = items || $$[
    {
      "item_id": "",
      "sku_id": "",
      "name": "Freight, Packing & Door Delivery — Acid Proof Tiles + Rubber 3 mm Insulation Rolls to India Zinc site, Madhavaram, Chennai",
      "item_type": "service",
      "hsn_code": "",
      "sac_code": "996511",
      "unit": "Lot",
      "quantity": 1,
      "mrp": 4000.00,
      "unit_price": 4000.00,
      "discount_pct": 0,
      "discount_amount": 0,
      "taxable_amount": 4000.00,
      "gst_rate": 18,
      "cgst_rate": 9,
      "sgst_rate": 9,
      "igst_rate": 0,
      "gst_amount": 720.00,
      "total": 4720.00
    }
  ]$$::jsonb,
  subtotal             = 241000.00,
  taxable_value        = 236800.00,
  cgst_amount          = 21312.00,
  sgst_amount          = 21312.00,
  total_amount         = 279424.00,
  notes                = 'Replacement of Rotameter (supplied under GDS-003) to 0-250 LPH scale — original 0-6000 LPH / 100 LPM scale was oversized for dosing pump flow range (0-250 LPH max). Includes 1 No differential charge for replacement, 2 Nos fresh rotameters of same new spec, 1 No PP Sheet 20 mm (30% disc on MRP ₹14,000), 1 day on-site T&P sensor installation, Acid Proof Tiles (₹1,00,000 lot) for the ground floor (below 1st floor mezzanine), Rubber 3 mm Electrical Insulation Supply & Layering (4.5 rolls @ ₹14,700/roll composite — material ₹11,700/roll + layering ₹3,000/roll) for the 1st floor mezzanine. Door delivery split: ₹2,000 for instrumentation + PP sheet consignment (item 7) and ₹4,000 for bulky tiles + rubber rolls consignment (item 8), both to Madhavaram, Chennai.',
  terms                = 'Prices are exclusive of GST. GST @ 18% (CGST 9% + SGST 9%) applicable. Door delivery to India Zinc site, Madhavaram, Chennai included — ₹2,000 for the instrumentation & PP sheet consignment (item 7) and ₹4,000 for the tiles & rubber rolls consignment (item 8). Payment: 100% advance before dispatch. Validity: 30 days from quote date.'
WHERE quote_no = 'QT-2026-003';
