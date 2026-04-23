-- User management + granular rights (Phase 1)
-- Extends the existing user_profiles model so users come in three shapes:
--   - admin  → master-login, bypasses every permission check (existing)
--   - staff  → NEW. Access governed by the user_permissions table.
--   - client → scoped to their customer_id via user_profiles.customer_id (existing)
-- Adds a user_permissions table keyed by (user_id, permission_key).

-- ── Extend role constraint to include 'staff' ─────────────────────────
alter table user_profiles drop constraint if exists user_profiles_role_check;
alter table user_profiles add constraint user_profiles_role_check
  check (role in ('admin', 'staff', 'client'));

-- Optional field for display + admin notes on who this user is meant for.
alter table user_profiles add column if not exists notes text;
alter table user_profiles add column if not exists is_active boolean not null default true;

-- ── user_permissions ──────────────────────────────────────────────────
create table if not exists user_permissions (
  user_id        uuid not null references auth.users(id) on delete cascade,
  permission_key text not null,
  granted_at     timestamptz not null default now(),
  granted_by     text,
  primary key (user_id, permission_key)
);
create index if not exists idx_user_permissions_key on user_permissions(permission_key);

alter table user_permissions enable row level security;

-- ── Handy helper view for the admin UI ────────────────────────────────
-- Surfaces auth.users + user_profiles + a permission count per user.
create or replace view user_management_view as
select
  u.id,
  u.email,
  u.created_at             as auth_created_at,
  u.last_sign_in_at,
  p.role,
  p.display_name,
  p.phone,
  p.notes,
  coalesce(p.is_active, true) as is_active,
  p.customer_id,
  c.name                    as customer_name,
  (select count(*) from user_permissions up where up.user_id = u.id) as permission_count
from auth.users u
left join user_profiles p on p.id = u.id
left join customers c     on c.id = p.customer_id;
