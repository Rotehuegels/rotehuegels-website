-- ============================================================
-- customers: add cc_emails JSONB column for additional
-- recipients (accounts staff, technical consultants, etc.).
-- Seed India Zinc (CUST-001) with:
--   - Lakshmi Prabhu (accounts staff) <sabarealam.accts@gmail.com>
--   - Ramasubramanian Raghavan (technical consultant) <dr.r.raghavan@gmail.com>
--   - Mohanan P.K (technical consultant) <mohananbiota@gmail.com>
-- ============================================================

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS cc_emails JSONB DEFAULT '[]'::jsonb;

UPDATE customers
SET cc_emails = $$[
  {"name": "Lakshmi Prabhu",            "email": "sabarealam.accts@gmail.com", "role": "accounts"},
  {"name": "Ramasubramanian Raghavan",  "email": "dr.r.raghavan@gmail.com",    "role": "technical_consultant"},
  {"name": "Mohanan P.K",               "email": "mohananbiota@gmail.com",     "role": "technical_consultant"}
]$$::jsonb
WHERE customer_id = 'CUST-001';
