-- ── REX Members + Engagement Model ───────────────────────────────────────────
-- rex_members: one row per person (permanent identity, keyed by REX ID)
-- employees:   one row per engagement (ENG-YY-NNN), links to rex_members

-- 1. Create rex_members table
CREATE TABLE IF NOT EXISTS rex_members (
  rex_id                   text PRIMARY KEY,
  full_name                text NOT NULL,
  date_of_birth            date,
  phone                    text,
  email                    text,
  address                  text,
  national_id              text,
  bank_name                text,
  bank_account             text,
  bank_ifsc                text,
  emergency_contact_name   text,
  emergency_contact_phone  text,
  created_at               timestamptz DEFAULT now()
);

-- 2. Migrate existing employee personal data into rex_members
INSERT INTO rex_members (
  rex_id, full_name, phone, email, address, national_id,
  bank_name, bank_account, bank_ifsc,
  emergency_contact_name, emergency_contact_phone
)
SELECT DISTINCT ON (rex_id)
  rex_id, full_name, phone, email, address, national_id,
  bank_name, bank_account, bank_ifsc,
  emergency_contact_name, emergency_contact_phone
FROM employees
WHERE rex_id IS NOT NULL
ON CONFLICT (rex_id) DO NOTHING;

-- 3. Add engagement_id column to employees
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS engagement_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS end_date date;

-- 4. Backfill engagement_id for existing rows using join_date year
UPDATE employees
SET engagement_id = 'ENG-' || lpad(
  (EXTRACT(YEAR FROM COALESCE(join_date, created_at, now())) % 100)::int::text, 2, '0'
) || '-' || lpad(row_number::text, 3, '0')
FROM (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY EXTRACT(YEAR FROM COALESCE(join_date, created_at, now()))
    ORDER BY COALESCE(join_date, created_at, now())
  ) AS row_number
  FROM employees
  WHERE engagement_id IS NULL
) rn
WHERE employees.id = rn.id;

-- 5. Drop unique constraint on rex_id (one person can have multiple engagements)
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_rex_id_key;

-- 6. Add FK to rex_members
ALTER TABLE employees
  ADD CONSTRAINT fk_employees_rex_member
  FOREIGN KEY (rex_id) REFERENCES rex_members(rex_id)
  ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- 7. Drop personal detail columns from employees (now live in rex_members)
ALTER TABLE employees
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS national_id,
  DROP COLUMN IF EXISTS bank_name,
  DROP COLUMN IF EXISTS bank_account,
  DROP COLUMN IF EXISTS bank_ifsc,
  DROP COLUMN IF EXISTS emergency_contact_name,
  DROP COLUMN IF EXISTS emergency_contact_phone,
  DROP COLUMN IF EXISTS employee_code;  -- replaced by engagement_id
