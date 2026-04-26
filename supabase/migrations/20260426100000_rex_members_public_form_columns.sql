-- ── REX Members: backfill columns the public registration form writes ───────
-- Four of these (title, member_type, linkedin_url, interests) were added
-- live via the SQL editor when the public REX form launched, but never
-- captured as a migration. The fifth (cv_url) was assumed to exist in code
-- (route since 2026-03-29) but was never created on any environment, so
-- /api/rex/register has been returning 500s for every submission.
--
-- This migration formalises all five so any environment built from scratch
-- has the schema the application code requires. IF NOT EXISTS makes it safe
-- to re-apply on production where four of the columns already exist.

ALTER TABLE rex_members
  ADD COLUMN IF NOT EXISTS title         text,
  ADD COLUMN IF NOT EXISTS member_type   text CHECK (member_type IN ('student','professional','academic','enthusiast')),
  ADD COLUMN IF NOT EXISTS linkedin_url  text,
  ADD COLUMN IF NOT EXISTS cv_url        text,
  ADD COLUMN IF NOT EXISTS interests     text;
