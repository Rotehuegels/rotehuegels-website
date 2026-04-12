-- Add seq column to preserve original transaction order from bank statements.
-- Without this, transactions on the same date appear in arbitrary order,
-- causing wrong closing-balance display.

ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS seq INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS bank_transactions_seq_idx
  ON bank_transactions (txn_date DESC, seq DESC);

-- ── Backfill: reconstruct seq from balance chain ──────────────
-- For each date, find the transaction whose balance = prev_closing + credit - debit
-- and chain forward. This correctly orders same-date transactions.

DO $$
DECLARE
  dt         DATE;
  prev_bal   NUMERIC(14,2) := NULL;
  txn        RECORD;
  seq_val    INTEGER := 1;
  found      BOOLEAN;
BEGIN
  FOR dt IN SELECT DISTINCT txn_date FROM bank_transactions ORDER BY txn_date ASC LOOP
    LOOP
      found := FALSE;
      FOR txn IN
        SELECT * FROM bank_transactions
        WHERE txn_date = dt AND seq = 0
        ORDER BY id
      LOOP
        IF prev_bal IS NULL THEN
          -- Very first transaction: accept it
          UPDATE bank_transactions SET seq = seq_val WHERE id = txn.id;
          prev_bal := txn.balance;
          seq_val  := seq_val + 1;
          found    := TRUE;
          EXIT;  -- restart inner loop to find next in chain
        ELSIF ABS(COALESCE(prev_bal,0) + txn.credit - txn.debit - COALESCE(txn.balance,0)) < 0.02 THEN
          -- This transaction follows from prev_bal
          UPDATE bank_transactions SET seq = seq_val WHERE id = txn.id;
          prev_bal := txn.balance;
          seq_val  := seq_val + 1;
          found    := TRUE;
          EXIT;
        END IF;
      END LOOP;

      IF NOT found THEN
        -- No match in chain; assign remaining rows for this date in id order
        FOR txn IN
          SELECT * FROM bank_transactions
          WHERE txn_date = dt AND seq = 0
          ORDER BY id
        LOOP
          UPDATE bank_transactions SET seq = seq_val WHERE id = txn.id;
          prev_bal := txn.balance;
          seq_val  := seq_val + 1;
        END LOOP;
        EXIT;  -- next date
      END IF;

      IF NOT EXISTS (SELECT 1 FROM bank_transactions WHERE txn_date = dt AND seq = 0) THEN
        EXIT;  -- all done for this date
      END IF;
    END LOOP;
  END LOOP;
END $$;
