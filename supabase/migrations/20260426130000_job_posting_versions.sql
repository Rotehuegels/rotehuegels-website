-- ── Job posting version control ──────────────────────────────────────────────
-- Captures every UPDATE to job_postings into job_posting_versions so the
-- recruitment team can see who edited what and roll back if needed.
--
-- The PATCH handler in /api/ats/jobs/[id] sets last_edited_by_email = user.email
-- on the same UPDATE that triggers the snapshot. The trigger reads NEW.last_edited_by_email
-- so we don't have to fight PostgREST connection pooling for session variables.

ALTER TABLE job_postings
  ADD COLUMN IF NOT EXISTS last_edited_by_email text;

CREATE TABLE IF NOT EXISTS job_posting_versions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          uuid        NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  version_no      integer     NOT NULL,
  -- Snapshot of the columns we care about (matches job_postings)
  title           text,
  department      text,
  location        text,
  employment_type text,
  description     text,
  requirements    text,
  status          text,
  -- Audit
  edited_by_email text,
  change_summary  text,                                                  -- optional human-readable summary; can be filled by app
  snapshot_at     timestamptz DEFAULT now(),
  UNIQUE (job_id, version_no)
);

CREATE INDEX IF NOT EXISTS idx_job_posting_versions_job ON job_posting_versions (job_id, version_no DESC);

-- Trigger function: snapshot OLD on every meaningful UPDATE
CREATE OR REPLACE FUNCTION snapshot_job_posting_version() RETURNS trigger AS $$
DECLARE
  next_v integer;
BEGIN
  -- Skip if nothing meaningful changed (avoid noise from updated_at-only updates)
  IF NEW.title           IS NOT DISTINCT FROM OLD.title           AND
     NEW.department      IS NOT DISTINCT FROM OLD.department      AND
     NEW.location        IS NOT DISTINCT FROM OLD.location        AND
     NEW.employment_type IS NOT DISTINCT FROM OLD.employment_type AND
     NEW.description     IS NOT DISTINCT FROM OLD.description     AND
     NEW.requirements    IS NOT DISTINCT FROM OLD.requirements    AND
     NEW.status          IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX(version_no), 0) + 1 INTO next_v
  FROM job_posting_versions WHERE job_id = OLD.id;

  -- The PATCH handler stamps NEW.last_edited_by_email on every update, so we
  -- read it directly off the row being saved.
  INSERT INTO job_posting_versions (
    job_id, version_no, title, department, location, employment_type,
    description, requirements, status, edited_by_email
  ) VALUES (
    OLD.id, next_v, OLD.title, OLD.department, OLD.location, OLD.employment_type,
    OLD.description, OLD.requirements, OLD.status, NEW.last_edited_by_email
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_job_postings_version ON job_postings;
CREATE TRIGGER trg_job_postings_version
  BEFORE UPDATE ON job_postings
  FOR EACH ROW
  EXECUTE FUNCTION snapshot_job_posting_version();
