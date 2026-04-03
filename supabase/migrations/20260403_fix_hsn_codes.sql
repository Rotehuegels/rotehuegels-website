-- ============================================================
-- Fix HSN codes to correct 8-digit Indian Customs codes
-- GDS-002 items JSONB + QT-2026-001 items JSONB
-- ============================================================

-- GDS-002: Update sensor items with correct 8-digit HSN codes
UPDATE orders SET
  hsn_sac_code = '90262090',
  items = $$[
    {
      "description": "Temperature Transmitter with Thermocouple",
      "qty": "9 Nos",
      "unit_price": 1879.50,
      "hsn": "90268090",
      "base": 16915.50,
      "cgst": 1522.40,
      "sgst": 1522.39,
      "igst": 0,
      "total": 19960.29,
      "delivered": true,
      "delivered_qty": "9 Nos"
    },
    {
      "description": "Pressure Transmitter (0–4 Bar)",
      "qty": "5 Nos",
      "unit_price": 3675.00,
      "hsn": "90262090",
      "base": 18375.00,
      "cgst": 1653.75,
      "sgst": 1653.75,
      "igst": 0,
      "total": 21682.50,
      "delivered": true,
      "delivered_qty": "5 Nos"
    },
    {
      "description": "Float & Board Level Indicator",
      "qty": "1 No",
      "unit_price": 11287.50,
      "hsn": "90261090",
      "base": 11287.50,
      "cgst": 1015.88,
      "sgst": 1015.87,
      "igst": 0,
      "total": 13319.25,
      "delivered": false,
      "delivery_eta": "1-2 weeks"
    },
    {
      "description": "Infrared Industrial Thermometer (UT 300S)",
      "qty": "1 No",
      "unit_price": 1890.00,
      "hsn": "90251920",
      "base": 1890.00,
      "cgst": 170.10,
      "sgst": 170.10,
      "igst": 0,
      "total": 2230.20,
      "delivered": true,
      "delivered_qty": "1 No"
    }
  ]$$::jsonb
WHERE order_no = 'GDS-002';

-- QT-2026-001: Update sensor accessories with correct 8-digit HSN codes
-- Bigger Panel and Smaller Panel → 85373090 (boards/panels for electrical control ≤1000V)
-- Rotameter → 90261010 (flow meters for liquids)
UPDATE quotes SET
  items = $$[
    {
      "item_id": "",
      "sku_id": "",
      "name": "Bigger Panel (Metal Box + Pressure Controller + Temperature Indicator)",
      "item_type": "goods",
      "hsn_code": "85373090",
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
      "hsn_code": "85373090",
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
      "hsn_code": "90261010",
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
    }
  ]$$::jsonb
WHERE quote_no = 'QT-2026-001';
