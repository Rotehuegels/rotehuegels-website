-- ============================================================
-- QT-2026-003 amendment: split combined ₹2,000 instrumentation +
-- PP sheet delivery (item 7) into two ₹1,000 lines — one for
-- instrumentation, one for PP sheet. Tiles (9) and rubber (10)
-- deliveries shift down by one. Totals unchanged.
-- ============================================================

UPDATE quotes
SET
  items = (
    SELECT jsonb_agg(e ORDER BY rn) FROM (
      SELECT e, rn FROM jsonb_array_elements(items) WITH ORDINALITY AS t(e, rn) WHERE rn <= 6
      UNION ALL
      SELECT $$
        {
          "item_id": "",
          "sku_id": "",
          "name": "Freight, Packing & Door Delivery — Instrumentation (Rotameters + T&P Sensor Installation materials) to India Zinc site, Madhavaram, Chennai",
          "item_type": "service",
          "hsn_code": "",
          "sac_code": "996511",
          "unit": "Lot",
          "quantity": 1,
          "mrp": 1000.00,
          "unit_price": 1000.00,
          "discount_pct": 0,
          "discount_amount": 0,
          "taxable_amount": 1000.00,
          "gst_rate": 18,
          "cgst_rate": 9,
          "sgst_rate": 9,
          "igst_rate": 0,
          "gst_amount": 180.00,
          "total": 1180.00
        }
      $$::jsonb AS e, 7 AS rn
      UNION ALL
      SELECT $$
        {
          "item_id": "",
          "sku_id": "",
          "name": "Freight, Packing & Door Delivery — PP Sheet 20 mm, 4 ft × 4 ft to India Zinc site, Madhavaram, Chennai",
          "item_type": "service",
          "hsn_code": "",
          "sac_code": "996511",
          "unit": "Lot",
          "quantity": 1,
          "mrp": 1000.00,
          "unit_price": 1000.00,
          "discount_pct": 0,
          "discount_amount": 0,
          "taxable_amount": 1000.00,
          "gst_rate": 18,
          "cgst_rate": 9,
          "sgst_rate": 9,
          "igst_rate": 0,
          "gst_amount": 180.00,
          "total": 1180.00
        }
      $$::jsonb AS e, 8 AS rn
      UNION ALL
      SELECT e, rn + 2 AS rn FROM jsonb_array_elements(items) WITH ORDINALITY AS t(e, rn) WHERE rn >= 8
    ) ordered
  ),
  notes = 'Replacement of Rotameter (supplied under GDS-003) to 0-250 LPH scale — original 0-6000 LPH / 100 LPM scale was oversized for dosing pump flow range (0-250 LPH max). Includes 1 No differential charge for replacement, 2 Nos fresh rotameters of same new spec, 1 No PP Sheet 20 mm (30% disc on MRP ₹14,000), 1 day on-site T&P sensor installation, Acid Proof Tiles (₹1,00,000 lot) for the ground floor (below 1st floor mezzanine), Rubber 3 mm Electrical Insulation Supply & Layering (4.5 rolls @ ₹14,700/roll composite — material ₹11,700/roll + layering ₹3,000/roll) for the 1st floor mezzanine. Door delivery shown separately per consignment: ₹1,000 instrumentation (item 7), ₹1,000 PP sheet (item 8), ₹2,000 acid proof tiles (item 9), ₹2,000 rubber rolls for 3 mm electrical insulation (item 10) — all to Madhavaram, Chennai.',
  terms = 'Prices are exclusive of GST. GST @ 18% (CGST 9% + SGST 9%) applicable. Door delivery to India Zinc site, Madhavaram, Chennai included — ₹1,000 for instrumentation (item 7), ₹1,000 for PP sheet (item 8), ₹2,000 for acid proof tiles (item 9), ₹2,000 for rubber rolls for 3 mm electrical insulation (item 10). Payment: 100% advance before dispatch. Validity: 30 days from quote date.'
WHERE quote_no = 'QT-2026-003';
