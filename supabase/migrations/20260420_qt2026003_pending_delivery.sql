-- ============================================================
-- QT-2026-003 amendment: add ₹3,000 + GST pending delivery
-- charges carried over from the earlier GDS-003 consignments
-- (float & scale, T&P sensors, rotameters) — delivery charges
-- that were not billed on the original invoice.
--
-- New totals:
--   Subtotal ₹2,50,850 − Disc ₹4,200 = Taxable ₹2,46,650
--   + 18% GST (CGST 9% + SGST 9%) = Grand ₹2,91,047.00
-- ============================================================

UPDATE quotes
SET
  items = items || $$[
    {
      "item_id": "",
      "sku_id": "",
      "name": "Pending Door Delivery charges from previous consignments (GDS-003) — Float & Scale, T&P Sensors, Rotameter — not billed earlier",
      "item_type": "service",
      "hsn_code": "",
      "sac_code": "996511",
      "unit": "Lot",
      "quantity": 1,
      "mrp": 3000.00,
      "unit_price": 3000.00,
      "discount_pct": 0,
      "discount_amount": 0,
      "taxable_amount": 3000.00,
      "gst_rate": 18,
      "cgst_rate": 9,
      "sgst_rate": 9,
      "igst_rate": 0,
      "gst_amount": 540.00,
      "total": 3540.00,
      "lead_time": "N/A (already delivered)"
    }
  ]$$::jsonb,
  subtotal             = 250850.00,
  taxable_value        = 246650.00,
  cgst_amount          = 22198.50,
  sgst_amount          = 22198.50,
  total_amount         = 291047.00,
  notes = 'Replacement of Rotameter (supplied under GDS-003) to 0-250 LPH scale — original 0-6000 LPH / 100 LPM scale was oversized for dosing pump flow range (0-250 LPH max). Includes 1 No differential charge for replacement, 2 Nos fresh rotameters of same new spec, 1 No PP Sheet 20 mm (30% disc on MRP ₹14,000), 1 day on-site T&P sensor installation, Acid Proof Tiles (₹1,00,000 lot) for the ground floor (below 1st floor mezzanine), Rubber 3 mm Electrical Insulation Supply & Layering (5 rolls @ ₹14,700/roll composite — material ₹11,700/roll + layering ₹3,000/roll) for the 1st floor mezzanine. Door delivery shown separately per consignment: ₹1,000 instrumentation (item 7), ₹500 PP sheet (item 8), ₹2,000 acid proof tiles (item 9), ₹2,000 rubber rolls for 3 mm electrical insulation (item 10) — all to Madhavaram, Chennai. Item 11: ₹3,000 pending door delivery charges carried over from earlier GDS-003 consignments (float & scale, T&P sensors, rotameter) that were not billed on the original invoice.

Lead times: T&P Sensor Installation (item 4) → next day of order placement. PP Sheet + PP Sheet delivery → 1 day (by Tue 21 Apr 2026 if ordered today). All other new items → by Fri 24 Apr 2026. Item 11 already delivered.'
WHERE quote_no = 'QT-2026-003';
