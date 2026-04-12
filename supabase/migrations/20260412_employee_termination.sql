-- Add termination tracking columns to employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS termination_reason TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS termination_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS termination_type TEXT
  CHECK (termination_type IN ('resignation', 'termination', 'contract_end', 'retirement', 'other'));
