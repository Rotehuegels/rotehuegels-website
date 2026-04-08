-- ── Finance: loans, credit cards, property ──────────────────────────────────

create table if not exists finance_loans (
  id            text        primary key,
  lender        text        not null,
  loan_type     text        not null,  -- 'home_loan' | 'personal_loan' | 'gold_loan'
  loan_code     text        not null,
  emi_amount    numeric(10,2),
  due_day       int,                   -- day of month EMI/payment is due
  outstanding   numeric(14,2) not null,
  interest_rate numeric(5,2),
  interest_paid numeric(14,2),         -- cumulative interest paid to date
  notes         text,
  as_of_date    date        not null
);

create table if not exists finance_credit_cards (
  id             text        primary key,
  bank           text        not null,
  card_code      text        not null,
  max_limit      numeric(12,2) not null,
  outstanding    numeric(12,2) not null default 0,
  statement_day  int,
  due_day        int,
  as_of_date     date        not null
);

create table if not exists finance_property (
  id                    uuid        primary key default gen_random_uuid(),
  name                  text        not null,
  location              text        not null,
  unit                  text,
  status                text        not null default 'under_construction',
  possession_date       date,
  total_paid_builder    numeric(14,2),
  paid_via_loan         numeric(14,2),
  paid_own              numeric(14,2),
  stamp_duty            numeric(12,2),
  registration          numeric(12,2),
  interest_paid         numeric(14,2),
  balance_to_builder    numeric(14,2),
  loan_sanctioned       numeric(14,2),
  loan_principal_paid   numeric(14,2),
  flat_cost_all_in      numeric(14,2),
  current_market_value  numeric(14,2)
);

create table if not exists finance_property_payments (
  id          uuid    primary key default gen_random_uuid(),
  property_id uuid    references finance_property(id) on delete cascade,
  sno         int,
  invoice_date date   not null,
  amount      numeric(12,2) not null,
  description text,
  is_gst      boolean not null default false
);

-- ── Seed: Loans (as of Mar-26) ───────────────────────────────────────────────
insert into finance_loans values
  ('hl-hdfc-1',    'HDFC',  'home_loan',     'HL1',    34896, 5,   4999850.00, null,       995946.00, 'Home loan — Kharghar flat',          '2026-03-31'),
  ('pl-sbi-9394',  'SBI',   'personal_loan', 'PL9394', 20434, 3,   485012.88,  null,       null,      null,                                  '2026-03-31'),
  ('pl-sbi-0003',  'SBI',   'personal_loan', 'PL0003', 13342, 3,   480462.00,  null,       null,      null,                                  '2026-03-31'),
  ('pl-cred-1',    'CRED',  'personal_loan', 'PLCRED', 13345, 3,   586142.70,  null,       null,      null,                                  '2026-03-31'),
  ('pl-cred-2',    'CRED',  'personal_loan', 'PLCRED',  4384, 3,   159565.29,  null,       null,      null,                                  '2026-03-31'),
  ('gl-repco-1',   'REPCO', 'gold_loan',     'JL84929',    0, null, 1089000.00, 10.25,     null,      'Joint A/c 84929 — due Feb 2027',      '2026-03-31'),
  ('gl-repco-2',   'REPCO', 'gold_loan',     'JL84930',    0, null, 1381000.00, 10.25,     null,      'Joint A/c 84930 — due Feb 2027',      '2026-03-31');

-- ── Seed: Credit Cards (as of Mar-26) ────────────────────────────────────────
insert into finance_credit_cards values
  ('cc-hdfc-1313', 'HDFC',   'CC1313',  64000,      -0.19, 23, 14, '2026-03-31'),
  ('cc-hdfc-9222', 'HDFC',   'CC9222',  64000,       0.00, 23, 14, '2026-03-31'),
  ('cc-icici-8010','ICICI',  'CC8010',  500000,   96416.00,  2, 20, '2026-03-31'),
  ('cc-icici-1006','ICICI',  'CC1006',  500000,   98925.00,  2, 20, '2026-03-31'),
  ('cc-axis-9063', 'AXIS',   'CC9063',  62000,       0.00,  1, 21, '2026-03-31'),
  ('cc-axis-1522', 'AXIS',   'CC1522',  62000,       0.00,  1, 21, '2026-03-31'),
  ('cc-amazon-6',  'AMAZON', 'CC6',         0,       0.00,  null,  5, '2026-03-31');

-- ── Seed: Property ───────────────────────────────────────────────────────────
insert into finance_property
  (name, location, unit, status, possession_date,
   total_paid_builder, paid_via_loan, paid_own,
   stamp_duty, registration, interest_paid,
   balance_to_builder, loan_sanctioned, loan_principal_paid,
   flat_cost_all_in, current_market_value)
values (
  'Satyam Trinity Towers',
  'Kharghar Sector 36, Navi Mumbai',
  'A-1206',
  'under_construction',
  '2026-12-31',
  5600891,   -- total paid to builder
  5140844,   -- via HDFC loan
  460047,    -- own funds
  429375,    -- stamp duty @7%
  30000,     -- registration
  995946,    -- HDFC interest paid to date
  686385,    -- balance still to be paid via loan
  5827229,   -- HDFC loan sanctioned
  140994,    -- principal paid back via EMI
  7742597,   -- all-in cost (paid + stamp + registration + interest)
  7900000    -- current market value (Mar-26)
);

-- Payment milestones (subquery instead of \gset — works in Supabase SQL editor)
insert into finance_property_payments (property_id, sno, invoice_date, amount, description, is_gst)
select p.id, v.sno, v.invoice_date::date, v.amount, v.description, v.is_gst
from finance_property p,
(values
  ( 1, '2022-08-27', 108000.00, 'Initial Booking',  false),
  ( 2, '2022-08-24',  15335.00, 'Booking charges',  false),
  ( 3, '2022-09-17', 198700.00, 'Instalment',        false),
  ( 4, '2022-10-21',1533479.00, 'Flat Instalment',   false),
  ( 5, '2022-10-21',  76674.00, 'GST',               true),
  ( 6, '2023-01-19', 920089.00, 'Flat Instalment',   false),
  ( 7, '2023-01-19',  46004.00, 'GST',               true),
  ( 8, '2023-06-13', 245357.00, 'Flat Instalment',   false),
  ( 9, '2023-06-13',  12268.00, 'GST',               true),
  (10, '2023-07-27', 122679.00, 'Flat Instalment',   false),
  (11, '2023-07-27',   6134.00, 'GST',               true),
  (12, '2023-09-14', 122678.00, 'Flat Instalment',   false),
  (13, '2023-09-14',   6134.00, 'GST',               true),
  (14, '2023-11-15', 245358.00, 'Flat Instalment',   false),
  (15, '2023-11-16',  12268.00, 'GST',               true),
  (16, '2023-12-27', 122678.00, 'Flat Instalment',   false),
  (17, '2023-12-27',   6134.00, 'GST',               true),
  (18, '2024-02-15', 245357.00, 'Flat Instalment',   false),
  (19, '2024-02-15',  12268.00, 'GST',               true),
  (20, '2024-03-07', 368036.00, 'Flat Instalment',   false),
  (21, '2024-03-07',  18402.00, 'GST',               true),
  (22, '2024-04-26', 248425.00, 'Flat Instalment',   false),
  (23, '2024-04-26', 119611.00, 'Flat Instalment',   false),
  (24, '2024-04-26',  18401.00, 'GST',               true),
  (25, '2024-06-07', 245357.00, 'Flat Instalment',   false),
  (26, '2024-06-07',  12268.00, 'GST',               true),
  (27, '2024-07-18', 184018.00, 'Flat Instalment',   false),
  (28, '2024-07-18',  12268.00, 'GST',               true),
  (29, '2024-09-12', 181564.00, 'Flat Instalment',   false),
  (30, '2024-09-12',   6134.00, 'GST',               true),
  (31, '2025-12-19', 122679.00, 'Flat Instalment',   false),
  (32, '2025-12-19',   6134.00, 'GST',               true)
) as v(sno, invoice_date, amount, description, is_gst)
where p.unit = 'A-1206';
