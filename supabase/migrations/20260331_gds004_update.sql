-- ============================================================
-- GDS-004: Update description with confirmed breakdown
-- ₹10,000 plumbing day + ₹4,000 diffuser welding + ₹98 misc
-- Reimbursed by India Zinc on 3 Mar 2026
-- ============================================================

-- Update GDS-004 order description
UPDATE orders
SET description = 'Expense Reimbursement — Plumbing Day + Diffuser Welding + Misc | SVC-001',
    notes       = 'Reimbursement of site expenses: 1 day plumbing labour ₹10,000 + diffuser welding (local) ₹4,000 + misc purchases ₹98 = ₹14,098. Reimbursed by M/s India Zinc Inc via NEFT on 3 Mar 2026 (ref SCBLH06200685362).'
WHERE order_no = 'GDS-004';


-- Add diffuser welding expense
INSERT INTO expenses (
  expense_type, category, description, vendor_name,
  amount, gst_input_credit, expense_date, payment_mode, notes
) VALUES (
  'other', 'Fabrication & Processing',
  'Diffuser Welding — SVC-001 plumbing work',
  'Local Welder',
  4000.00, 0.00, '2026-03-03', 'Cash',
  'Diffuser welding done locally for plumbing work at India Zinc site. Reimbursed by India Zinc (GDS-004).'
),
(
  'other', 'Misc & Statutory',
  'Misc Site Purchases — SVC-001',
  'Misc',
  98.00, 0.00, '2026-03-03', 'Cash',
  'Miscellaneous site purchases for plumbing work. Reimbursed by India Zinc (GDS-004).'
);
