-- Record the rename of ewaste_* → recycling/* tables that was applied via
-- Supabase Studio on 16 Apr 2026 but never captured in a migration file.
-- Conditional so it is a no-op in environments where the rename already
-- happened, and applies the rename in fresh environments.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'ewaste_recyclers')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables
                     WHERE table_schema = 'public' AND table_name = 'recyclers') THEN
    EXECUTE 'ALTER TABLE public.ewaste_recyclers RENAME TO recyclers';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'ewaste_categories')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables
                     WHERE table_schema = 'public' AND table_name = 'recycling_categories') THEN
    EXECUTE 'ALTER TABLE public.ewaste_categories RENAME TO recycling_categories';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'ewaste_collection_requests')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables
                     WHERE table_schema = 'public' AND table_name = 'collection_requests') THEN
    EXECUTE 'ALTER TABLE public.ewaste_collection_requests RENAME TO collection_requests';
  END IF;
END $$;
