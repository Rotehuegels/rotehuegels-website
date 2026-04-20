-- ============================================================
-- QT-2026-003 amendment: validity reduced to 1 day
--   valid_until: 2026-05-20 → 2026-04-21 (next day)
-- Totals unchanged.
-- ============================================================

UPDATE quotes
SET
  valid_until = '2026-04-21',
  terms = 'Prices are exclusive of GST. GST @ 18% (CGST 9% + SGST 9%) applicable. Door delivery to India Zinc site, Madhavaram, Chennai included — ₹1,000 for instrumentation (item 7), ₹500 for PP sheet (item 8), ₹2,000 for acid proof tiles (item 9), ₹2,000 for rubber rolls for 3 mm electrical insulation (item 10). Lead times: T&P Sensor Installation (item 4) → next day of order placement; PP Sheet (item 3) + PP Sheet delivery (item 8) → 1 day (by Tue 21 Apr 2026 if ordered today); all other items → by Fri 24 Apr 2026. Payment: 100% advance before dispatch. Validity: 1 day only (valid until Tue 21 Apr 2026).'
WHERE quote_no = 'QT-2026-003';
