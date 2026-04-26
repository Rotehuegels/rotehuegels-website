-- ── Regional sales reps in the org chart ────────────────────────────────────
-- Reps are part of Sales & Marketing functionally but live in different
-- countries and are typically engaged as consultants on commission. Adding
-- them as first-class positions keeps the org chart honest, lets each rep
-- be assigned an employee record (as employment_type='consultant'), and lets
-- approvals/escalations cascade Rep → SM Head → CEO via the existing rule.

-- 1. Tag columns on positions for country + engagement mode.
ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS country_code text,             -- ISO 3166-1 alpha-2: 'IN', 'SG', 'US', 'AE'
  ADD COLUMN IF NOT EXISTS is_external  boolean NOT NULL DEFAULT false;
  -- is_external = true means consultant/commission/agent (not a salaried HQ role)

-- Backfill: HQ positions are domestic + non-external by default (already the
-- column default for is_external; country_code stays NULL meaning "not flagged
-- as a specific territory").

-- 2. Starter regional reps. Both report to Head of Sales & Marketing.
INSERT INTO positions (id, title, short_title, department_id, reports_to_id, is_head, level, sort_order, country_code, is_external) VALUES
  ('sm-rep-sg', 'Singapore Sales Representative', 'Singapore Rep', 'sales-marketing', 'sm-head', false, 3, 412, 'SG', true),
  ('sm-rep-us', 'USA Sales Representative',       'USA Rep',       'sales-marketing', 'sm-head', false, 3, 413, 'US', true)
ON CONFLICT (id) DO UPDATE SET
  title         = EXCLUDED.title,
  short_title   = EXCLUDED.short_title,
  department_id = EXCLUDED.department_id,
  reports_to_id = EXCLUDED.reports_to_id,
  is_head       = EXCLUDED.is_head,
  level         = EXCLUDED.level,
  sort_order    = EXCLUDED.sort_order,
  country_code  = EXCLUDED.country_code,
  is_external   = EXCLUDED.is_external;

-- 3. Refresh the view to expose the new columns.
DROP VIEW IF EXISTS org_chart_view;
CREATE VIEW org_chart_view AS
SELECT
  p.id                AS position_id,
  p.title             AS position_title,
  p.short_title       AS position_short_title,
  p.level,
  p.is_head,
  p.is_external,
  p.country_code,
  p.sort_order        AS position_sort,
  p.reports_to_id,
  d.id                AS department_id,
  d.name              AS department_name,
  d.parent_id         AS department_parent,
  d.sort_order        AS department_sort,
  p.filled_by_employee_id,
  e.full_name         AS employee_name,
  e.email             AS employee_email,
  e.employment_type,
  e.status            AS employee_status
FROM positions p
LEFT JOIN departments d ON d.id = p.department_id
LEFT JOIN employees   e ON e.id = p.filled_by_employee_id
WHERE p.active = true;

NOTIFY pgrst, 'reload schema';
