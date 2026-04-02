-- ============================================================
-- India Zinc GSTIN: 33BZWPS7278C2ZN → State code 33 = Tamil Nadu
-- Supply is INTRA-STATE → CGST + SGST (not IGST)
-- Revert GDS-001 and GDS-001-1 back to CGST/SGST
-- Set client GSTIN and place of supply on both orders
-- ============================================================

-- Fix GDS-001-1 (Aluminium Cathode partial invoice)
UPDATE orders SET
  client_gstin    = '33BZWPS7278C2ZN',
  client_name     = 'M/s India Zinc Inc',
  place_of_supply = 'Tamil Nadu (33)',
  cgst_amount     = 26694.92,
  sgst_amount     = 26694.91,
  igst_amount     = 0.00
WHERE order_no = 'GDS-001-1';

-- Fix parent GDS-001 (same client)
UPDATE orders SET
  client_gstin    = '33BZWPS7278C2ZN',
  client_name     = 'M/s India Zinc Inc',
  place_of_supply = 'Tamil Nadu (33)',
  cgst_amount     = 63948.81,
  sgst_amount     = 63948.81,
  igst_amount     = 0.00
WHERE order_no = 'GDS-001';
