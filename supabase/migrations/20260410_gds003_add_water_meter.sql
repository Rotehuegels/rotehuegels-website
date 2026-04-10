-- ============================================================
-- GDS-003 / QT-2026-001 Amendment: Add Water Line Meter + Fitting Charges
-- Item 4: Water Line Meter 40 NB Flanged ANSI 150# — ₹6,580 + 18% GST = ₹7,764.40
-- Item 5: Fitting of Temperature and Pressure Indicators in Box — ₹2,000 + 18% GST = ₹2,360.00
-- New base: ₹55,480.35 | New total: ₹65,466.82
-- ============================================================

-- 1. Update QT-2026-001 items (5 line items) + totals
UPDATE quotes
SET
  items = $$[
    {
      "item_id": "",
      "sku_id": "",
      "name": "Bigger Panel (Metal Box + Pressure Controller + Temperature Indicator)",
      "item_type": "goods",
      "hsn_code": "85371090",
      "sac_code": "",
      "unit": "Nos",
      "quantity": 5,
      "mrp": 4917.15,
      "unit_price": 4917.15,
      "discount_pct": 0,
      "discount_amount": 0,
      "taxable_amount": 24585.75,
      "gst_rate": 18,
      "cgst_rate": 9,
      "sgst_rate": 9,
      "igst_rate": 0,
      "gst_amount": 4425.44,
      "total": 29011.19
    },
    {
      "item_id": "",
      "sku_id": "",
      "name": "Smaller Panel (Metal Box + Temperature Indicator)",
      "item_type": "goods",
      "hsn_code": "85371090",
      "sac_code": "",
      "unit": "Nos",
      "quantity": 4,
      "mrp": 2034.90,
      "unit_price": 2034.90,
      "discount_pct": 0,
      "discount_amount": 0,
      "taxable_amount": 8139.60,
      "gst_rate": 18,
      "cgst_rate": 9,
      "sgst_rate": 9,
      "igst_rate": 0,
      "gst_amount": 1465.13,
      "total": 9604.73
    },
    {
      "item_id": "",
      "sku_id": "",
      "name": "Rotameter",
      "item_type": "goods",
      "hsn_code": "90261090",
      "sac_code": "",
      "unit": "Nos",
      "quantity": 1,
      "mrp": 14175.00,
      "unit_price": 14175.00,
      "discount_pct": 0,
      "discount_amount": 0,
      "taxable_amount": 14175.00,
      "gst_rate": 18,
      "cgst_rate": 9,
      "sgst_rate": 9,
      "igst_rate": 0,
      "gst_amount": 2551.50,
      "total": 16726.50
    },
    {
      "item_id": "",
      "sku_id": "",
      "name": "Water Line Meter 40 NB Flanged ANSI 150#",
      "item_type": "goods",
      "hsn_code": "90261090",
      "sac_code": "",
      "unit": "Nos",
      "quantity": 1,
      "mrp": 6580.00,
      "unit_price": 6580.00,
      "discount_pct": 0,
      "discount_amount": 0,
      "taxable_amount": 6580.00,
      "gst_rate": 18,
      "cgst_rate": 9,
      "sgst_rate": 9,
      "igst_rate": 0,
      "gst_amount": 1184.40,
      "total": 7764.40
    },
    {
      "item_id": "",
      "sku_id": "",
      "name": "Fitting of Temperature and Pressure Indicators in Box \u2014 Charges",
      "item_type": "service",
      "hsn_code": "",
      "sac_code": "998719",
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
  subtotal       = 55480.35,
  taxable_value  = 55480.35,
  cgst_amount    = 4993.24,
  sgst_amount    = 4993.23,
  igst_amount    = 0.00,
  total_amount   = 65466.82,
  notes          = 'Customer requested local display of temperature and pressure at point of measurement instead of central AutoREX computer. Covers additional hardware and fitting charges. Amendment: added Water Line Meter 40 NB Flanged ANSI 150# (item 4) and Fitting Charges (item 5).'
WHERE quote_no = 'QT-2026-001';

-- 2. Update GDS-003 order (including items JSONB for line-item display)
UPDATE orders
SET
  items = $$[
    {"name":"Bigger Panel (Metal Box + Pressure Controller + Temperature Indicator)","item_type":"goods","hsn_code":"85371090","sac_code":"","unit":"Nos","quantity":5,"unit_price":4917.15,"taxable_amount":24585.75,"gst_rate":18,"gst_amount":4425.44,"total":29011.19},
    {"name":"Smaller Panel (Metal Box + Temperature Indicator)","item_type":"goods","hsn_code":"85371090","sac_code":"","unit":"Nos","quantity":4,"unit_price":2034.90,"taxable_amount":8139.60,"gst_rate":18,"gst_amount":1465.13,"total":9604.73},
    {"name":"Rotameter","item_type":"goods","hsn_code":"90261090","sac_code":"","unit":"Nos","quantity":1,"unit_price":14175.00,"taxable_amount":14175.00,"gst_rate":18,"gst_amount":2551.50,"total":16726.50},
    {"name":"Water Line Meter 40 NB Flanged ANSI 150#","item_type":"goods","hsn_code":"90261090","sac_code":"","unit":"Nos","quantity":1,"unit_price":6580.00,"taxable_amount":6580.00,"gst_rate":18,"gst_amount":1184.40,"total":7764.40},
    {"name":"Fitting of Temperature and Pressure Indicators in Box \u2014 Charges","item_type":"service","hsn_code":"","sac_code":"998719","unit":"Lot","quantity":1,"unit_price":2000.00,"taxable_amount":2000.00,"gst_rate":18,"gst_amount":360.00,"total":2360.00}
  ]$$::jsonb,
  base_value           = 55480.35,
  cgst_amount          = 4993.24,
  sgst_amount          = 4993.23,
  igst_amount          = 0.00,
  total_value_incl_gst = 65466.82,
  description          = 'Supply of Temperature & Pressure Display cum Indicator Panels — Local Display at Point of Measurement: 5 Nos. Bigger Panel (Metal Box + Pressure Controller + Temperature Indicator), 4 Nos. Smaller Panel (Metal Box + Temperature Indicator), 1 No. Rotameter, 1 No. Water Line Meter 40 NB Flanged ANSI 150#, Fitting of Temperature and Pressure Indicators in Box — Charges (1 Lot). Standalone local display system, independent of central computer.',
  notes                = 'Converted from QT-2026-001 (approved). Amendment 2: added Fitting Charges ₹2,000 + 18% GST. Payment: 100% advance before dispatch. Full amount ₹65,466.82 pending.'
WHERE order_no = 'GDS-003';

-- 3. Update payment stage
UPDATE order_payment_stages
SET
  amount_due     = 55480.35,
  gst_on_stage   = 9986.47,
  net_receivable = 65466.82
WHERE order_id = (SELECT id FROM orders WHERE order_no = 'GDS-003')
  AND stage_number = 1;
