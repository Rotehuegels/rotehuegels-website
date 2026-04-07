-- Mark QT-2026-002 as converted — superseded by SVC-001-EXT order
-- Prolongation charges (Feb–Mar 2026) are captured in SVC-001-EXT at ₹2L base + 18% GST
UPDATE quotes
SET status = 'converted'
WHERE quote_no = 'QT-2026-002';
