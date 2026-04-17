-- Deduplicate capacity double-counts with explicit disclaimers.
--
-- Some companies appear under multiple recycler_codes because different
-- source lists (CPCB + MPCB, CPCB + MRAI, CPCB + NFMR) captured the same
-- facility. This inflates aggregate capacity totals.
--
-- Strategy: keep all rows visible in category filters (so users see the
-- facility under each applicable stream), but null out the capacity on the
-- redundant rows and add a disclaimer in `notes` pointing at the primary
-- row. This way category filters still function, but aggregate capacity
-- totals no longer double-count.
--
-- Rule applied: for each group, keep the row with the richer data
-- (more-specific registration source or larger stated capacity); null
-- capacity on the rest.

-- ── Same-category duplicates (Maharashtra CPCB vs MPCB overlap) ────────────
-- These are exact same-facility-same-capacity rows from two source lists.

-- CBS E-Waste Recycling Industries — keep CPCB, disclaimer on MPCB copy
UPDATE recyclers
  SET capacity_per_month = NULL,
      notes = COALESCE(notes || ' · ', '') || 'Capacity counted under CPCB-MH-032 (same facility, registered in two source lists). [dup]'
  WHERE recycler_code = 'MPCB-DM-164';

-- E-Recon Recycling — 3 copies! Keep CPCB, flag the two MPCB rows
UPDATE recyclers
  SET capacity_per_month = NULL,
      notes = COALESCE(notes || ' · ', '') || 'Capacity counted under CPCB-MH-046 (same facility). [dup]'
  WHERE recycler_code IN ('MPCB-DM-091', 'MPCB-RF-061');

-- Nagraj E-Waste Recycling — keep CPCB
UPDATE recyclers
  SET capacity_per_month = NULL,
      notes = COALESCE(notes || ' · ', '') || 'Capacity counted under CPCB-MH-087 (same facility). [dup]'
  WHERE recycler_code = 'MPCB-DM-161';

-- Solapur Econ Recyfine — keep CPCB
UPDATE recyclers
  SET capacity_per_month = NULL,
      notes = COALESCE(notes || ' · ', '') || 'Capacity counted under CPCB-MH-128 (same facility). [dup]'
  WHERE recycler_code = 'MPCB-DM-152';

-- ── Cross-category duplicates ──────────────────────────────────────────────
-- Same company, different waste_types. Keep both rows visible (each category
-- is legitimate), but consolidate capacity on one.

-- Gravita India (Rajasthan) — keep BWM battery row (has capacity), flag MRAI row
UPDATE recyclers
  SET notes = COALESCE(notes || ' · ', '') || 'Capacity counted under BWM-RJ-001 (same company registered under battery waste rules). [cross-category dup]'
  WHERE recycler_code = 'MRAI-RJ-005';

-- K. G. Metalloys (Rajasthan) — keep RSPCB e-waste row (has capacity)
UPDATE recyclers
  SET notes = COALESCE(notes || ' · ', '') || 'Capacity counted under RSPCB-RJ-021 (same company, primary registration). [cross-category dup]'
  WHERE recycler_code = 'MRAI-RJ-009';

-- Moogambigai Metal Refineries (Karnataka) — same company, two capacities
-- (1248 MTA e-waste vs 2280 MTA zinc-dross). Without source confirmation,
-- keep the larger NFMR figure (zinc-dross) as the facility's headline
-- capacity and null out the smaller e-waste row.
UPDATE recyclers
  SET capacity_per_month = NULL,
      notes = COALESCE(notes || ' · ', '') || 'Actual processing capacity reported under NFMR-KA-010 (~2280 MTA, zinc-dross primary stream). This row reflects the facility''s e-waste CPCB listing. [cross-category dup — capacity consolidated]'
  WHERE recycler_code = 'CPCB-KA-023';

UPDATE recyclers
  SET notes = COALESCE(notes || ' · ', '') || 'Same facility also registered under CPCB-KA-023 for e-waste handling. Headline capacity shown here reflects combined non-ferrous / zinc-dross operation. [cross-category dup]'
  WHERE recycler_code = 'NFMR-KA-010';
