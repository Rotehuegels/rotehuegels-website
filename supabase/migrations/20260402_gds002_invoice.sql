-- ============================================================
-- GDS-002: Supply of Sensors for AutoREX Implementation
-- Invoice date: 31 Mar 2026 | Delivery: 30 Mar 2026
-- Client: M/s India Zinc Inc (33BZWPS7278C2ZN) — intra-state
-- Total: ₹57,192.24 incl GST (CGST 9% + SGST 9%)
-- ============================================================

UPDATE orders SET
  invoice_date    = '2026-03-31',
  delivery_date   = '2026-03-30',
  client_name     = 'M/s India Zinc Inc',
  client_gstin    = '33BZWPS7278C2ZN',
  client_address  = 'No. 224, 1A/1B/1A, 1st Floor, Venkiteshwara Nagar, Vadaperumbakkam, Puzhal Village, Madhavaram, Chennai – 600060, Tamil Nadu, India',
  client_contact  = 'Mr. Sabare Alam, Proprietor / Director & CEO',
  place_of_supply = 'Tamil Nadu (33)',
  hsn_sac_code    = '9026',
  description     = 'Supply of Instruments and Sensors for AutoREX Implementation:
  1.  Pressure Sensor, Ni Make                    —  3 Nos
  2.  Temperature Transmitter                     —  9 Nos
  3.  Temperature IR Gun                          —  1 No'
WHERE order_no = 'GDS-002';
