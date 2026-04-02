-- ============================================================
-- Add invoice_date override column to orders
-- Allows backdating invoices to correct tax period
-- ============================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_date DATE;

-- ============================================================
-- GDS-001-1: Partial Invoice — Aluminium Cathode Delivery
-- 12 Nos. High Purity Aluminium Cathode
-- Drawing No. ZDP0002 Rev. V04 dated 27.11.2025
-- Invoice dated 31 Mar 2026 (FY 2025-26)
-- ============================================================
INSERT INTO orders (
  order_no, order_type, client_name,
  description,
  order_date, entry_date, invoice_date,
  total_value_incl_gst, base_value, gst_rate, cgst_amount, sgst_amount, igst_amount,
  tds_applicable, tds_rate, tds_deducted_total,
  hsn_sac_code, status, notes
) VALUES (
  'GDS-001-1',
  'goods',
  'M/s India Zinc Inc',
  'Supply of High Purity Aluminium Cathode (Custom Fabricated) — 12 Nos. as per Drawing No. ZDP0002 Rev. V04 dated 27.11.2025',
  '2026-03-31',
  '2026-04-02',
  '2026-03-31',
  350000.00,
  296610.17,
  18.00,
  26694.92,
  26694.91,
  0.00,
  false, 0.00, 0.00,
  '7601',
  'active',
  'Partial delivery invoice under Order GDS-001. Aluminium Cathodes (12 Nos) only. Lead Anodes to be invoiced separately. UPDATE client_gstin once confirmed.'
)
ON CONFLICT (order_no) DO UPDATE SET
  invoice_date          = EXCLUDED.invoice_date,
  total_value_incl_gst  = EXCLUDED.total_value_incl_gst,
  base_value            = EXCLUDED.base_value,
  cgst_amount           = EXCLUDED.cgst_amount,
  sgst_amount           = EXCLUDED.sgst_amount,
  updated_at            = NOW();
