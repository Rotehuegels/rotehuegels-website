-- ============================================================
-- Fix SGBT65 quantity (was incorrectly calculated as 121)
-- Correct: 30 units bought on 18 Mar 2026 after full sell-off
-- Add direct allotment SGB (1 gram, subscribed 20 Sep 2023)
-- ============================================================

-- Fix SGBT65 NSE-traded holding
UPDATE demat_holdings
SET quantity       = 30,
    avg_buy_price  = 15784.98,
    total_invested = 473549.53,
    updated_at     = NOW()
WHERE symbol = 'SGBT65';

-- Add direct allotment SGB (not NSE-traded, no live price)
INSERT INTO demat_holdings (
  symbol, company_name, exchange, yahoo_symbol,
  quantity, avg_buy_price, total_invested
) VALUES (
  'SGB-DIRECT',
  'Sovereign Gold Bond — Direct Allotment (20 Sep 2023)',
  'RBI',
  '',
  1,
  5923.00,
  5923.00
) ON CONFLICT (symbol) DO UPDATE SET
  quantity       = EXCLUDED.quantity,
  avg_buy_price  = EXCLUDED.avg_buy_price,
  total_invested = EXCLUDED.total_invested,
  updated_at     = NOW();
