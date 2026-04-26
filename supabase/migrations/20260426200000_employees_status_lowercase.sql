-- ── Standardise employees.status to lowercase ───────────────────────────────
-- Production has 'ACTIVE' but every Zod schema and most query sites assume
-- lowercase ('active', 'inactive', 'terminated', 'completed'). The
-- inconsistency caused the org-chart Assign picker and three payroll routes
-- to silently return zero rows.
--
-- One-shot normalisation + CHECK constraint to lock it in.

-- 1. Normalise existing rows.
UPDATE employees
   SET status = lower(status)
 WHERE status IS NOT NULL
   AND status <> lower(status);

-- 2. Constrain the column so future writes can't reintroduce the mismatch.
ALTER TABLE employees
  DROP CONSTRAINT IF EXISTS chk_employees_status_lowercase;

ALTER TABLE employees
  ADD CONSTRAINT chk_employees_status_lowercase
  CHECK (status IS NULL OR status = lower(status));

NOTIFY pgrst, 'reload schema';
