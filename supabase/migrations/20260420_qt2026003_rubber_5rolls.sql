-- ============================================================
-- QT-2026-003 amendment: Rubber insulation quantity 4.5 → 5 rolls
--   Unit rate (composite) unchanged: ₹14,700/roll
--   Line taxable: 4.5 × 14,700 = ₹66,150 → 5 × 14,700 = ₹73,500
--   Line total incl GST: ₹78,057 → ₹86,730
--
-- New grand totals:
--   Subtotal ₹2,47,850 − Disc ₹4,200 = Taxable ₹2,43,650
--   + 18% GST = ₹2,87,507.00
-- ============================================================

UPDATE quotes
SET
  items = jsonb_set(items, '{5}', $$
    {
      "item_id": "",
      "sku_id": "",
      "name": "Rubber 3 mm Electrical Insulation — Supply & Layering for 1st floor mezzanine (composite rate per roll: material 18 m² @ ₹650/m² = ₹11,700 + layering charges ₹3,000 = ₹14,700/roll)",
      "item_type": "goods",
      "hsn_code": "40081900",
      "sac_code": "",
      "unit": "Rolls",
      "quantity": 5,
      "mrp": 14700.00,
      "unit_price": 14700.00,
      "discount_pct": 0,
      "discount_amount": 0,
      "taxable_amount": 73500.00,
      "gst_rate": 18,
      "cgst_rate": 9,
      "sgst_rate": 9,
      "igst_rate": 0,
      "gst_amount": 13230.00,
      "total": 86730.00
    }
  $$::jsonb),
  subtotal             = 247850.00,
  taxable_value        = 243650.00,
  cgst_amount          = 21928.50,
  sgst_amount          = 21928.50,
  total_amount         = 287507.00,
  notes = 'Replacement of Rotameter (supplied under GDS-003) to 0-250 LPH scale — original 0-6000 LPH / 100 LPM scale was oversized for dosing pump flow range (0-250 LPH max). Includes 1 No differential charge for replacement, 2 Nos fresh rotameters of same new spec, 1 No PP Sheet 20 mm (30% disc on MRP ₹14,000), 1 day on-site T&P sensor installation, Acid Proof Tiles (₹1,00,000 lot) for the ground floor (below 1st floor mezzanine), Rubber 3 mm Electrical Insulation Supply & Layering (5 rolls @ ₹14,700/roll composite — material ₹11,700/roll + layering ₹3,000/roll) for the 1st floor mezzanine. Door delivery shown separately per consignment: ₹1,000 instrumentation (item 7), ₹500 PP sheet (item 8), ₹2,000 acid proof tiles (item 9), ₹2,000 rubber rolls for 3 mm electrical insulation (item 10) — all to Madhavaram, Chennai.'
WHERE quote_no = 'QT-2026-003';
