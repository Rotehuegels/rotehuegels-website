-- ============================================================
-- Add items JSONB column to orders
-- Used for invoices with multiple line items (different HSN codes)
-- Falls back to single-row rendering when NULL
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB;
