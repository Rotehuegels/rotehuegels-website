-- ============================================================
-- Plumbing Work Expenses — India Zinc Site (SVC-001)
-- ============================================================

-- ── Update ₹33,634 entry: correct to ₹30,000 (3 days only) ──
-- ₹3,634 balance was personal — not a business expense
UPDATE expenses
SET amount      = 30000.00,
    description = 'Plumbing Work — Days 1–3 | SVC-001',
    notes       = '3 days plumbing × ₹10,000 = ₹30,000. Business account transfer to personal account on 6 Mar 2026 (IMPS). India Zinc site. (₹3,634 balance in original transfer was personal — excluded.)'
WHERE vendor_name = 'Plumber (site contractor)'
  AND expense_date = '2026-03-06'
  AND amount = 33634.00;


-- ── 4th day plumbing — 13 Mar 2026 ──────────────────────────
INSERT INTO expenses (
  expense_type, category, description, vendor_name,
  amount, gst_input_credit, expense_date, payment_mode, notes
) VALUES (
  'other', 'Labour & Job Work',
  'Plumbing Work — Day 4 | SVC-001',
  'Plumber (site contractor)',
  10000.00, 0.00, '2026-03-13', 'UPI',
  'Day 4 plumbing at India Zinc site. Paid via mobile (UPI). No GST — informal contractor.'
);


-- ── Bending work — paid 13 Mar 2026 (done 11 Mar) ───────────
INSERT INTO expenses (
  expense_type, category, description, vendor_name,
  amount, gst_input_credit, expense_date, payment_mode, notes
) VALUES (
  'other', 'Labour & Job Work',
  'Bus Bar Bending & Plumbing Work | SVC-001',
  'Plumber (site contractor)',
  20000.00, 0.00, '2026-03-13', 'Cash',
  'Bending and plumbing work completed 11 Mar 2026. Cash paid 13 Mar 2026. No GST — informal contractor.'
);
