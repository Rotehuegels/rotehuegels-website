-- ============================================================
-- Fix equity holdings to match actual ICICI Direct portfolio
-- as on 31 Mar 2026. Avg buy prices derived from invested/qty.
-- SGB data carried forward from 20260331_fix_sgbt65.sql.
-- ============================================================

-- Upsert all equity holdings with correct data
INSERT INTO demat_holdings (symbol, company_name, exchange, yahoo_symbol, quantity, avg_buy_price, total_invested) VALUES
('NATIONALUM', 'National Aluminium Company Ltd',       'NSE', 'NATIONALUM.NS', 100,   337.97,  33797.00),
('HINDALCO',   'Hindalco Industries Ltd',              'NSE', 'HINDALCO.NS',    11,   922.18,  10144.00),
('COALINDIA',  'Coal India Ltd',                       'NSE', 'COALINDIA.NS',    1,   424.00,    424.00),
('ONGC',       'Oil & Natural Gas Corp Ltd',           'NSE', 'ONGC.NS',        100,  263.05,  26305.00),
('VEDL',       'Vedanta Ltd',                          'NSE', 'VEDL.NS',        100,  683.86,  68386.00),
('POWERGRID',  'Power Grid Corp of India Ltd',         'NSE', 'POWERGRID.NS',     1,  300.00,    300.00),
('JSWSTEEL',   'JSW Steel Ltd',                        'NSE', 'JSWSTEEL.NS',      2, 1251.00,   2502.00),
('TATASTEEL',  'Tata Steel Ltd',                       'NSE', 'TATASTEEL.NS',   100,  193.63,  19363.00),
('AUROPHARMA', 'Aurobindo Pharma Ltd',                 'NSE', 'AUROPHARMA.NS',    1, 1160.00,   1160.00),
('NMDC',       'NMDC Ltd',                             'NSE', 'NMDC.NS',         101,   79.46,   8025.00),
('NTPC',       'NTPC Ltd',                             'NSE', 'NTPC.NS',           1,  374.00,    374.00),
('INFY',       'Infosys Ltd',                          'NSE', 'INFY.NS',          100, 1259.75, 125975.00),
('HEROMOTOCO', 'Hero MotoCorp Ltd',                    'NSE', 'HEROMOTOCO.NS',     1, 5461.00,   5461.00),
('IOC',        'Indian Oil Corporation Ltd',           'NSE', 'IOC.NS',           100,  146.62,  14662.00),
('INDUSTOWER', 'Indus Towers Ltd',                     'NSE', 'INDUSTOWER.NS',    10,  461.70,   4617.00),
('DRREDDY',    'Dr Reddy''s Laboratories Ltd',         'NSE', 'DRREDDY.NS',       11, 1283.00,  14113.00),
('ICICIBANK',  'ICICI Bank Ltd',                       'NSE', 'ICICIBANK.NS',    100, 1286.78, 128678.00),
('ADANIPOWER', 'Adani Power Ltd',                      'NSE', 'ADANIPOWER.NS',   100,  154.11,  15411.00),
('ITC',        'ITC Ltd',                              'NSE', 'ITC.NS',           640,  314.25, 201120.00),
('ZYDUSLIFE',  'Zydus Lifesciences Ltd',               'NSE', 'ZYDUSLIFE.NS',      1,  906.00,    906.00),
('HDFCBANK',   'HDFC Bank Ltd',                        'NSE', 'HDFCBANK.NS',     275,  825.70, 227068.00),
('AXISBANK',   'Axis Bank Ltd',                        'NSE', 'AXISBANK.NS',      20, 1237.60,  24752.00),
('IDFCFIRSTB', 'IDFC First Bank Ltd',                  'NSE', 'IDFCFIRSTB.NS', 2000,    66.61, 133220.00),
('HINDCOPPER', 'Hindustan Copper Ltd',                 'NSE', 'HINDCOPPER.NS',    1,   570.00,    570.00),
-- SGB holdings (carried forward)
('SGBT65',     'Sovereign Gold Bond Tranche 65',       'NSE', 'SGBT65.NS',       30, 15784.98, 473549.53),
('SGB-DIRECT', 'Sovereign Gold Bond — Direct Allotment (20 Sep 2023)', 'RBI', '', 1, 5923.00, 5923.00)
ON CONFLICT (symbol) DO UPDATE SET
  quantity       = EXCLUDED.quantity,
  avg_buy_price  = EXCLUDED.avg_buy_price,
  total_invested = EXCLUDED.total_invested,
  updated_at     = NOW();
