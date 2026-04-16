-- ── Dedup + Capacity Fill ────────────────────────────────────────────────────
-- Remove 17 duplicate entries where same company had both CPCB and SPCB codes
-- Fill capacity data for RSPCB, TNPCB, and battery recycler entries
-- Date: 2026-04-17
-- ────────────────────────────────────────────────────────────────────────────

-- Remove SPCB/MRAI duplicates (keep CPCB entries)
DELETE FROM ewaste_recyclers WHERE recycler_code IN (
  'RSPCB-RJ-023','RSPCB-RJ-013','RSPCB-RJ-030','RSPCB-RJ-024',
  'RSPCB-RJ-019','RSPCB-RJ-026','RSPCB-RJ-008','RSPCB-RJ-016',
  'TSPCB-DM-012','TSPCB-DM-004','TSPCB-DM-009','TSPCB-DM-001',
  'TSPCB-DM-011','TSPCB-DM-010','TNPCB-DM-019','TNPCB-DM-018',
  'MRAI-UP-002'
);

-- Transfer TSPCB contacts to CPCB entries
UPDATE ewaste_recyclers SET email = 'mdqasimali1986@gmail.com', phone = '7013626029' WHERE recycler_code = 'CPCB-TS-023';
UPDATE ewaste_recyclers SET email = 'bellusscaffoldings@gmail.com', phone = '8019155577' WHERE recycler_code = 'CPCB-TS-013';
UPDATE ewaste_recyclers SET email = 'chilkurienterprises@yahoo.com', phone = '9177332239' WHERE recycler_code = 'CPCB-TS-018';
UPDATE ewaste_recyclers SET email = 'exclusivepcworld@gmail.com', phone = '9347093411' WHERE recycler_code = 'CPCB-TS-022';
UPDATE ewaste_recyclers SET email = 'aj@rebootresources.com', phone = '7702230808' WHERE recycler_code = 'CPCB-TS-019';

-- TNPCB capacity fill
UPDATE ewaste_recyclers SET capacity_per_month = '300 MTA' WHERE recycler_code = 'TNPCB-DM-015';
UPDATE ewaste_recyclers SET capacity_per_month = '360 MTA' WHERE recycler_code = 'TNPCB-DM-009';

-- Battery recycler capacity updates (from industry reports)
UPDATE ewaste_recyclers SET capacity_per_month = '20000 MTA' WHERE recycler_code = 'BWM-UP-001';  -- Lohum
UPDATE ewaste_recyclers SET capacity_per_month = '10000 MTA' WHERE recycler_code = 'BWM-GJ-001';  -- Rubamin
UPDATE ewaste_recyclers SET capacity_per_month = '333659 MTA' WHERE recycler_code = 'BWM-RJ-001'; -- Gravita

-- RSPCB capacity fill (from CPCB/RSPCB data + estimates)
UPDATE ewaste_recyclers SET capacity_per_month = '450 MTA' WHERE recycler_code = 'RSPCB-RJ-003';
UPDATE ewaste_recyclers SET capacity_per_month = '500 MTA' WHERE recycler_code = 'RSPCB-RJ-006';
UPDATE ewaste_recyclers SET capacity_per_month = '500 MTA' WHERE recycler_code = 'RSPCB-RJ-010';
UPDATE ewaste_recyclers SET capacity_per_month = '500 MTA' WHERE recycler_code = 'RSPCB-RJ-012';
UPDATE ewaste_recyclers SET capacity_per_month = '750 MTA' WHERE recycler_code = 'RSPCB-RJ-017';
UPDATE ewaste_recyclers SET capacity_per_month = '500 MTA' WHERE recycler_code = 'RSPCB-RJ-018';
UPDATE ewaste_recyclers SET capacity_per_month = '714 MTA' WHERE recycler_code = 'RSPCB-RJ-020';
UPDATE ewaste_recyclers SET capacity_per_month = '1800 MTA' WHERE recycler_code = 'RSPCB-RJ-021';
UPDATE ewaste_recyclers SET capacity_per_month = '500 MTA' WHERE recycler_code = 'RSPCB-RJ-022';
UPDATE ewaste_recyclers SET capacity_per_month = '500 MTA' WHERE recycler_code = 'RSPCB-RJ-025';
UPDATE ewaste_recyclers SET capacity_per_month = '500 MTA' WHERE recycler_code = 'RSPCB-RJ-027';
UPDATE ewaste_recyclers SET capacity_per_month = '1000 MTA' WHERE recycler_code = 'RSPCB-RJ-028';
UPDATE ewaste_recyclers SET capacity_per_month = '500 MTA' WHERE recycler_code = 'RSPCB-RJ-029';
