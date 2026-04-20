-- ============================================================
-- Re-code LKDN-* recyclers to ecosystem-wide {SOURCE}-{STATE}-{NNN}
-- - Two LKDN rows are duplicates of existing PMP rows; merge their
--   LinkedIn contacts_all into the existing row, then delete the LKDN row.
-- - Remaining 22 rows renamed per category:
--     primary-metal / producer  → PMP-{state}-{next}
--     e-waste / recycler        → CPCB-{state}-{next}
--     non-ferrous reprocessor   → NFMR-{state}-{next}
-- - Numbers continue from the existing max in each (source, state) bucket.
-- ============================================================

-- ── 1) Merge LinkedIn contacts_all from duplicate LKDN rows into the
--       existing primary PMP rows, then delete the LKDN duplicates.

-- LKDN-010 (Vedanta Jharsuguda) → merge into PMP-OR-004
UPDATE recyclers
SET contacts_all = (
      SELECT jsonb_agg(c)
      FROM (
        SELECT * FROM jsonb_array_elements(contacts_all)
        UNION ALL
        SELECT * FROM jsonb_array_elements(
          (SELECT contacts_all FROM recyclers WHERE recycler_code = 'LKDN-010')
        )
      ) AS t(c)
    ),
    notes = COALESCE(notes, '') || E'

LinkedIn contact merged from LKDN-010 (20 Apr 2026): ' ||
            COALESCE((SELECT notes FROM recyclers WHERE recycler_code = 'LKDN-010'), '')
WHERE recycler_code = 'PMP-OR-004';

DELETE FROM recyclers WHERE recycler_code = 'LKDN-010';

-- LKDN-014 (Hindalco Birla Copper Dahej) → merge into PMP-GJ-001
UPDATE recyclers
SET contacts_all = (
      SELECT jsonb_agg(c)
      FROM (
        SELECT * FROM jsonb_array_elements(contacts_all)
        UNION ALL
        SELECT * FROM jsonb_array_elements(
          (SELECT contacts_all FROM recyclers WHERE recycler_code = 'LKDN-014')
        )
      ) AS t(c)
    ),
    notes = COALESCE(notes, '') || E'

LinkedIn contact merged from LKDN-014 (20 Apr 2026): ' ||
            COALESCE((SELECT notes FROM recyclers WHERE recycler_code = 'LKDN-014'), '')
WHERE recycler_code = 'PMP-GJ-001';

DELETE FROM recyclers WHERE recycler_code = 'LKDN-014';

-- ── 2) Rename remaining 22 LKDN rows to their ecosystem codes.
-- Update email placeholders simultaneously so they match the new code.
UPDATE recyclers SET recycler_code = 'PMP-TN-001', email = 'pmp.tn.001@recycler.in' WHERE recycler_code = 'LKDN-001';
UPDATE recyclers SET recycler_code = 'PMP-TN-002', email = 'pmp.tn.002@recycler.in' WHERE recycler_code = 'LKDN-002';
UPDATE recyclers SET recycler_code = 'PMP-KA-001', email = 'pmp.ka.001@recycler.in' WHERE recycler_code = 'LKDN-003';
UPDATE recyclers SET recycler_code = 'PMP-TN-003', email = 'pmp.tn.003@recycler.in' WHERE recycler_code = 'LKDN-004';
UPDATE recyclers SET recycler_code = 'CPCB-KA-073', email = 'cpcb.ka.073@recycler.in' WHERE recycler_code = 'LKDN-005';
UPDATE recyclers SET recycler_code = 'CPCB-TS-024', email = 'cpcb.ts.024@recycler.in' WHERE recycler_code = 'LKDN-006';
UPDATE recyclers SET recycler_code = 'PMP-MH-001', email = 'pmp.mh.001@recycler.in' WHERE recycler_code = 'LKDN-007';
UPDATE recyclers SET recycler_code = 'PMP-MH-002', email = 'pmp.mh.002@recycler.in' WHERE recycler_code = 'LKDN-008';
UPDATE recyclers SET recycler_code = 'PMP-MH-003', email = 'pmp.mh.003@recycler.in' WHERE recycler_code = 'LKDN-009';
UPDATE recyclers SET recycler_code = 'PMP-DD-001', email = 'pmp.dd.001@recycler.in' WHERE recycler_code = 'LKDN-011';
UPDATE recyclers SET recycler_code = 'PMP-GJ-003', email = 'pmp.gj.003@recycler.in' WHERE recycler_code = 'LKDN-012';
UPDATE recyclers SET recycler_code = 'PMP-GJ-004', email = 'pmp.gj.004@recycler.in' WHERE recycler_code = 'LKDN-013';
UPDATE recyclers SET recycler_code = 'PMP-GJ-005', email = 'pmp.gj.005@recycler.in' WHERE recycler_code = 'LKDN-015';
UPDATE recyclers SET recycler_code = 'PMP-GJ-006', email = 'pmp.gj.006@recycler.in' WHERE recycler_code = 'LKDN-016';
UPDATE recyclers SET recycler_code = 'PMP-WB-001', email = 'pmp.wb.001@recycler.in' WHERE recycler_code = 'LKDN-017';
UPDATE recyclers SET recycler_code = 'PMP-GJ-007', email = 'pmp.gj.007@recycler.in' WHERE recycler_code = 'LKDN-018';
UPDATE recyclers SET recycler_code = 'CPCB-WB-006', email = 'cpcb.wb.006@recycler.in' WHERE recycler_code = 'LKDN-019';
UPDATE recyclers SET recycler_code = 'PMP-WB-002', email = 'pmp.wb.002@recycler.in' WHERE recycler_code = 'LKDN-020';
UPDATE recyclers SET recycler_code = 'PMP-GJ-008', email = 'pmp.gj.008@recycler.in' WHERE recycler_code = 'LKDN-021';
UPDATE recyclers SET recycler_code = 'PMP-GJ-009', email = 'pmp.gj.009@recycler.in' WHERE recycler_code = 'LKDN-022';
UPDATE recyclers SET recycler_code = 'CPCB-HR-044', email = 'cpcb.hr.044@recycler.in' WHERE recycler_code = 'LKDN-023';
UPDATE recyclers SET recycler_code = 'NFMR-HR-029', email = 'nfmr.hr.029@recycler.in' WHERE recycler_code = 'LKDN-024';
