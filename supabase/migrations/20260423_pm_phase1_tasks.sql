-- PM Phase 1 — task layer on top of the existing projects module.
-- Adds: project_tasks (with subtask support), task_comments, project_labels,
-- task_labels (M2M), task_dependencies (M2M). Extends project_activities
-- so task events can flow through the existing feed.

-- ── project_labels ─────────────────────────────────────────────────────
create table if not exists project_labels (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  name        text not null,
  color       text not null default '#6366f1',
  created_at  timestamptz not null default now(),
  unique (project_id, name)
);
create index if not exists idx_project_labels_project on project_labels(project_id);

-- ── project_tasks ──────────────────────────────────────────────────────
create table if not exists project_tasks (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references projects(id) on delete cascade,
  parent_task_id uuid references project_tasks(id) on delete cascade,
  milestone_id   uuid references project_milestones(id) on delete set null,
  title          text not null,
  description    text,
  status         text not null default 'backlog'
                   check (status in ('backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled')),
  priority       text not null default 'normal'
                   check (priority in ('low', 'normal', 'high', 'urgent')),
  assignee_id    uuid references employees(id) on delete set null,
  due_date       date,
  start_date     date,
  estimate_hours numeric(8,2),
  actual_hours   numeric(8,2) default 0,
  order_index    integer not null default 0,
  created_by     text,
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_project_tasks_project        on project_tasks(project_id);
create index if not exists idx_project_tasks_status_project on project_tasks(project_id, status);
create index if not exists idx_project_tasks_assignee       on project_tasks(assignee_id) where assignee_id is not null;
create index if not exists idx_project_tasks_parent         on project_tasks(parent_task_id) where parent_task_id is not null;
create index if not exists idx_project_tasks_milestone      on project_tasks(milestone_id) where milestone_id is not null;

-- ── task_labels (M2M) ──────────────────────────────────────────────────
create table if not exists task_labels (
  task_id  uuid not null references project_tasks(id) on delete cascade,
  label_id uuid not null references project_labels(id) on delete cascade,
  primary key (task_id, label_id)
);
create index if not exists idx_task_labels_label on task_labels(label_id);

-- ── task_dependencies (M2M — blocker ↔ blocked) ───────────────────────
create table if not exists task_dependencies (
  blocker_task_id uuid not null references project_tasks(id) on delete cascade,
  blocked_task_id uuid not null references project_tasks(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (blocker_task_id, blocked_task_id),
  check (blocker_task_id <> blocked_task_id)
);
create index if not exists idx_task_dependencies_blocked on task_dependencies(blocked_task_id);

-- ── task_comments ──────────────────────────────────────────────────────
create table if not exists task_comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references project_tasks(id) on delete cascade,
  author     text not null,
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_task_comments_task on task_comments(task_id, created_at);

-- ── Extend project_activities to cover task events ────────────────────
-- The existing check constraint allows a fixed list of activity types.
-- Drop and recreate with task events added.
alter table project_activities drop constraint if exists project_activities_activity_type_check;
alter table project_activities add constraint project_activities_activity_type_check
  check (activity_type in (
    'status_change', 'milestone_update', 'payment_received',
    'document_uploaded', 'change_request', 'note', 'deliverable',
    'task_created', 'task_updated', 'task_moved', 'task_assigned',
    'task_completed', 'task_commented', 'task_deleted'
  ));

-- Handy reference column so we can filter activities by task.
alter table project_activities add column if not exists task_id uuid references project_tasks(id) on delete set null;
create index if not exists idx_project_activities_task on project_activities(task_id) where task_id is not null;

-- Triggers
drop trigger if exists project_tasks_updated_at on project_tasks;
create trigger project_tasks_updated_at
  before update on project_tasks for each row execute function update_updated_at_column();

drop trigger if exists task_comments_updated_at on task_comments;
create trigger task_comments_updated_at
  before update on task_comments for each row execute function update_updated_at_column();

-- ── RLS (service-role writes via supabaseAdmin, same pattern as rest of ERP)
alter table project_tasks       enable row level security;
alter table project_labels      enable row level security;
alter table task_labels         enable row level security;
alter table task_dependencies   enable row level security;
alter table task_comments       enable row level security;

-- ── Seed: a handful of demonstrative tasks on the existing
--         PRJ-2026-001 (Zinc Dross Recovery) project + starter labels.
insert into project_labels (project_id, name, color)
select p.id, v.name, v.color
from projects p,
(values
  ('AutoREX',   '#f59e0b'),
  ('Civil',     '#10b981'),
  ('Electrical','#3b82f6'),
  ('Lab',       '#a855f7'),
  ('Blocker',   '#ef4444'),
  ('Client',    '#ec4899')
) as v(name, color)
where p.project_code = 'PRJ-2026-001'
on conflict (project_id, name) do nothing;

insert into project_tasks (project_id, title, description, status, priority, due_date, order_index, created_by, milestone_id)
select
  p.id,
  v.title,
  v.description,
  v.status,
  v.priority,
  v.due_date::date,
  v.order_index,
  'Sivakumar Shanmugam',
  (select id from project_milestones m where m.project_id = p.id and m.milestone_no = v.ms order by 1 limit 1)
from projects p,
(values
  ('Validate AutoREX PLC tag mapping',     'Map incoming OPC-UA tags to digital twin variables and confirm units.',                       'in_progress', 'high',   '2026-04-28', 0, 4),
  ('Rectifier commissioning checklist',    'Draft checklist covering ramp-up, interlock tests, and protective trip verifications.',        'todo',        'normal', '2026-04-30', 1, 4),
  ('LabREX assay method validation',       'Validate Zn / Pb / Cu methods against cross-lab standards before switchover.',                 'todo',        'high',   '2026-05-02', 2, 4),
  ('Commissioning dry-run — water only',   'Two-hour water run with full instrumentation capture before first electrolyte fill.',          'backlog',    'normal', '2026-05-10', 0, 5),
  ('Electrolyte first-fill protocol',      'Document acid concentration targets, fill rate, and safety interlocks for first fill.',        'backlog',    'normal', '2026-05-15', 1, 5),
  ('Hand-over documentation pack',         'Compile operating manual, spares list, training materials, and permit records.',               'backlog',    'normal', '2026-05-25', 2, 5),
  ('Rectifier alarm tuning',               'Tune current / voltage alarm thresholds from first 48h of data.',                              'backlog',    'low',    null,          3, 4),
  ('First harvest plan — Day 7',           'Pre-approve stripping schedule, weighbridge protocol, and assay sampling for Day 7.',          'backlog',    'normal', null,          4, 5)
) as v(title, description, status, priority, due_date, order_index, ms)
where p.project_code = 'PRJ-2026-001'
  and not exists (select 1 from project_tasks t where t.project_id = p.id and t.title = v.title);

-- Seed one inter-task dependency so the feature is visible in the UI.
insert into task_dependencies (blocker_task_id, blocked_task_id)
select a.id, b.id
from projects p
join project_tasks a on a.project_id = p.id and a.title = 'Commissioning dry-run — water only'
join project_tasks b on b.project_id = p.id and b.title = 'Electrolyte first-fill protocol'
where p.project_code = 'PRJ-2026-001'
on conflict do nothing;
