-- Company / group structure
-- Each recycler row is a FACILITY. Facilities belong to a company (the
-- legal entity). Companies can have a parent (the group holding). This
-- supports multi-level groups — e.g. Jain Metal Group → Jain Resource
-- Recycling Ltd → Facility 1 / Facility 2.

CREATE TABLE IF NOT EXISTS companies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT UNIQUE NOT NULL,
  legal_name          TEXT NOT NULL,
  trade_name          TEXT,
  parent_company_id   UUID REFERENCES companies(id) ON DELETE SET NULL,
  is_group_holding    BOOLEAN NOT NULL DEFAULT FALSE,
  cin                 TEXT,
  pan                 TEXT,
  gstin               TEXT,
  website             TEXT,
  registered_address  TEXT,
  registered_state    TEXT,
  description         TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_parent   ON companies (parent_company_id);
CREATE INDEX IF NOT EXISTS idx_companies_slug     ON companies (slug);
CREATE INDEX IF NOT EXISTS idx_companies_cin      ON companies (cin)      WHERE cin IS NOT NULL;

ALTER TABLE recyclers
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
  ADD COLUMN IF NOT EXISTS unit_name  TEXT;

CREATE INDEX IF NOT EXISTS idx_recyclers_company  ON recyclers (company_id);

COMMENT ON TABLE  companies                    IS 'Legal entities / group holdings. Self-referencing — parent_company_id = group holding when applicable.';
COMMENT ON COLUMN companies.is_group_holding   IS 'True for pure holdings (no operations of their own), e.g. "Jain Metal Group".';
COMMENT ON COLUMN recyclers.company_id         IS 'The legal entity (companies.id) that owns this facility.';
COMMENT ON COLUMN recyclers.unit_name          IS 'Human-readable unit label within the company — e.g. "Facility 1 — Copper".';
