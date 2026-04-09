-- ── Payroll Module ───────────────────────────────────────────────────────────

-- Salary structure per employee (persisted; used to seed new payroll runs)
create table if not exists payroll_salary_structures (
  id                 uuid        primary key default gen_random_uuid(),
  employee_id        uuid        references employees(id) on delete cascade unique,
  basic              numeric(10,2) not null default 0,
  hra                numeric(10,2) not null default 0,
  special_allowance  numeric(10,2) not null default 0,
  other_allowance    numeric(10,2) not null default 0,
  epf_enabled        boolean     not null default false,
  esi_enabled        boolean     not null default false,
  pt_enabled         boolean     not null default true,
  updated_at         timestamptz default now()
);

-- Monthly payroll run (one per month/year)
create table if not exists payroll_runs (
  id                   uuid    primary key default gen_random_uuid(),
  month                int     not null check (month between 1 and 12),
  year                 int     not null check (year >= 2024),
  status               text    not null default 'draft',  -- draft | processed | paid
  total_gross          numeric(14,2) not null default 0,
  total_deductions     numeric(14,2) not null default 0,
  total_net            numeric(14,2) not null default 0,
  total_employer_cost  numeric(14,2) not null default 0,  -- gross + employer PF + employer ESI
  notes                text,
  created_at           timestamptz default now(),
  processed_at         timestamptz,
  unique(month, year)
);

-- Per-employee payslip entry within a run
create table if not exists payroll_entries (
  id                  uuid    primary key default gen_random_uuid(),
  run_id              uuid    references payroll_runs(id) on delete cascade,
  employee_id         uuid    references employees(id),

  -- Earnings (seeded from salary structure, editable before processing)
  basic               numeric(10,2) not null default 0,
  hra                 numeric(10,2) not null default 0,
  special_allowance   numeric(10,2) not null default 0,
  other_allowance     numeric(10,2) not null default 0,
  bonus               numeric(10,2) not null default 0,

  -- Attendance
  working_days        int     not null default 26,
  days_present        int     not null default 26,
  lop_days            numeric(5,2) not null default 0,

  -- Computed (stored at processing time)
  gross_pay           numeric(10,2) not null default 0,
  lop_deduction       numeric(10,2) not null default 0,
  epf_employee        numeric(10,2) not null default 0,
  epf_employer        numeric(10,2) not null default 0,
  esi_employee        numeric(10,2) not null default 0,
  esi_employer        numeric(10,2) not null default 0,
  professional_tax    numeric(10,2) not null default 0,
  tds                 numeric(10,2) not null default 0,
  advance_recovery    numeric(10,2) not null default 0,
  other_deductions    numeric(10,2) not null default 0,
  total_deductions    numeric(10,2) not null default 0,
  net_pay             numeric(10,2) not null default 0,

  payment_status      text    not null default 'pending',  -- pending | paid
  created_at          timestamptz default now(),

  unique(run_id, employee_id)
);
