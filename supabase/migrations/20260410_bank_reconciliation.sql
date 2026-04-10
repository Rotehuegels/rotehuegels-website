-- Bank reconciliation columns
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS reconciled BOOLEAN DEFAULT FALSE;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS reconciled_at TIMESTAMPTZ;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS matched_entity_type TEXT;  -- order_payment | expense | payroll | other
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS matched_entity_id UUID;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS match_notes TEXT;

CREATE INDEX IF NOT EXISTS bank_transactions_reconciled_idx ON bank_transactions (reconciled);
