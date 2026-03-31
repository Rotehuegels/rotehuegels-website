-- ============================================================
-- Crysta 2025 — Department Function Sponsorship
-- Held: 31 Oct – 1 Nov 2025
-- ₹20,000 paid as sponsor | No GST (college event)
-- ============================================================

INSERT INTO expenses (
  expense_type, category, description, vendor_name,
  amount, gst_input_credit, expense_date, payment_mode, notes
) VALUES (
  'other', 'Marketing & Sponsorship',
  'Sponsorship — Crysta 2025 Department Function',
  'Society of Materials Science Engineers, College of Engineering Guindy',
  20000.00, 0.00, '2025-10-31', 'NEFT',
  'Sponsor for Crysta 2025 dept function held 31 Oct – 1 Nov 2025. NEFT to A/C No. 31098322208. No GST (college society).'
);
