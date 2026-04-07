-- ============================================================
-- Add invoice_date to order_payment_stages
-- Allows stage-specific invoice dating (e.g. SVC-001 S1+S2 on 31 Mar, S3 on 11 Apr)
-- ============================================================

ALTER TABLE order_payment_stages
  ADD COLUMN IF NOT EXISTS invoice_date DATE;

-- SVC-001 — Stages 1 & 2 invoiced 31 Mar 2026 (FY 25-26)
UPDATE order_payment_stages
SET invoice_date = '2026-03-31'
WHERE order_id = (SELECT id FROM orders WHERE order_no = 'SVC-001')
  AND stage_number IN (1, 2);

-- SVC-001 — Stage 3 invoiced 11 Apr 2026 (FY 26-27, post commissioning)
UPDATE order_payment_stages
SET invoice_date = '2026-04-11'
WHERE order_id = (SELECT id FROM orders WHERE order_no = 'SVC-001')
  AND stage_number = 3;
