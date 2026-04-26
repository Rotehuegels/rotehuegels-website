-- ── Atomic purchase-invoice creation ────────────────────────────────────────
-- The previous handler did three sequential writes:
--   1) INSERT header
--   2) INSERT items (manual rollback by deleting header on item failure)
--   3) UPDATE header with rolled-up match_status / payment_status
-- A crash between step 1 and step 2 (network blip, OOM, force-quit) left an
-- orphan header with no items. Wrap header + items + status flag into a
-- single Postgres function so it's all-or-nothing.
--
-- Matching engine stays in TypeScript (lib/threeWayMatch.ts) — the function
-- is a pure transactional shell that takes pre-computed match results.

CREATE OR REPLACE FUNCTION create_purchase_invoice_with_items(
  p_header         jsonb,
  p_items          jsonb,
  p_match_status   text,
  p_payment_status text
) RETURNS uuid AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.purchase_invoices (
    invoice_no, supplier_id, po_id, invoice_date, received_date, due_date,
    subtotal, taxable_value, igst_amount, cgst_amount, sgst_amount, total_amount,
    notes, match_status, payment_status
  ) VALUES (
    p_header ->> 'invoice_no',
    (p_header ->> 'supplier_id')::uuid,
    NULLIF(p_header ->> 'po_id', '')::uuid,
    (p_header ->> 'invoice_date')::date,
    NULLIF(p_header ->> 'received_date', '')::date,
    NULLIF(p_header ->> 'due_date', '')::date,
    (p_header ->> 'subtotal')::numeric,
    (p_header ->> 'taxable_value')::numeric,
    (p_header ->> 'igst_amount')::numeric,
    (p_header ->> 'cgst_amount')::numeric,
    (p_header ->> 'sgst_amount')::numeric,
    (p_header ->> 'total_amount')::numeric,
    p_header ->> 'notes',
    p_match_status,
    p_payment_status
  )
  RETURNING id INTO new_id;

  INSERT INTO public.purchase_invoice_items (
    invoice_id, po_item_id, description, hsn_code, quantity, unit, unit_price,
    taxable_amount, gst_rate, gst_amount, total,
    match_status, variance_price_pct, variance_qty_pct, matched_grn_qty
  )
  SELECT
    new_id,
    NULLIF(item ->> 'po_item_id', '')::uuid,
    item ->> 'description',
    item ->> 'hsn_code',
    (item ->> 'quantity')::numeric,
    item ->> 'unit',
    (item ->> 'unit_price')::numeric,
    (item ->> 'taxable_amount')::numeric,
    (item ->> 'gst_rate')::numeric,
    (item ->> 'gst_amount')::numeric,
    (item ->> 'total')::numeric,
    item ->> 'match_status',
    NULLIF(item ->> 'variance_price_pct', 'null')::numeric,
    NULLIF(item ->> 'variance_qty_pct',   'null')::numeric,
    (item ->> 'matched_grn_qty')::numeric
  FROM jsonb_array_elements(p_items) item;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload schema';
