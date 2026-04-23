-- Flip the default role for newly-signed-up users from 'admin' to 'staff'.
-- Existing user_profiles rows are NOT modified — this only affects the
-- trigger that runs when Supabase Auth creates a new auth.users row.
--
-- With role='staff' and zero user_permissions, a new signup gets access
-- to /dashboard (layout allows staff) but every module layout guard
-- redirects them to /d/forbidden until an admin grants explicit rights
-- from /d/admin/users.

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into user_profiles (id, role)
  values (new.id, 'staff')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;
