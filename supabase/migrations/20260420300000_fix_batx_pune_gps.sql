-- BatX Energies Pvt Ltd (BWM-MH-001) — CPCB record lists Pune (Maharashtra),
-- but their HQ is in Gurugram. Nominatim matched the HQ and returned
-- Gurugram coordinates (28.50, 77.08), which landed outside Maharashtra on
-- the map. Reset to Pune city centre (18.52, 73.86) to match the
-- registered city/state.

UPDATE recyclers
  SET latitude = 18.5204, longitude = 73.8567
  WHERE recycler_code = 'BWM-MH-001';
