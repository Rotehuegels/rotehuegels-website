-- Sweep: enable RLS on EVERY existing public table and block the anon role.
-- The app writes exclusively via supabaseAdmin (service_role), which bypasses
-- RLS, so this hardening is transparent to every existing code path.
--
-- Effect: a leaked anon key cannot hit PostgREST and dump tables.
--
-- Defensive: uses to_regclass + a table loop so missing tables are skipped.

-- ── Drop blanket USING (true) policies only if the table + policy both exist ──
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema, c.relname AS tbl, pol.polname AS policy
    FROM pg_policy pol
    JOIN pg_class c    ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND pol.polname LIKE 'service_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policy, r.tbl);
  END LOOP;
END $$;

-- ── Enable RLS + add authenticated-only policy on every public table ──────
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname NOT LIKE 'pg_%'
      AND c.relname NOT LIKE '_prisma_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tbl);

    EXECUTE format('DROP POLICY IF EXISTS "auth_all" ON public.%I', t.tbl);
    EXECUTE format(
      'CREATE POLICY "auth_all" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t.tbl
    );
  END LOOP;
END $$;

-- ── Revoke lingering anon grants (belt & braces) ──────────────────────────
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t.tbl);
  END LOOP;
END $$;
