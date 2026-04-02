-- ============================================================
-- Add sector column to demat_holdings
-- ============================================================

ALTER TABLE demat_holdings ADD COLUMN IF NOT EXISTS sector TEXT NOT NULL DEFAULT 'Other';

UPDATE demat_holdings SET sector = 'Banking & Finance'     WHERE symbol IN ('HDFCBANK','ICICIBANK','AXISBANK','IDFCFIRSTB');
UPDATE demat_holdings SET sector = 'Metals & Mining'       WHERE symbol IN ('NATIONALUM','HINDALCO','VEDL','TATASTEEL','JSWSTEEL','NMDC','HINDCOPPER');
UPDATE demat_holdings SET sector = 'Energy'                WHERE symbol IN ('COALINDIA','ONGC','IOC','NTPC','POWERGRID','ADANIPOWER');
UPDATE demat_holdings SET sector = 'Technology'            WHERE symbol IN ('INFY');
UPDATE demat_holdings SET sector = 'Pharma & Healthcare'   WHERE symbol IN ('AUROPHARMA','DRREDDY','ZYDUSLIFE');
UPDATE demat_holdings SET sector = 'FMCG'                  WHERE symbol IN ('ITC');
UPDATE demat_holdings SET sector = 'Auto'                  WHERE symbol IN ('HEROMOTOCO');
UPDATE demat_holdings SET sector = 'Telecom Infrastructure' WHERE symbol IN ('INDUSTOWER');
UPDATE demat_holdings SET sector = 'Gold & Sovereign Bonds' WHERE symbol IN ('SGBT65','SGB-DIRECT');
