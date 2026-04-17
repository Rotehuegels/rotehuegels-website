-- BatX Energies Pvt Ltd correction. Imported originally as Pune/Maharashtra
-- (source list may have had their legacy registration), but authoritative
-- website batxenergies.com lists HQ + registered addresses in Gurugram,
-- Haryana. Fix the row to match reality.

UPDATE recyclers SET
  address = 'Unit No. 7, 6th Floor, Enkay Tower, Udyog Vihar Phase V (Reg. office: A-257, South City I, Sector 30, Gurugram)',
  city    = 'Gurugram',
  state   = 'Haryana',
  pincode = '122022',
  latitude  = 28.4867,   -- Enkay Tower, Udyog Vihar Phase V
  longitude = 77.0894
  WHERE recycler_code = 'BWM-MH-001';

-- The separate Karnataka shredding unit (BM-KA-001) I speculatively added
-- earlier may not actually exist as a distinct BatX facility. Demote to
-- is_verified=false and add a flag in notes until confirmed.
UPDATE recyclers SET
  is_verified = false,
  notes = 'Speculative entry — BatX Energies reportedly operates a shredding line in Karnataka but the address / capacity have not been independently verified. HQ is in Gurugram, Haryana.'
  WHERE recycler_code = 'BM-KA-001';
