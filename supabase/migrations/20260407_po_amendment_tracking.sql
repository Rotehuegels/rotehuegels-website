-- ============================================================
-- Purchase Orders: add amendment tracking columns
-- amendment_no = 0 means original PO, 1/2/3... = amendments
-- ============================================================

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS amendment_no    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amendment_date  DATE,
  ADD COLUMN IF NOT EXISTS amendment_notes TEXT;

-- PO-2026-001 Amendment 01 — 07 Apr 2026
-- Changes: drawing ref V04→V05 (13 Mar 2026), bus bar 40×16mm,
--          payment terms revised (balance against documents, not on delivery)
UPDATE purchase_orders SET
  amendment_no    = 1,
  amendment_date  = '2026-04-07',
  amendment_notes = 'Amd 01 (07 Apr 2026): Drawing reference updated to ZDP0003 V05 dated 13 Mar 2026; '
                    'bus bar dimensions corrected to 40×16 mm; payment terms revised — '
                    'balance ₹2,25,915 payable against submission of revised CoA and Warranty/QA letter; '
                    'dispatch by supplier only after full payment confirmation.'
WHERE po_no = 'PO-2026-001';
