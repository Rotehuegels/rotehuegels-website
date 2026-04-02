-- ============================================================
-- GDS-003: CPVC Pipe Supply Invoice — 31 Mar 2026
-- Client: M/s India Zinc Inc (33BZWPS7278C2ZN) — intra-state
-- Procured from National Tubes And Valves, supplied to site
-- Total: ₹25,127.76 incl GST (CGST 9% + SGST 9%)
-- ============================================================

UPDATE orders SET
  invoice_date     = '2026-03-31',
  delivery_date    = '2026-03-30',
  client_gstin     = '33BZWPS7278C2ZN',
  client_address   = 'No. 224, 1A/1B/1A, 1st Floor, Venkiteshwara Nagar, Vadaperumbakkam, Puzhal Village, Madhavaram, Chennai – 600060, Tamil Nadu, India',
  client_contact   = 'Mr. Sabare Alam, Proprietor / Director & CEO',
  place_of_supply  = 'Tamil Nadu (33)',
  hsn_sac_code     = '3917',
  description      = 'Supply of CPVC Pipes and Fittings for India Zinc project site:
  1.  CPVC Pipes and Fittings (assorted)    —  As per site requirement',
  notes            = 'Procured from National Tubes And Valves on 30 Mar 2026. Supplied and installed at India Zinc project site same day. Payment received as part of ₹82,320 NEFT from India Zinc on 30 Mar 2026.'
WHERE order_no = 'GDS-003';
