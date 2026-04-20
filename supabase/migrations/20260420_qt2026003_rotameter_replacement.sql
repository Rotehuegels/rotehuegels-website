-- ============================================================
-- Quotation QT-2026-003: Rotameter Replacement + Mezzanine Work
-- Customer: M/s India Zinc Inc (CUST-001)
-- Date: 20 Apr 2026 | Valid: 30 days
--
-- Context: The rotameter supplied under GDS-003 (ref QT-2026-001)
--   was 0-6000 LPH / 100 LPM scale, which is oversized for the
--   dosing pump flow range (0-250 LPH max). This quote covers:
--     1. Replacement of that unit to 0-250 LPH scale (differential
--        cost of ₹5,500 over the original ₹14,175 rotameter).
--     2. 2 Nos fresh rotameters of the same new spec.
--     3. 1 No PP Sheet 20 mm, 4 ft × 4 ft (30% disc on MRP).
--     4. 1 day on-site T&P sensor installation.
--     5. Acid Proof Tiles — ₹1,00,000 lot.
--     6. Rubber 3 mm electrical insulation — 4.5 rolls supply
--        (₹650/m² × 18 m²/roll = ₹11,700/roll) + layering
--        (₹3,000/roll) = ₹14,700/roll composite, for 1st floor
--        mezzanine.
--     7. Freight, packing & door delivery to India Zinc site.
--
-- Totals: Subtotal ₹2,37,000 − Disc ₹4,200 = Taxable ₹2,32,800
--         + 18% GST (CGST 9% + SGST 9%) = Grand ₹2,74,704.00
-- ============================================================

INSERT INTO quotes (
  quote_no,
  customer_id,
  quote_date,
  valid_until,
  items,
  subtotal,
  discount_amount,
  taxable_value,
  cgst_amount,
  sgst_amount,
  igst_amount,
  total_amount,
  notes,
  terms,
  status
) VALUES (
  'QT-2026-003',
  (SELECT id FROM customers WHERE customer_id = 'CUST-001'),
  '2026-04-20',
  '2026-05-20',
  $$[
    {
      "item_id": "",
      "sku_id": "",
      "name": "Rotameter scale upgrade — replacement of existing 0-6000 LPH / 100 LPM unit (supplied under GDS-003) with 0-250 LPH scale, 40 NB, Glass Body, 316L SS, ANSI 150# Class Flange, 500 mm FF — differential cost over original rotameter",
      "item_type": "goods",
      "hsn_code": "90261010",
      "sac_code": "",
      "unit": "Nos",
      "quantity": 1,
      "mrp": 5500.00,
      "unit_price": 5500.00,
      "discount_pct": 0,
      "discount_amount": 0,
      "taxable_amount": 5500.00,
      "gst_rate": 18,
      "cgst_rate": 9,
      "sgst_rate": 9,
      "igst_rate": 0,
      "gst_amount": 990.00,
      "total": 6490.00
    },
    {
      "item_id": "",
      "sku_id": "",
      "name": "Rotameter 0-250 LPH, 40 NB, Glass Body, 316L SS, ANSI 150# Class Flange, 500 mm FF",
      "item_type": "goods",
      "hsn_code": "90261010",
      "sac_code": "",
      "unit": "Nos",
      "quantity": 2,
      "mrp": 19675.00,
      "unit_price": 19675.00,
      "discount_pct": 0,
      "discount_amount": 0,
      "taxable_amount": 39350.00,
      "gst_rate": 18,
      "cgst_rate": 9,
      "sgst_rate": 9,
      "igst_rate": 0,
      "gst_amount": 7083.00,
      "total": 46433.00
    },
    {
      "item_id": "",
      "sku_id": "",
      "name": "PP Sheet 20 mm thick, 4 ft × 4 ft",
      "item_type": "goods",
      "hsn_code": "39202020",
      "sac_code": "",
      "unit": "Nos",
      "quantity": 1,
      "mrp": 14000.00,
      "unit_price": 14000.00,
      "discount_pct": 30,
      "discount_amount": 4200.00,
      "taxable_amount": 9800.00,
      "gst_rate": 18,
      "cgst_rate": 9,
      "sgst_rate": 9,
      "igst_rate": 0,
      "gst_amount": 1764.00,
      "total": 11564.00
    },
    {
      "item_id": "",
      "sku_id": "",
      "name": "Temperature & Pressure Sensor Installation — 1 day on-site commissioning",
      "item_type": "service",
      "hsn_code": "",
      "sac_code": "998719",
      "unit": "Lot",
      "quantity": 1,
      "mrp": 10000.00,
      "unit_price": 10000.00,
      "discount_pct": 0,
      "discount_amount": 0,
      "taxable_amount": 10000.00,
      "gst_rate": 18,
      "cgst_rate": 9,
      "sgst_rate": 9,
      "igst_rate": 0,
      "gst_amount": 1800.00,
      "total": 11800.00
    },
    {
      "item_id": "",
      "sku_id": "",
      "name": "Acid Proof Tiles — supply for 1st floor mezzanine",
      "item_type": "goods",
      "hsn_code": "69072100",
      "sac_code": "",
      "unit": "Lot",
      "quantity": 1,
      "mrp": 100000.00,
      "unit_price": 100000.00,
      "discount_pct": 0,
      "discount_amount": 0,
      "taxable_amount": 100000.00,
      "gst_rate": 18,
      "cgst_rate": 9,
      "sgst_rate": 9,
      "igst_rate": 0,
      "gst_amount": 18000.00,
      "total": 118000.00
    },
    {
      "item_id": "",
      "sku_id": "",
      "name": "Rubber 3 mm Electrical Insulation — Supply & Layering for 1st floor mezzanine (composite rate per roll: material 18 m² @ ₹650/m² = ₹11,700 + layering charges ₹3,000 = ₹14,700/roll)",
      "item_type": "goods",
      "hsn_code": "40081900",
      "sac_code": "",
      "unit": "Rolls",
      "quantity": 4.5,
      "mrp": 14700.00,
      "unit_price": 14700.00,
      "discount_pct": 0,
      "discount_amount": 0,
      "taxable_amount": 66150.00,
      "gst_rate": 18,
      "cgst_rate": 9,
      "sgst_rate": 9,
      "igst_rate": 0,
      "gst_amount": 11907.00,
      "total": 78057.00
    },
    {
      "item_id": "",
      "sku_id": "",
      "name": "Freight, Packing & Door Delivery to India Zinc site, Madhavaram, Chennai",
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
  237000.00,
  4200.00,
  232800.00,
  20952.00,
  20952.00,
  0.00,
  274704.00,
  'Replacement of Rotameter (supplied under GDS-003) to 0-250 LPH scale — original 0-6000 LPH / 100 LPM scale was oversized for dosing pump flow range (0-250 LPH max). Includes 1 No differential charge for replacement, 2 Nos fresh rotameters of same new spec, 1 No PP Sheet 20 mm (30% disc on MRP ₹14,000), 1 day on-site T&P sensor installation, Acid Proof Tiles (₹1,00,000 lot) and Rubber 3 mm Electrical Insulation Supply & Layering (4.5 rolls @ ₹14,700/roll composite — material ₹11,700/roll + layering ₹3,000/roll) for 1st floor mezzanine, plus door delivery to Madhavaram, Chennai.',
  'Prices are exclusive of GST. GST @ 18% (CGST 9% + SGST 9%) applicable. Door delivery to India Zinc site, Madhavaram, Chennai included (Item 7). Payment: 100% advance before dispatch. Validity: 30 days from quote date.',
  'draft'
) ON CONFLICT (quote_no) DO NOTHING;
