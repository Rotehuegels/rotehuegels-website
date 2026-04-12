-- ============================================================
-- Leave Management Module
-- ============================================================

-- Leave types configuration
CREATE TABLE IF NOT EXISTS leave_types (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,           -- Casual Leave, Sick Leave, Earned Leave, etc.
  short_code   TEXT NOT NULL UNIQUE,           -- CL, SL, EL, LOP
  annual_quota INT NOT NULL DEFAULT 0,         -- days per year (0 = unlimited/LOP)
  carry_forward BOOLEAN DEFAULT false,
  is_paid      BOOLEAN DEFAULT true,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Leave balances per employee per FY
CREATE TABLE IF NOT EXISTS leave_balances (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  fy           TEXT NOT NULL,                  -- '2025-26'
  opening      NUMERIC(5,1) DEFAULT 0,        -- brought forward
  credited     NUMERIC(5,1) DEFAULT 0,        -- annual quota credited
  used         NUMERIC(5,1) DEFAULT 0,        -- leaves taken
  balance      NUMERIC(5,1) DEFAULT 0,        -- opening + credited - used
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, leave_type_id, fy)
);

-- Leave applications
CREATE TABLE IF NOT EXISTS leave_applications (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id   UUID NOT NULL REFERENCES leave_types(id),
  from_date       DATE NOT NULL,
  to_date         DATE NOT NULL,
  days            NUMERIC(5,1) NOT NULL,        -- can be 0.5 for half-day
  reason          TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by     TEXT,
  approved_at     TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_leave_balances_employee ON leave_balances(employee_id);
CREATE INDEX idx_leave_balances_fy ON leave_balances(fy);
CREATE INDEX idx_leave_applications_employee ON leave_applications(employee_id);
CREATE INDEX idx_leave_applications_status ON leave_applications(status);
CREATE INDEX idx_leave_applications_dates ON leave_applications(from_date, to_date);

-- Triggers
CREATE TRIGGER leave_balances_updated_at
  BEFORE UPDATE ON leave_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER leave_applications_updated_at
  BEFORE UPDATE ON leave_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Seed leave types (Indian standard) ──────────────────────────
INSERT INTO leave_types (name, short_code, annual_quota, carry_forward, is_paid) VALUES
  ('Casual Leave',      'CL',  12, false, true),
  ('Sick Leave',        'SL',  12, false, true),
  ('Earned Leave',      'EL',  15, true,  true),
  ('Loss of Pay',       'LOP',  0, false, false),
  ('Comp Off',          'CO',   0, false, true),
  ('Maternity Leave',   'ML',   0, false, true),
  ('Paternity Leave',   'PL',   0, false, true)
ON CONFLICT (short_code) DO NOTHING;

-- ── Seed balances for active employees for FY 2025-26 ───────────
INSERT INTO leave_balances (employee_id, leave_type_id, fy, opening, credited, used, balance)
SELECT e.id, lt.id, '2025-26', 0, lt.annual_quota, 0, lt.annual_quota
FROM employees e
CROSS JOIN leave_types lt
WHERE e.status = 'active'
  AND lt.annual_quota > 0
  AND lt.is_active = true
ON CONFLICT (employee_id, leave_type_id, fy) DO NOTHING;
