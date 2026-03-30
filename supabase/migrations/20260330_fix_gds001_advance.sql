-- Fix GDS-001: advance was ₹7,10,000 (not ₹71,000)
-- Balance corrected to ₹8,38,440.05 - ₹7,10,000 = ₹1,28,440.05

DO $$
DECLARE
  gds1_id     UUID;
  adv_stage   UUID;
  bal_stage   UUID;
  pmt_id      UUID;
BEGIN
  SELECT id INTO gds1_id FROM orders WHERE order_no = 'GDS-001';

  -- Stage 1 (Advance): fix amount
  SELECT id INTO adv_stage
    FROM order_payment_stages
    WHERE order_id = gds1_id AND stage_number = 1;

  UPDATE order_payment_stages
    SET amount_due = 710000.00, net_receivable = 710000.00
    WHERE id = adv_stage;

  -- Stage 2 (Balance): fix amount
  SELECT id INTO bal_stage
    FROM order_payment_stages
    WHERE order_id = gds1_id AND stage_number = 2;

  UPDATE order_payment_stages
    SET amount_due = 128440.05, net_receivable = 128440.05
    WHERE id = bal_stage;

  -- Payment record: fix amount received
  UPDATE order_payments
    SET amount_received = 710000.00, net_received = 710000.00
    WHERE order_id = gds1_id AND stage_id = adv_stage;
END $$;
