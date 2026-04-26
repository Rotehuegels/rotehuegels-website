-- ── Organisation structure (departments + positions) ─────────────────────────
-- Skeleton tree filled with vacant slots so the org chart and approval
-- cascade work even before any employees are hired into them.
--
-- Hierarchy levels:
--   0 — CEO
--   1 — CXOs (COO / CFO / CTO)
--   2 — Department heads
--   3 — Department assistants
--
-- Approval cascade: when a position is vacant, the resolver walks up
-- reports_to_id until it finds a filled position. CEO is the terminal —
-- everything funnels there until other roles get filled.

CREATE TABLE IF NOT EXISTS departments (
  id            text         PRIMARY KEY,                                 -- slug, e.g. 'engineering'
  name          text         NOT NULL,
  description   text,
  parent_id     text         REFERENCES departments(id),                  -- nullable; top-level depts have NULL
  sort_order    integer      NOT NULL DEFAULT 0,
  active        boolean      NOT NULL DEFAULT true,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS positions (
  id                    text         PRIMARY KEY,                         -- slug, e.g. 'eng-head'
  title                 text         NOT NULL,                            -- 'Head of Engineering'
  short_title           text,                                              -- 'Engineering Head'
  department_id         text         REFERENCES departments(id) ON DELETE SET NULL,
  reports_to_id         text         REFERENCES positions(id)   ON DELETE SET NULL,
  is_head               boolean      NOT NULL DEFAULT false,              -- this is the dept head
  level                 integer      NOT NULL,                            -- 0=CEO, 1=CXO, 2=head, 3=asst
  filled_by_employee_id uuid         REFERENCES employees(id)   ON DELETE SET NULL,
  sort_order            integer      NOT NULL DEFAULT 0,
  active                boolean      NOT NULL DEFAULT true,
  created_at            timestamptz  NOT NULL DEFAULT now(),
  updated_at            timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_positions_department ON positions (department_id);
CREATE INDEX IF NOT EXISTS idx_positions_reports_to ON positions (reports_to_id);
CREATE INDEX IF NOT EXISTS idx_positions_filled_by  ON positions (filled_by_employee_id);

-- updated_at triggers
CREATE OR REPLACE FUNCTION touch_org_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_departments_updated_at ON departments;
CREATE TRIGGER trg_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION touch_org_updated_at();

DROP TRIGGER IF EXISTS trg_positions_updated_at ON positions;
CREATE TRIGGER trg_positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION touch_org_updated_at();

-- ── SEED: departments ─────────────────────────────────────────────────────────
INSERT INTO departments (id, name, description, parent_id, sort_order) VALUES
  ('executive',           'Executive',                   'CEO + CXO leadership',                NULL,         0),
  ('engineering',         'Engineering',                 'Plant EPC, design, fabrication',      'executive',  10),
  ('operations',          'Operations',                  'Plant operations, contracts, lab',    'executive',  20),
  ('rnd',                 'R&D',                         'Pilot, testwork, methods development', 'executive', 30),
  ('procurement',         'Procurement',                 'Vendor management, purchasing',       'executive',  40),
  ('warehouse',           'Warehouse',                   'Stock, inventory, dispatch, logistics', 'executive', 50),
  ('quality',             'Quality & Compliance',        'IMS, ISO, regulatory audits',         'executive',  60),
  ('finance',             'Finance & Accounts',          'Bookkeeping, GST, P&L, payroll',      'executive',  70),
  ('legal',               'Legal & Compliance',          'CS, contracts, statutory',            'executive',  80),
  ('software',            'Software & Platform',         'AutoREX / Operon / LabREX',           'executive',  90),
  ('it',                  'IT & Systems',                'Internal IT, ERP admin, security',    'executive', 100),
  ('sales-marketing',     'Sales & Marketing',           'Sales, BD, brand, lead gen',          'executive', 110),
  ('hr',                  'Human Resources',             'Hiring, payroll, leave, EHS',         'executive', 120)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order;

-- ── SEED: positions ──────────────────────────────────────────────────────────
-- Two-pass seed so reports_to_id can reference siblings inserted in pass 1.
-- Pass 1: leadership (CEO + CXOs)
INSERT INTO positions (id, title, short_title, department_id, reports_to_id, is_head, level, sort_order) VALUES
  ('ceo', 'Chief Executive Officer', 'CEO', 'executive', NULL,  true, 0,  0),
  ('coo', 'Chief Operating Officer', 'COO', 'executive', 'ceo', true, 1, 10),
  ('cfo', 'Chief Financial Officer', 'CFO', 'executive', 'ceo', true, 1, 20),
  ('cto', 'Chief Technology Officer', 'CTO', 'executive', 'ceo', true, 1, 30)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  short_title = EXCLUDED.short_title,
  department_id = EXCLUDED.department_id,
  reports_to_id = EXCLUDED.reports_to_id,
  is_head = EXCLUDED.is_head,
  level = EXCLUDED.level,
  sort_order = EXCLUDED.sort_order;

-- Pass 2: dept heads + assistants. report_to is the relevant CXO (or CEO).
INSERT INTO positions (id, title, short_title, department_id, reports_to_id, is_head, level, sort_order) VALUES
  -- COO branch
  ('eng-head',          'Head of Engineering',         'Engineering',     'engineering',     'coo', true,  2, 110),
  ('eng-asst',          'Engineering Assistant',       'Eng. Assistant',  'engineering',     'eng-head', false, 3, 111),
  ('ops-head',          'Head of Operations',          'Operations',      'operations',      'coo', true,  2, 120),
  ('ops-asst',          'Operations Assistant',        'Ops. Assistant',  'operations',      'ops-head', false, 3, 121),
  ('rnd-head',          'Head of R&D',                 'R&D',             'rnd',             'coo', true,  2, 130),
  ('rnd-asst',          'R&D Assistant',               'R&D Assistant',   'rnd',             'rnd-head', false, 3, 131),
  ('proc-head',         'Head of Procurement',         'Procurement',     'procurement',     'coo', true,  2, 140),
  ('proc-asst',         'Procurement Assistant',       'Proc. Assistant', 'procurement',     'proc-head', false, 3, 141),
  ('wh-head',           'Head of Warehouse',           'Warehouse',       'warehouse',       'coo', true,  2, 150),
  ('wh-asst',           'Warehouse Assistant',         'WH. Assistant',   'warehouse',       'wh-head', false, 3, 151),
  ('qa-head',           'Head of Quality & Compliance','QA/QC',           'quality',         'coo', true,  2, 160),
  ('qa-asst',           'Quality Assistant',           'QA Assistant',    'quality',         'qa-head', false, 3, 161),
  -- CFO branch
  ('fin-head',          'Head of Finance & Accounts',  'Finance',         'finance',         'cfo', true,  2, 210),
  ('fin-asst',          'Finance Assistant',           'Fin. Assistant',  'finance',         'fin-head', false, 3, 211),
  ('legal-head',        'Head of Legal & Compliance',  'Legal',           'legal',           'cfo', true,  2, 220),
  ('legal-asst',        'Legal Assistant',             'Legal Assistant', 'legal',           'legal-head', false, 3, 221),
  -- CTO branch
  ('sw-head',           'Head of Software & Platform', 'Software',        'software',        'cto', true,  2, 310),
  ('sw-asst',           'Software Assistant',          'SW Assistant',    'software',        'sw-head', false, 3, 311),
  ('it-head',           'Head of IT & Systems',        'IT',              'it',              'cto', true,  2, 320),
  ('it-asst',           'IT Assistant',                'IT Assistant',    'it',              'it-head', false, 3, 321),
  -- Direct reports to CEO
  ('sm-head',           'Head of Sales & Marketing',   'Sales & Mktg',    'sales-marketing', 'ceo', true,  2, 410),
  ('sm-asst',           'Sales & Marketing Assistant', 'S&M Assistant',   'sales-marketing', 'sm-head', false, 3, 411),
  ('hr-head',           'Head of Human Resources',     'HR',              'hr',              'ceo', true,  2, 420),
  ('hr-asst',           'HR Assistant',                'HR Assistant',    'hr',              'hr-head', false, 3, 421)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  short_title = EXCLUDED.short_title,
  department_id = EXCLUDED.department_id,
  reports_to_id = EXCLUDED.reports_to_id,
  is_head = EXCLUDED.is_head,
  level = EXCLUDED.level,
  sort_order = EXCLUDED.sort_order;

-- ── Approval cascade resolver ────────────────────────────────────────────────
-- Walks up reports_to_id until it finds a filled position; returns the
-- employee_id. Returns NULL if everyone in the chain (including CEO) is vacant —
-- callers should treat that as "fall back to admin set".

CREATE OR REPLACE FUNCTION resolve_approver_for_position(p_position_id text)
RETURNS uuid AS $$
DECLARE
  cur_id        text := p_position_id;
  cur_filled    uuid;
  cur_parent    text;
  guard         integer := 0;   -- belt-and-suspenders against accidental cycles
BEGIN
  WHILE cur_id IS NOT NULL AND guard < 20 LOOP
    SELECT filled_by_employee_id, reports_to_id
      INTO cur_filled, cur_parent
      FROM positions
     WHERE id = cur_id AND active = true;

    IF cur_filled IS NOT NULL THEN
      RETURN cur_filled;
    END IF;

    cur_id := cur_parent;
    guard  := guard + 1;
  END LOOP;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Convenience view for the org chart UI: every position with optional
-- employee data joined in. Vacant positions still show up with NULL employee.
CREATE OR REPLACE VIEW org_chart_view AS
SELECT
  p.id                AS position_id,
  p.title             AS position_title,
  p.short_title       AS position_short_title,
  p.level,
  p.is_head,
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
