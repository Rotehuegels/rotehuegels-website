-- ============================================================
-- QT-2026-003 amendment: add lead-time field to each item.
--   - PP Sheet (item 3) + PP Sheet delivery (item 8): 1 day
--     lead time → Tue 21 Apr 2026
--   - All other items: by Fri 24 Apr 2026
-- Totals unchanged.
-- ============================================================

UPDATE quotes
SET
  items = (
    SELECT jsonb_agg(
      CASE
        WHEN ord IN (3, 8) THEN elem || '{"lead_time": "1 day (by Tue 21 Apr 2026)"}'::jsonb
        ELSE elem || '{"lead_time": "by Fri 24 Apr 2026"}'::jsonb
      END
      ORDER BY ord
    )
    FROM jsonb_array_elements(items) WITH ORDINALITY AS t(elem, ord)
  ),
  notes = 'Replacement of Rotameter (supplied under GDS-003) to 0-250 LPH scale — original 0-6000 LPH / 100 LPM scale was oversized for dosing pump flow range (0-250 LPH max). Includes 1 No differential charge for replacement, 2 Nos fresh rotameters of same new spec, 1 No PP Sheet 20 mm (30% disc on MRP ₹14,000), 1 day on-site T&P sensor installation, Acid Proof Tiles (₹1,00,000 lot) for the ground floor (below 1st floor mezzanine), Rubber 3 mm Electrical Insulation Supply & Layering (5 rolls @ ₹14,700/roll composite — material ₹11,700/roll + layering ₹3,000/roll) for the 1st floor mezzanine. Door delivery shown separately per consignment: ₹1,000 instrumentation (item 7), ₹500 PP sheet (item 8), ₹2,000 acid proof tiles (item 9), ₹2,000 rubber rolls for 3 mm electrical insulation (item 10) — all to Madhavaram, Chennai.

Lead times: PP Sheet + PP Sheet delivery → 1 day (by Tue 21 Apr 2026). All other items → by Fri 24 Apr 2026.',
  terms = 'Prices are exclusive of GST. GST @ 18% (CGST 9% + SGST 9%) applicable. Door delivery to India Zinc site, Madhavaram, Chennai included — ₹1,000 for instrumentation (item 7), ₹500 for PP sheet (item 8), ₹2,000 for acid proof tiles (item 9), ₹2,000 for rubber rolls for 3 mm electrical insulation (item 10). Lead times: PP Sheet (item 3) + PP Sheet delivery (item 8) → 1 day (by Tue 21 Apr 2026); all other items → by Fri 24 Apr 2026. Payment: 100% advance before dispatch. Validity: 30 days from quote date.'
WHERE quote_no = 'QT-2026-003';
