-- ============================================================
-- Investments Module — Demat Holdings
-- ICICI Direct account — calculated from order book
-- 1 Oct 2025 to 31 Mar 2026
-- ============================================================

CREATE TABLE IF NOT EXISTS demat_holdings (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol         TEXT NOT NULL UNIQUE,
  company_name   TEXT NOT NULL,
  exchange       TEXT NOT NULL DEFAULT 'NSE',
  yahoo_symbol   TEXT NOT NULL,
  quantity       NUMERIC(12, 4) NOT NULL DEFAULT 0,
  avg_buy_price  NUMERIC(14, 4) NOT NULL DEFAULT 0,
  total_invested NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Seed holdings (calculated from ICICI Direct order book)
INSERT INTO demat_holdings (symbol, company_name, exchange, yahoo_symbol, quantity, avg_buy_price, total_invested) VALUES
('SGBT65',     'Sovereign Gold Bond Tranche 65',  'NSE', 'SGBT65.NS',     121,    15401.39,  1863567.90),
('HDFCBANK',   'HDFC Bank Ltd',                   'NSE', 'HDFCBANK.NS',   275,      824.86,   226836.60),
('ITC',        'ITC Ltd',                         'NSE', 'ITC.NS',        640,      313.65,   200735.85),
('IDFCFIRSTB', 'IDFC First Bank Ltd',             'NSE', 'IDFCFIRSTB.NS', 2000,      66.45,   132900.00),
('ICICIBANK',  'ICICI Bank Ltd',                  'NSE', 'ICICIBANK.NS',  100,     1285.44,   128543.70),
('INFY',       'Infosys Ltd',                     'NSE', 'INFY.NS',       100,     1257.29,   125729.40),
('VEDL',       'Vedanta Ltd',                     'NSE', 'VEDL.NS',       100,      682.97,    68297.30),
('NATIONALUM', 'National Aluminium Company Ltd',  'NSE', 'NATIONALUM.NS', 101,      336.79,    34016.10),
('ONGC',       'Oil & Natural Gas Corp Ltd',      'NSE', 'ONGC.NS',       100,      262.70,    26270.40),
('AXISBANK',   'Axis Bank Ltd',                   'NSE', 'AXISBANK.NS',   20,      1236.18,    24723.70),
('TATASTEEL',  'Tata Steel Ltd',                  'NSE', 'TATASTEEL.NS',  100,      193.43,    19342.72),
('ADANIPOWER', 'Adani Power Ltd',                 'NSE', 'ADANIPOWER.NS', 100,      153.95,    15394.54),
('IOC',        'Indian Oil Corporation Ltd',      'NSE', 'IOC.NS',        100,      146.47,    14646.64),
('DRREDDY',    'Dr Reddy''s Laboratories Ltd',    'NSE', 'DRREDDY.NS',    11,      1281.40,    14095.40),
('HINDALCO',   'Hindalco Industries Ltd',         'NSE', 'HINDALCO.NS',   11,       918.83,    10107.15),
('NMDC',       'NMDC Ltd',                        'NSE', 'NMDC.NS',       101,       79.18,     7997.08),
('HEROMOTOCO', 'Hero MotoCorp Ltd',               'NSE', 'HEROMOTOCO.NS', 1,       5441.00,     5441.00),
('INDUSTOWER', 'Indus Towers Ltd',                'NSE', 'INDUSTOWER.NS', 10,       461.09,     4610.85),
('JSWSTEEL',   'JSW Steel Ltd',                   'NSE', 'JSWSTEEL.NS',   2,       1246.30,     2492.60),
('AUROPHARMA', 'Aurobindo Pharma Ltd',            'NSE', 'AUROPHARMA.NS', 1,       1156.00,     1156.00),
('ZYDUSLIFE',  'Zydus Lifesciences Ltd',          'NSE', 'ZYDUSLIFE.NS',  1,        903.05,      903.05),
('HINDCOPPER', 'Hindustan Copper Ltd',            'NSE', 'HINDCOPPER.NS', 1,        567.85,      567.85),
('COALINDIA',  'Coal India Ltd',                  'NSE', 'COALINDIA.NS',  1,        422.40,      422.40),
('NTPC',       'NTPC Ltd',                        'NSE', 'NTPC.NS',       1,        372.85,      372.85),
('POWERGRID',  'Power Grid Corp of India Ltd',    'NSE', 'POWERGRID.NS',  1,        299.15,      299.15)
ON CONFLICT (symbol) DO UPDATE SET
  quantity       = EXCLUDED.quantity,
  avg_buy_price  = EXCLUDED.avg_buy_price,
  total_invested = EXCLUDED.total_invested,
  updated_at     = NOW();
