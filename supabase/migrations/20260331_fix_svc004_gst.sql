-- ============================================================
-- Fix SVC-004 — CEG Workshop Travel Reimbursement
-- Pure reimbursement at actuals → no GST applicable
-- Update: remove GST, total = ₹3,000 flat
-- ============================================================

-- Update the order — remove GST + set client name
UPDATE orders SET
  client_name          = 'Society of Materials Science Engineers, CEG',
  total_value_incl_gst = 3000.00,
  gst_rate             = 0.00,
  cgst_amount          = 0.00,
  sgst_amount          = 0.00,
  notes                = 'Travel expense reimbursement for CEG Workshop on 13 Mar 2026. Pure reimbursement at actuals — no GST. Society of Materials Science Engineers is a college society (no GST number). Invoice to be raised.'
WHERE order_no = 'SVC-004';

-- Update the payment stage
UPDATE order_payment_stages SET
  gst_on_stage    = 0.00,
  net_receivable  = 3000.00
WHERE order_id = (SELECT id FROM orders WHERE order_no = 'SVC-004')
  AND stage_number = 1;
