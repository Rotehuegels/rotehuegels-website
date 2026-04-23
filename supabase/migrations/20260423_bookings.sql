-- Bookings — lightweight demo/call scheduling for the Rotehügels public site.
-- Keep the model narrow: one host (handled externally via event_type.host_email),
-- per-event-type weekly availability stored as JSONB, bookings are time ranges
-- in UTC with a cancel_token the visitor can use to cancel.

create extension if not exists "pgcrypto";
-- btree_gist lets the exclusion constraint below use a uuid equality
-- operator alongside the tstzrange overlap operator in one index.
create extension if not exists "btree_gist";

-- ── Event types ──────────────────────────────────────────────────────────
create table if not exists booking_event_types (
  id                 uuid primary key default gen_random_uuid(),
  slug               text unique not null,
  name               text not null,
  description        text,
  duration_minutes   integer not null check (duration_minutes > 0 and duration_minutes <= 240),
  buffer_before_minutes integer not null default 0,
  buffer_after_minutes  integer not null default 0,
  -- Weekly availability in the event type's timezone.
  -- Shape: { "mon": [{"start": "10:00", "end": "18:00"}], "tue": [...], ..., "sun": [] }
  weekly_availability jsonb not null default '{}'::jsonb,
  timezone           text not null default 'Asia/Kolkata',
  -- How far ahead a visitor can book.
  min_notice_hours   integer not null default 24,
  max_days_ahead     integer not null default 14,
  -- Host contact for notification emails.
  host_name          text not null,
  host_email         text not null,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists booking_event_types_slug_active
  on booking_event_types (slug) where is_active;

-- ── Bookings ─────────────────────────────────────────────────────────────
create table if not exists bookings (
  id                 uuid primary key default gen_random_uuid(),
  event_type_id      uuid not null references booking_event_types(id) on delete restrict,
  visitor_name       text not null,
  visitor_email      text not null,
  visitor_company    text,
  visitor_phone      text,
  visitor_topic      text,
  visitor_timezone   text,
  -- Absolute UTC time range of the booking (independent of event_type timezone).
  starts_at          timestamptz not null,
  ends_at            timestamptz not null,
  status             text not null default 'confirmed'
                       check (status in ('confirmed', 'cancelled', 'completed', 'no_show')),
  -- Self-service cancel link carries this token.
  cancel_token       uuid not null unique default gen_random_uuid(),
  cancelled_at       timestamptz,
  cancelled_by       text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists bookings_event_type_starts
  on bookings (event_type_id, starts_at) where status = 'confirmed';

create index if not exists bookings_starts_at
  on bookings (starts_at);

-- A single booking cannot collide with another confirmed booking for the same
-- event type. Prefer application-level validation, but keep this as a belt-and-
-- braces exclusion constraint so two racing requests cannot both win the slot.
alter table bookings drop constraint if exists bookings_no_overlap;
alter table bookings add constraint bookings_no_overlap
  exclude using gist (
    event_type_id with =,
    tstzrange(starts_at, ends_at) with &&
  )
  where (status = 'confirmed');

-- ── Row-level security ──────────────────────────────────────────────────
-- Server-side writes via supabaseAdmin (service role). Booking rows are not
-- exposed to anon or authed users directly — the public flow only interacts
-- through the /book/* server action, and the dashboard pulls via supabaseAdmin.
alter table booking_event_types enable row level security;
alter table bookings            enable row level security;

-- ── Seed three event types ──────────────────────────────────────────────
insert into booking_event_types (
  slug, name, description, duration_minutes,
  buffer_before_minutes, buffer_after_minutes,
  weekly_availability, timezone, min_notice_hours, max_days_ahead,
  host_name, host_email
) values
  (
    'engineering-consultation',
    'Engineering consultation',
    '45-minute call to scope a plant EPC, custom electrode, testwork, operations-advisory, or severe-service-valve engagement. Bring your drawings, electrolyte chemistry, or operating-parameter data — we will return a first-pass review and indicative engagement plan within a week.',
    45, 15, 15,
    '{
      "mon": [{"start": "10:00", "end": "18:00"}],
      "tue": [{"start": "10:00", "end": "18:00"}],
      "wed": [{"start": "10:00", "end": "18:00"}],
      "thu": [{"start": "10:00", "end": "18:00"}],
      "fri": [{"start": "10:00", "end": "18:00"}],
      "sat": [],
      "sun": []
    }'::jsonb,
    'Asia/Kolkata', 24, 14,
    'Sivakumar Shanmugam', 'sivakumar@rotehuegels.com'
  ),
  (
    'autorex-suite-demo',
    'AutoREX Suite demo',
    '30-minute live demo of AutoREX (process automation + digital twin), Operon (industrial ERP), and LabREX (LIMS) — focused on your plant''s control stack and ERP footprint.',
    30, 15, 15,
    '{
      "mon": [{"start": "10:00", "end": "18:00"}],
      "tue": [{"start": "10:00", "end": "18:00"}],
      "wed": [{"start": "10:00", "end": "18:00"}],
      "thu": [{"start": "10:00", "end": "18:00"}],
      "fri": [{"start": "10:00", "end": "18:00"}],
      "sat": [],
      "sun": []
    }'::jsonb,
    'Asia/Kolkata', 24, 14,
    'Sivakumar Shanmugam', 'sivakumar@rotehuegels.com'
  ),
  (
    'circular-platform-intro',
    'Rotehügels Circular — platform intro',
    '30-minute walk-through of the India Circular Economy Directory, upcoming marketplace, and EPR / traceability services — for generators, brand owners, or recyclers evaluating participation.',
    30, 15, 15,
    '{
      "mon": [{"start": "10:00", "end": "18:00"}],
      "tue": [{"start": "10:00", "end": "18:00"}],
      "wed": [{"start": "10:00", "end": "18:00"}],
      "thu": [{"start": "10:00", "end": "18:00"}],
      "fri": [{"start": "10:00", "end": "18:00"}],
      "sat": [],
      "sun": []
    }'::jsonb,
    'Asia/Kolkata', 24, 14,
    'Sivakumar Shanmugam', 'sivakumar@rotehuegels.com'
  )
on conflict (slug) do nothing;
