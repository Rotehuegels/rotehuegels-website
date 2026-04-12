-- ============================================================
-- Projects Module — Client Project Portal
-- ============================================================

-- Projects: high-level project wrapper
CREATE TABLE IF NOT EXISTS projects (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_code     TEXT UNIQUE NOT NULL,
  customer_id      UUID NOT NULL REFERENCES customers(id),
  name             TEXT NOT NULL,
  description      TEXT,
  status           TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  start_date       DATE,
  target_end_date  DATE,
  actual_end_date  DATE,
  completion_pct   INT DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
  site_location    TEXT,
  project_manager  TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Project ↔ Order link (many-to-many)
CREATE TABLE IF NOT EXISTS project_orders (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, order_id)
);

-- Project milestones (timeline phases)
CREATE TABLE IF NOT EXISTS project_milestones (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_no    INT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  phase           TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  start_date      DATE,
  target_date     DATE,
  completed_date  DATE,
  completion_pct  INT DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
  deliverables    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Change requests (scope changes from client)
CREATE TABLE IF NOT EXISTS change_requests (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  change_no        TEXT NOT NULL,
  requested_by     UUID REFERENCES auth.users(id),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  reason           TEXT,
  cost_impact      NUMERIC(14,2) DEFAULT 0,
  schedule_impact  TEXT,
  status           TEXT NOT NULL DEFAULT 'requested'
                     CHECK (status IN ('requested', 'under_review', 'approved', 'rejected', 'implemented')),
  admin_notes      TEXT,
  reviewed_by      TEXT,
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Project documents (metadata; actual files in Supabase Storage)
CREATE TABLE IF NOT EXISTS project_documents (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id         UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name          TEXT NOT NULL,
  file_type          TEXT,
  file_size          INT,
  storage_path       TEXT NOT NULL,
  description        TEXT,
  uploaded_by        TEXT,
  visible_to_client  BOOLEAN DEFAULT true,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Project activity feed
CREATE TABLE IF NOT EXISTS project_activities (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id         UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  activity_type      TEXT NOT NULL
                       CHECK (activity_type IN (
                         'status_change', 'milestone_update', 'payment_received',
                         'document_uploaded', 'change_request', 'note', 'deliverable'
                       )),
  title              TEXT NOT NULL,
  description        TEXT,
  actor              TEXT,
  metadata           JSONB,
  visible_to_client  BOOLEAN DEFAULT true,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_customer ON projects(customer_id);
CREATE INDEX idx_project_orders_project ON project_orders(project_id);
CREATE INDEX idx_project_orders_order ON project_orders(order_id);
CREATE INDEX idx_milestones_project ON project_milestones(project_id);
CREATE INDEX idx_change_requests_project ON change_requests(project_id);
CREATE INDEX idx_project_documents_project ON project_documents(project_id);
CREATE INDEX idx_project_activities_project ON project_activities(project_id);
CREATE INDEX idx_project_activities_created ON project_activities(created_at DESC);

-- Triggers
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER milestones_updated_at
  BEFORE UPDATE ON project_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER change_requests_updated_at
  BEFORE UPDATE ON change_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Seed: India Zinc — Zinc Dross Recovery Project
-- ============================================================

INSERT INTO projects (
  project_code, customer_id, name, description, status,
  start_date, target_end_date, completion_pct,
  site_location, project_manager
) SELECT
  'PRJ-2026-001',
  id,
  'Zinc Dross Recovery Plant — EPC',
  'Complete engineering, procurement, and commissioning of zinc dross recovery plant including plumbing, electrical, automation (AutoREX), and instrumentation.',
  'active',
  '2025-01-01', '2026-05-31', 85,
  'Chennai Plant', 'Sivakumar Shanmugam'
FROM customers WHERE customer_id = 'CUST-001';

-- Link all India Zinc orders
INSERT INTO project_orders (project_id, order_id)
SELECT p.id, o.id
FROM projects p
JOIN orders o ON o.customer_id = p.customer_id
WHERE p.project_code = 'PRJ-2026-001'
  AND o.status != 'cancelled';

-- Seed milestones
INSERT INTO project_milestones (project_id, milestone_no, title, phase, status, start_date, target_date, completed_date, completion_pct, deliverables)
SELECT p.id, v.milestone_no, v.title, v.phase, v.status, v.start_date::date, v.target_date::date, v.completed_date, v.completion_pct, v.deliverables
FROM projects p,
(VALUES
  (1, 'Engineering & Design',      'Phase 1: Design',        'completed',   '2025-01-01', '2025-03-31', '2025-03-15'::date, 100, 'Process flow diagrams, P&ID, equipment specifications'),
  (2, 'Equipment Procurement',     'Phase 2: Procurement',   'completed',   '2025-02-01', '2025-06-30', '2026-02-28'::date, 100, 'Lead anodes, aluminium cathode, sensors, instruments'),
  (3, 'Plumbing & Electrical',     'Phase 3: Installation',  'completed',   '2025-11-01', '2026-02-28', '2026-03-15'::date, 100, 'Water system, electrical connections, bus bars'),
  (4, 'AutoREX Implementation',    'Phase 4: Automation',    'in_progress', '2026-01-31', '2026-04-30', NULL,               75,  'Control system, sensor integration, HMI'),
  (5, 'Commissioning & Testing',   'Phase 5: Handover',      'pending',     '2026-04-15', '2026-05-31', NULL,                0,  'Water testing, process validation, handover')
) AS v(milestone_no, title, phase, status, start_date, target_date, completed_date, completion_pct, deliverables)
WHERE p.project_code = 'PRJ-2026-001';

-- Seed initial activities
INSERT INTO project_activities (project_id, activity_type, title, description, actor, visible_to_client)
SELECT p.id, v.activity_type, v.title, v.description, v.actor, true
FROM projects p,
(VALUES
  ('note',             'Project kickoff',                  'Engineering design phase started for zinc dross recovery plant.',        'Sivakumar Shanmugam'),
  ('milestone_update', 'Design phase completed',           'All P&IDs and equipment specs approved.',                               'Sivakumar Shanmugam'),
  ('milestone_update', 'Equipment procurement completed',  'All major equipment (anodes, cathode, sensors) received at site.',      'Sivakumar Shanmugam'),
  ('milestone_update', 'Installation phase completed',     'Plumbing, electrical, and bus bar installation finished.',              'Sivakumar Shanmugam'),
  ('status_change',    'AutoREX implementation in progress','Control system setup and sensor integration underway. 75% complete.', 'Sivakumar Shanmugam')
) AS v(activity_type, title, description, actor)
WHERE p.project_code = 'PRJ-2026-001';
