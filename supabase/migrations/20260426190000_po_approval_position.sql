-- Switch the PO approval gate from a hardcoded email to a position-based
-- cascade. The new setting points at a position id; the runtime resolver
-- walks reports_to_id until it finds a filled position. Default is CFO —
-- POs are a financial commitment, so CFO is the natural sign-off.

INSERT INTO app_settings (key, value) VALUES
  ('po.approver_position_id', 'cfo')
ON CONFLICT (key) DO NOTHING;

-- Old setting is no longer read by the route. Leaving it in place is harmless,
-- but tidier to remove so future readers aren't confused.
DELETE FROM app_settings WHERE key = 'po.approver_email';
