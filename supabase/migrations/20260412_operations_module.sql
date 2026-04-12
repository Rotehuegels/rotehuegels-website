-- ============================================================
-- Operations Module — Plant Operations Contracts & Production
-- ============================================================

-- Operations contract links a project to plant operations mode
CREATE TABLE IF NOT EXISTS operations_contracts (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contract_code     TEXT UNIQUE NOT NULL,            -- OPS-2026-001
  investment_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  contract_start    DATE,
  contract_end      DATE,
  status            TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('draft', 'active', 'paused', 'completed', 'terminated')),
  product_type      TEXT DEFAULT 'zinc',             -- zinc, copper, etc.
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Daily production log entries
CREATE TABLE IF NOT EXISTS production_logs (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id         UUID NOT NULL REFERENCES operations_contracts(id) ON DELETE CASCADE,
  log_date            DATE NOT NULL,
  dross_input_kg      NUMERIC(10,2) DEFAULT 0,
  zinc_recovered_kg   NUMERIC(10,2) DEFAULT 0,
  recovery_rate       NUMERIC(5,2) DEFAULT 0,        -- auto-calculated %
  power_kwh           NUMERIC(10,2) DEFAULT 0,
  power_per_kg        NUMERIC(8,2) DEFAULT 0,         -- auto-calculated kWh/kg
  zinc_price_per_kg   NUMERIC(10,2) DEFAULT 0,        -- market/agreed price
  revenue             NUMERIC(14,2) DEFAULT 0,        -- zinc_recovered × price
  shift               TEXT DEFAULT 'day',              -- day, night, full
  operator            TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_id, log_date, shift)
);

-- Indexes
CREATE INDEX idx_ops_contracts_project ON operations_contracts(project_id);
CREATE INDEX idx_production_logs_contract ON production_logs(contract_id);
CREATE INDEX idx_production_logs_date ON production_logs(log_date DESC);

-- Triggers
CREATE TRIGGER ops_contracts_updated_at
  BEFORE UPDATE ON operations_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER production_logs_updated_at
  BEFORE UPDATE ON production_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Seed: Zinc Dross Operations Contract for India Zinc ─────
INSERT INTO operations_contracts (
  project_id, contract_code, investment_amount, contract_start, status, product_type, notes
) SELECT
  id, 'OPS-2026-001', 5000000, '2026-05-01', 'draft', 'zinc',
  'Zinc dross recovery plant operations contract. AutoREX implementation on hold per client request.'
FROM projects WHERE project_code = 'PRJ-2026-001';
