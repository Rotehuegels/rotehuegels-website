-- ============================================================
-- Quotation QT-2026-001: Sensor Accessories for Local Display
-- Customer: M/s India Zinc Inc (CUST-001)
-- Date: 03 Apr 2026 | Valid: 30 days
-- Context: Customer wants local display of temperature and
--   pressure at measurement points instead of central AutoREX
--   computer. Quote raised for approval.
-- Grand Total: ₹46,900.35 + 18% GST = ₹55,342.42
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
  'QT-2026-001',
  (SELECT id FROM customers WHERE customer_id = 'CUST-001'),
  '2026-04-03',
  '2026-05-03',
  $$[
    {
      "item_id": "",
      "sku_id": "",
      "name": "Bigger Panel (Metal Box + Pressure Controller + Temperature Indicator)",
      "item_type": "goods",
      "hsn_code": "8537",
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
      "hsn_code": "8537",
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
      "hsn_code": "9026",
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
  ]$$::jsonb,
  46900.35,
  0.00,
  46900.35,
  4221.04,
  4221.03,
  0.00,
  55342.42,
  'Customer requested local display of temperature and pressure at point of measurement instead of central AutoREX computer. This quote covers the additional hardware required.',
  'Prices are exclusive of GST. GST @ 18% (CGST 9% + SGST 9%) applicable. Payment: 100% advance before dispatch. Validity: 30 days from quote date.',
  'draft'
) ON CONFLICT (quote_no) DO NOTHING;
