-- ── ATS (Applicant Tracking System) — capture migration ─────────────────────
-- These three tables (job_postings, applications, interview_rounds) were
-- created live via the SQL editor when the ATS module was wired up, but
-- never committed as a migration. The application code in
-- app/api/ats/jobs/**, app/api/ats/apply/**, and
-- app/api/ats/applications/[id]/interviews/** has been writing to them all
-- along.
--
-- This migration formalises the schema so:
--   • re-running on production is a complete no-op (everything uses IF NOT EXISTS),
--   • a fresh staging / dev DB built from supabase/migrations/ ends up with
--     the schema the application code requires.
--
-- Schema captured 2026-04-26 from the live Supabase instance.

-- 1. job_postings
CREATE TABLE IF NOT EXISTS job_postings (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text        NOT NULL,
  department      text,
  location        text        DEFAULT 'Chennai, India',
  employment_type text        NOT NULL CHECK (employment_type IN ('full_time','part_time','consultant','contract')),
  description     text        NOT NULL,
  requirements    text,
  status          text        DEFAULT 'draft' CHECK (status IN ('draft','published','closed')),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 2. applications (candidates applying to job_postings)
CREATE TABLE IF NOT EXISTS applications (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            uuid        REFERENCES job_postings(id) ON DELETE CASCADE,
  job_title         text        NOT NULL,
  full_name         text        NOT NULL,
  email             text        NOT NULL,
  phone             text,
  linkedin_url      text,
  cv_url            text,
  cover_letter      text,
  rex_id            text,
  stage             text        DEFAULT 'applied' CHECK (stage IN ('applied','shortlisted','interview','offer','hired','rejected')),
  notes             text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  current_company   text,
  "current_role"    text,                -- quoted: current_role is a reserved word
  experience_years  integer,
  expected_ctc      text,
  current_ctc       text,
  notice_period     text,
  source            text        DEFAULT 'website',
  rating            integer,
  rejection_reason  text
);

CREATE INDEX IF NOT EXISTS idx_applications_stage ON applications (stage);

-- 3. interview_rounds (interview history per application)
CREATE TABLE IF NOT EXISTS interview_rounds (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid        NOT NULL REFERENCES applications(id),
  round_number    integer     NOT NULL,
  round_type      text        NOT NULL,
  scheduled_at    timestamptz,
  interviewer     text,
  status          text        DEFAULT 'scheduled',
  feedback        text,
  rating          integer,
  decision        text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interviews_app ON interview_rounds (application_id);
