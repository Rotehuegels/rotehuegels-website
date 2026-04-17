-- Correction: Bridge Green's upcoming hydromet plant is at Maraimalai Nagar
-- (Kanchipuram district), not Navallur. Navallur was previously listed in
-- both address and notes.

UPDATE recyclers SET
  address = 'Mechanical Plant: Plot I-25, Lyon Grand Village, Ponneri Taluk, Gummidipundi, Thiruvallur. Hydromet R&D: Guindy, Chennai. Hydromet Plant (upcoming): Maraimalai Nagar, Kanchipuram',
  city    = 'Gummidipundi / Chennai / Maraimalai Nagar',
  notes   = 'Gummidipundi shredding unit: 10 MT/day black mass output from end-of-life Li-ion batteries. Guindy hydromet R&D: 300 kg/day nameplate, 30-50 kg/day at commercial purity grades. Maraimalai Nagar hydromet plant (under construction): 3 TPD for precursor/cathode active material production from black mass. NMC + LFP. AI-enabled SoH diagnostics. 90+ team. Launch NY + NY Ventures funded.'
  WHERE recycler_code = 'BWM-TN-002';
