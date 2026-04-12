-- ============================================================
-- LabREX — Laboratory Information Management System
-- ============================================================

-- Master list of lab test parameters
CREATE TABLE IF NOT EXISTS lab_parameters (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  unit          TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN ('purity', 'composition', 'water', 'other')),
  sample_type   TEXT NOT NULL CHECK (sample_type IN ('zinc', 'electrolyte', 'dross', 'water')),
  default_min   NUMERIC(12,4),
  default_max   NUMERIC(12,4),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Lab samples collected from the plant
CREATE TABLE IF NOT EXISTS lab_samples (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id   UUID NOT NULL REFERENCES operations_contracts(id) ON DELETE CASCADE,
  sample_code   TEXT NOT NULL,                    -- ZN-240412-001
  sample_type   TEXT NOT NULL CHECK (sample_type IN ('zinc', 'electrolyte', 'dross', 'water')),
  collected_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  collected_by  TEXT,
  status        TEXT NOT NULL DEFAULT 'collected'
                  CHECK (status IN ('collected', 'in_testing', 'completed', 'rejected')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Test results for each sample
CREATE TABLE IF NOT EXISTS lab_results (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sample_id       UUID NOT NULL REFERENCES lab_samples(id) ON DELETE CASCADE,
  parameter_id    UUID NOT NULL REFERENCES lab_parameters(id),
  value           NUMERIC(12,4) NOT NULL,
  unit            TEXT NOT NULL,
  min_spec        NUMERIC(12,4),
  max_spec        NUMERIC(12,4),
  is_within_spec  BOOLEAN DEFAULT true,
  tested_at       TIMESTAMPTZ DEFAULT NOW(),
  tested_by       TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lab_samples_contract ON lab_samples(contract_id);
CREATE INDEX idx_lab_samples_type ON lab_samples(sample_type);
CREATE INDEX idx_lab_samples_date ON lab_samples(collected_at DESC);
CREATE INDEX idx_lab_results_sample ON lab_results(sample_id);

-- Triggers
CREATE TRIGGER lab_samples_updated_at
  BEFORE UPDATE ON lab_samples FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Seed: Lab Parameters for Zinc Dross Recovery ────────────

INSERT INTO lab_parameters (name, unit, category, sample_type, default_min, default_max) VALUES
  -- Zinc purity analysis
  ('Zinc purity',        '%',    'purity',      'zinc',        99.0,  99.99),
  ('Lead content',       'ppm',  'purity',      'zinc',        NULL,  50),
  ('Iron content',       'ppm',  'purity',      'zinc',        NULL,  30),
  ('Cadmium content',    'ppm',  'purity',      'zinc',        NULL,  20),
  ('Aluminium content',  'ppm',  'purity',      'zinc',        NULL,  10),

  -- Electrolyte composition
  ('Zinc concentration',   'g/L',  'composition', 'electrolyte', 40,    80),
  ('Sulphuric acid',       'g/L',  'composition', 'electrolyte', 150,   200),
  ('Temperature',          '°C',   'composition', 'electrolyte', 30,    45),
  ('Iron in electrolyte',  'mg/L', 'composition', 'electrolyte', NULL,  20),
  ('Current density',      'A/m²', 'composition', 'electrolyte', 300,   500),

  -- Dross composition (input material)
  ('Zinc in dross',      '%',    'composition', 'dross',       40,    NULL),
  ('Lead in dross',      '%',    'composition', 'dross',       NULL,  5),
  ('Iron in dross',      '%',    'composition', 'dross',       NULL,  3),
  ('Aluminium in dross', '%',    'composition', 'dross',       NULL,  10),
  ('Moisture content',   '%',    'composition', 'dross',       NULL,  5),

  -- Water quality (effluent/process)
  ('pH',                 '',     'water',       'water',       6.5,   8.5),
  ('TDS',                'mg/L', 'water',       'water',       NULL,  2000),
  ('Zinc in effluent',   'mg/L', 'water',       'water',       NULL,  5),
  ('Lead in effluent',   'mg/L', 'water',       'water',       NULL,  0.1),
  ('COD',                'mg/L', 'water',       'water',       NULL,  250);
