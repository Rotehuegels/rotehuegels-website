-- ============================================================
-- QT-2026-003 fix: Acid Proof Tiles location
-- Correcting item 5 description — tiles are for the GROUND FLOOR
-- (below the mezzanine), not the mezzanine itself.
-- Rubber insulation (item 6) remains on the 1st floor mezzanine.
-- ============================================================

UPDATE quotes
SET
  items = jsonb_set(
    items,
    '{4,name}',
    '"Acid Proof Tiles — supply for ground floor (below 1st floor mezzanine)"'::jsonb
  ),
  notes = 'Replacement of Rotameter (supplied under GDS-003) to 0-250 LPH scale — original 0-6000 LPH / 100 LPM scale was oversized for dosing pump flow range (0-250 LPH max). Includes 1 No differential charge for replacement, 2 Nos fresh rotameters of same new spec, 1 No PP Sheet 20 mm (30% disc on MRP ₹14,000), 1 day on-site T&P sensor installation, Acid Proof Tiles (₹1,00,000 lot) for the ground floor (below 1st floor mezzanine), Rubber 3 mm Electrical Insulation Supply & Layering (4.5 rolls @ ₹14,700/roll composite — material ₹11,700/roll + layering ₹3,000/roll) for the 1st floor mezzanine, plus door delivery to Madhavaram, Chennai.'
WHERE quote_no = 'QT-2026-003';
