-- ============================================================
-- Fix GDS-001-1 and GDS-001: switch to IGST (interstate supply)
-- Add place_of_supply column to orders
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS place_of_supply TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS advance_note TEXT;

-- Fix GDS-001-1 (Aluminium Cathode partial invoice)
UPDATE orders SET
  cgst_amount   = 0.00,
  sgst_amount   = 0.00,
  igst_amount   = 53389.83,   -- 18% IGST on ₹2,96,610.17
  place_of_supply = 'UPDATE_WITH_CLIENT_STATE',   -- update once GSTIN confirmed, e.g. 'Gujarat (24)'
  advance_note  = 'Advance payment of ₹7,10,000 received on 31.01.2026 against Order GDS-001 (Full Order Value ₹8,38,440.05 incl. GST). This invoice ₹3,50,000 adjusted against advance. Balance advance ₹3,60,000 applicable to subsequent Lead Anode delivery invoice.',
  notes         = 'Partial delivery invoice under Order GDS-001. 12 Nos Aluminium Cathode delivered. Lead Anodes to be invoiced separately. Advance ₹7,10,000 received on 31.01.2026 — adjusted against this invoice. Balance advance ₹3,60,000 applicable to Lead Anode delivery. UPDATE client_gstin and place_of_supply once confirmed.'
WHERE order_no = 'GDS-001-1';

-- Fix parent GDS-001 (same client, same supply — intra was wrong)
UPDATE orders SET
  cgst_amount   = 0.00,
  sgst_amount   = 0.00,
  igst_amount   = 127897.63   -- 18% IGST on ₹7,10,542.42
WHERE order_no = 'GDS-001';
