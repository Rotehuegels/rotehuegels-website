-- ── Atomic PO + GRN numbering ───────────────────────────────────────────────
-- The previous pattern (SELECT count(*) FROM table; insert with seq=count+1)
-- is racy under concurrency — two parallel POSTs can both read the same
-- count and produce duplicate document numbers. Replace with single-statement
-- atomic counters + RPCs, mirroring the next_indent_no() pattern.
--
-- PO numbers reset per calendar year (PO-YYYY-NNN); GRN numbers are one
-- continuous sequence (GRN-NNNN), matching the existing on-screen format.

-- 1. Counter tables
CREATE TABLE IF NOT EXISTS po_no_year_counters (
  year      text    PRIMARY KEY,
  next_seq  integer NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS grn_no_counter (
  id        text    PRIMARY KEY DEFAULT 'global',
  next_seq  integer NOT NULL DEFAULT 1
);

-- 2. Backfill from existing rows so the next number doesn't collide.
--    GREATEST() makes the migration safe to re-run after partial state.
INSERT INTO po_no_year_counters (year, next_seq)
SELECT
  m[1] AS year,
  max(m[2]::int) + 1 AS next_seq
FROM purchase_orders,
LATERAL regexp_match(po_no, '^PO-(\d{4})-(\d+)$') m
WHERE m IS NOT NULL
GROUP BY m[1]
ON CONFLICT (year) DO UPDATE SET next_seq = GREATEST(po_no_year_counters.next_seq, EXCLUDED.next_seq);

INSERT INTO grn_no_counter (id, next_seq)
SELECT 'global', max(m[1]::int) + 1
FROM goods_receipt_notes,
LATERAL regexp_match(grn_no, '^GRN-(\d+)$') m
WHERE m IS NOT NULL
ON CONFLICT (id) DO UPDATE SET next_seq = GREATEST(grn_no_counter.next_seq, EXCLUDED.next_seq);

-- 3. RPCs — single-statement upsert + RETURNING. Atomic per Postgres
--    transaction; no read-then-write race window.
CREATE OR REPLACE FUNCTION next_po_no(p_date date DEFAULT CURRENT_DATE) RETURNS text AS $$
DECLARE
  yr text := to_char(p_date, 'YYYY');
  n  integer;
BEGIN
  INSERT INTO po_no_year_counters (year, next_seq)
  VALUES (yr, 2)
  ON CONFLICT (year) DO UPDATE SET next_seq = po_no_year_counters.next_seq + 1
  RETURNING next_seq - 1 INTO n;
  RETURN 'PO-' || yr || '-' || lpad(n::text, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION next_grn_no() RETURNS text AS $$
DECLARE
  n integer;
BEGIN
  INSERT INTO grn_no_counter (id, next_seq)
  VALUES ('global', 2)
  ON CONFLICT (id) DO UPDATE SET next_seq = grn_no_counter.next_seq + 1
  RETURNING next_seq - 1 INTO n;
  RETURN 'GRN-' || lpad(n::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload schema';
