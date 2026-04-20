-- ============================================================
-- QT-2026-003 amendment: split heavy-item delivery into two
-- ₹2,000 lines — one for Acid Proof Tiles, one for Rubber
-- 3 mm Electrical Insulation Rolls. Totals unchanged.
-- Removes existing combined ₹4,000 line (item index 7) and
-- appends two ₹2,000 lines (items 8 & 9).
-- ============================================================

UPDATE quotes
SET
  items = (items - 7) || $$[
    {
      "item_id": "",
      "sku_id": "",
      "name": "Freight, Packing & Door Delivery — Acid Proof Tiles to India Zinc site, Madhavaram, Chennai",
      "item_type": "service",
      "hsn_code": "",
      "sac_code": "996511",
      "unit": "Lot",
      "quantity": 1,
      "mrp": 2000.00,
      "unit_price": 2000.00,
      "discount_pct": 0,
      "discount_amount": 0,
      "taxable_amount": 2000.00,
      "gst_rate": 18,
      "cgst_rate": 9,
      "sgst_rate": 9,
      "igst_rate": 0,
      "gst_amount": 360.00,
      "total": 2360.00
    },
    {
      "item_id": "",
      "sku_id": "",
      "name": "Freight, Packing & Door Delivery — Rubber Rolls for Electrical Insulation 3 mm to India Zinc site, Madhavaram, Chennai",
      "item_type": "service",
      "hsn_code": "",
      "sac_code": "996511",
      "unit": "Lot",
      "quantity": 1,
      "mrp": 2000.00,
      "unit_price": 2000.00,
      "discount_pct": 0,
      "discount_amount": 0,
      "taxable_amount": 2000.00,
      "gst_rate": 18,
      "cgst_rate": 9,
      "sgst_rate": 9,
      "igst_rate": 0,
      "gst_amount": 360.00,
      "total": 2360.00
    }
  ]$$::jsonb,
  notes = 'Replacement of Rotameter (supplied under GDS-003) to 0-250 LPH scale — original 0-6000 LPH / 100 LPM scale was oversized for dosing pump flow range (0-250 LPH max). Includes 1 No differential charge for replacement, 2 Nos fresh rotameters of same new spec, 1 No PP Sheet 20 mm (30% disc on MRP ₹14,000), 1 day on-site T&P sensor installation, Acid Proof Tiles (₹1,00,000 lot) for the ground floor (below 1st floor mezzanine), Rubber 3 mm Electrical Insulation Supply & Layering (4.5 rolls @ ₹14,700/roll composite — material ₹11,700/roll + layering ₹3,000/roll) for the 1st floor mezzanine. Door delivery shown separately per consignment: ₹2,000 instrumentation + PP sheet (item 7), ₹2,000 acid proof tiles (item 8), ₹2,000 rubber rolls for 3 mm electrical insulation (item 9) — all to Madhavaram, Chennai.',
  terms = 'Prices are exclusive of GST. GST @ 18% (CGST 9% + SGST 9%) applicable. Door delivery to India Zinc site, Madhavaram, Chennai included — ₹2,000 for instrumentation & PP sheet (item 7), ₹2,000 for acid proof tiles (item 8), ₹2,000 for rubber rolls for 3 mm electrical insulation (item 9). Payment: 100% advance before dispatch. Validity: 30 days from quote date.'
WHERE quote_no = 'QT-2026-003';
