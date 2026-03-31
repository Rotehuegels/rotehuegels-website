CREATE TABLE IF NOT EXISTS bank_transactions (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_no     TEXT,
  statement_from DATE,
  statement_to   DATE,
  txn_date       DATE NOT NULL,
  value_date     DATE NOT NULL,
  description    TEXT NOT NULL,
  ref_no         TEXT,
  branch_code    TEXT,
  debit          NUMERIC(14,2) NOT NULL DEFAULT 0,
  credit         NUMERIC(14,2) NOT NULL DEFAULT 0,
  balance        NUMERIC(14,2),
  imported_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (txn_date, description, debit, credit, balance)
);

CREATE INDEX IF NOT EXISTS bank_transactions_date_idx ON bank_transactions (txn_date DESC);
