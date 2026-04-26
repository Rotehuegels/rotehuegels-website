-- ── Auto-link employees.rex_id to rex_members by email ──────────────────────
-- The two tables already have an FK relationship (employees.rex_id →
-- rex_members.rex_id) but maintaining the link manually is friction:
-- HR adds an employee row from contact details, the person later registers
-- on the public REX portal, and now you'd have to remember to splice the
-- rex_id back into the employee row by hand.
--
-- These two triggers do the splice automatically by matching email
-- (case-insensitive). Either side of the relationship can be created first;
-- whichever lands second triggers the link.

-- 1. Backfill — pair up any existing rows that already share an email.
UPDATE employees e
   SET rex_id = m.rex_id
  FROM rex_members m
 WHERE e.rex_id IS NULL
   AND e.email IS NOT NULL
   AND m.email IS NOT NULL
   AND lower(e.email) = lower(m.email);

-- 2. Trigger A — REX registration arrives, employee already exists.
--    Fires AFTER on rex_members so we can UPDATE the employees row with the
--    freshly-minted rex_id.
CREATE OR REPLACE FUNCTION link_employee_to_rex_member() RETURNS trigger AS $$
BEGIN
  IF NEW.email IS NULL THEN RETURN NEW; END IF;
  UPDATE employees
     SET rex_id = NEW.rex_id
   WHERE rex_id IS NULL
     AND email IS NOT NULL
     AND lower(email) = lower(NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rex_members_link_employee ON rex_members;
CREATE TRIGGER trg_rex_members_link_employee
  AFTER INSERT OR UPDATE OF email, rex_id ON rex_members
  FOR EACH ROW
  EXECUTE FUNCTION link_employee_to_rex_member();

-- 3. Trigger B — employee is created (or has their email changed) after the
--    REX registration was already on file. Pre-fills NEW.rex_id from the
--    matching rex_members row. BEFORE trigger so we can mutate NEW directly.
CREATE OR REPLACE FUNCTION backfill_employee_rex_id() RETURNS trigger AS $$
BEGIN
  IF NEW.rex_id IS NULL AND NEW.email IS NOT NULL THEN
    SELECT rex_id INTO NEW.rex_id
      FROM rex_members
     WHERE email IS NOT NULL
       AND lower(email) = lower(NEW.email)
     LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_employees_backfill_rex_id ON employees;
CREATE TRIGGER trg_employees_backfill_rex_id
  BEFORE INSERT OR UPDATE OF email ON employees
  FOR EACH ROW
  EXECUTE FUNCTION backfill_employee_rex_id();
