-- ============================================================
-- Rotehügels — FY 2025-26 Expense Seed
-- All purchase & overhead expenses for the year
-- Run in Supabase SQL Editor
-- ============================================================

INSERT INTO expenses (
  expense_type, category, description, vendor_name,
  amount, gst_input_credit, expense_date, payment_mode, notes
) VALUES

-- ── NOVEMBER 2025 ──────────────────────────────────────────

('other', 'Professional Fees',
  'Advisory Services',
  'Sraddhaa Advisory Private Limited',
  4000.00, 720.00, '2025-11-12', 'NEFT',
  'CGST ₹360 + SGST ₹360 | Total paid ₹4,720'),

('other', 'Conference & Training',
  'Registration Fee — CRITMET 2025',
  'NML (National Metallurgical Laboratory)',
  10000.00, 1800.00, '2025-11-13', 'NEFT',
  'IGST ₹1,800 (inter-state) | Total ₹11,800'),

-- ── FEBRUARY 2026 ──────────────────────────────────────────

('other', 'Software & Subscriptions',
  'TallyPrime Silver — Single User Licence',
  'Tally Solutions Pvt Ltd',
  21375.00, 3847.50, '2026-02-03', 'NEFT',
  'CGST ₹1,923.75 + SGST ₹1,923.75 | Total ₹25,222.50'),

('other', 'Software & Subscriptions',
  'TallyPrime on Cloud Access — Personal',
  'Tally Solutions Pvt Ltd',
  2250.00, 405.00, '2026-02-03', 'NEFT',
  'CGST ₹202.50 + SGST ₹202.50 | Total ₹2,655'),

('purchase', 'Raw Materials',
  'Metal & Alloys — GDS-001',
  'Shree Padmavati Metal & Alloys',
  2600.00, 468.00, '2026-02-09', 'NEFT',
  'CGST ₹234 + SGST ₹234 | Total ₹3,068'),

('purchase', 'Raw Materials',
  'Materials — GDS-001',
  'Sharp Industries',
  1325.00, 238.50, '2026-02-10', 'NEFT',
  'CGST ₹119.25 + SGST ₹119.25 | Total ₹1,563.50'),

('other', 'Logistics & Delivery',
  'Transport — Porter CRN1156486645',
  'Porter',
  600.00, 0.00, '2026-02-10', 'UPI',
  'Porter CRN1156486645'),

('purchase', 'Raw Materials',
  'High Purity Aluminium — Invoice 1 | GDS-001',
  'Tamiinad Aluminium Company',
  42735.00, 7692.30, '2026-02-11', 'NEFT',
  'CGST ₹3,846.15 + SGST ₹3,846.15 | Total ₹50,427.30'),

('purchase', 'Raw Materials',
  'High Purity Aluminium — Invoice 2 | GDS-001',
  'Tamiinad Aluminium Company',
  29006.25, 5221.12, '2026-02-11', 'NEFT',
  'CGST ₹2,610.56 + SGST ₹2,610.56 | Total ₹34,227.37'),

('purchase', 'Raw Materials',
  'Metal & Alloys — GDS-001',
  'Virwadia Metal & Alloys',
  368.00, 66.24, '2026-02-12', 'NEFT',
  'CGST ₹33.12 + SGST ₹33.12 | Total ₹434.24'),

('purchase', 'Raw Materials',
  'Plastic Insulations — GDS-001',
  'Chennai Plastics Insulations',
  7800.00, 1404.00, '2026-02-12', 'NEFT',
  'CGST ₹702 + SGST ₹702 | Total ₹9,204'),

('other', 'Logistics & Delivery',
  'Transport — Porter CRN1639171001',
  'Porter',
  119.93, 0.00, '2026-02-12', 'UPI',
  'Porter CRN1639171001 | Total ₹120'),

('purchase', 'Fabrication & Processing',
  'Fabrication Work — GDS-001',
  'SVK Fabricators',
  720.00, 0.00, '2026-02-12', 'Cash',
  'Cash payment — no GST'),

('other', 'Misc & Statutory',
  'eChallan — Traffic Police',
  'Traffic Police',
  500.00, 0.00, '2026-02-13', 'UPI',
  'eChallan fine — no input credit'),

('other', 'Logistics & Delivery',
  'Transport — Porter CRN2004764933',
  'Porter',
  300.00, 0.00, '2026-02-14', 'UPI',
  'Porter CRN2004764933'),

('purchase', 'Fabrication & Processing',
  'Fabrication Work — GDS-001',
  'SVK Fabricators',
  600.00, 0.00, '2026-02-14', 'Cash',
  'Cash payment — no GST'),

('purchase', 'Raw Materials',
  'Materials — GDS-001',
  'Sharp Industries',
  3960.00, 712.80, '2026-02-14', 'NEFT',
  'CGST ₹356.40 + SGST ₹356.40 | Total ₹4,672.80'),

('purchase', 'Fabrication & Processing',
  'Slotting Work — GDS-001',
  'Balaji Slotting Works',
  2500.00, 0.00, '2026-02-14', 'Cash',
  'Cash — no GST'),

('purchase', 'Raw Materials',
  'Lead / Alloys — Advance Payment | GDS-001',
  'Galena Metals Pvt Ltd',
  84000.00, 0.00, '2026-02-15', 'NEFT',
  'Advance against supply; balance invoice pending'),

('other', 'Logistics & Delivery',
  'Transport — Cash',
  'Mr. Muthu (Transporter)',
  100.00, 0.00, '2026-02-16', 'Cash',
  'Cash payment'),

('other', 'Misc & Statutory',
  'Miscellaneous Cash Expense',
  'Misc',
  60.00, 0.00, '2026-02-16', 'Cash',
  'Petty cash misc'),

('purchase', 'Raw Materials',
  'Lead & Alloys — GDS-001',
  'Metal Source',
  112493.50, 20248.84, '2026-02-16', 'NEFT',
  'CGST ₹10,124.42 + SGST ₹10,124.42 | Total ₹1,32,742.33'),

('purchase', 'Logistics & Delivery',
  'Delivery — MSS Ambattur',
  'MSS Ambattur',
  2300.00, 0.00, '2026-02-18', 'Cash',
  'Delivery charges'),

('purchase', 'Raw Materials',
  'Materials — GDS-001',
  'Sharp Industries',
  2879.66, 518.34, '2026-02-18', 'NEFT',
  'CGST ₹259.17 + SGST ₹259.17 | Total ₹3,398'),

('purchase', 'Fabrication & Processing',
  'Laser Engraving — GDS-001',
  'Laser Engraving',
  2300.00, 0.00, '2026-02-19', 'Cash',
  'Laser marking/engraving'),

('purchase', 'Fabrication & Processing',
  'Slotting Work — GDS-001',
  'Balaji Slotting Works',
  3500.00, 0.00, '2026-02-20', 'Cash',
  'Cash — no GST'),

('purchase', 'Fabrication & Processing',
  'Slotting Work — GDS-001',
  'Balaji Slotting Works',
  1800.00, 0.00, '2026-02-21', 'Cash',
  'Cash — no GST'),

('purchase', 'Packaging',
  'Wooden Crate Packing — GDS-001',
  'Mr. Kumar (9884899339)',
  2400.00, 0.00, '2026-02-21', 'Cash',
  'Export-grade wooden crate packing'),

('purchase', 'Fabrication & Processing',
  'Aluminium Copper Brazing — GDS-001',
  'Aluminium Copper Brazing',
  14000.00, 0.00, '2026-02-21', 'Cash',
  'Brazing/joining work'),

('purchase', 'Logistics & Delivery',
  'Courier to Customer — Shree Maruthi Vapi',
  'Shiv Shakti Agency',
  9000.00, 0.00, '2026-02-21', 'NEFT',
  'Courier via Shree Maruthi, Vapi'),

('purchase', 'Fabrication & Processing',
  'Job Work — GDS-001',
  'SJ Enterprises',
  12000.00, 0.00, '2026-02-23', 'NEFT',
  'Job work charges'),

('purchase', 'Logistics & Delivery',
  'Delivery to Customer — Aluminium Cathode (GDS-001)',
  'Delivery',
  800.00, 0.00, '2026-02-24', 'Cash',
  'Last-mile delivery to customer'),

('purchase', 'Logistics & Delivery',
  'Delivery to Customer — Lead Anode (GDS-001)',
  'Delivery',
  10000.00, 0.00, '2026-03-07', 'NEFT',
  'Lead Anode delivery to customer'),

-- ── MARCH 2026 (To Be Paid) ─────────────────────────────────
-- Galena Metals balance invoice — pending payment as of 30 Mar 2026

('purchase', 'Raw Materials',
  'Lead / Alloys — Balance Invoice | GDS-001',
  'Galena Metals Pvt Ltd',
  225915.00, 81329.40, '2026-03-30', 'NEFT',
  'IGST ₹81,329.40 | Total ₹3,07,244.40 — PAYMENT PENDING as of 30 Mar 2026'),

('other', 'Software & Subscriptions',
  'Claude AI Annual Subscription',
  'Anthropic',
  19000.00, 3420.00, '2026-03-29', 'NEFT',
  'CGST ₹1,710 + SGST ₹1,710 | Total ₹22,420'),

('other', 'Logistics & Delivery',
  'Transport — Porter CRN1689013577',
  'Porter',
  274.00, 0.00, '2026-03-30', 'UPI',
  'Porter CRN1689013577'),

('other', 'Labour & Job Work',
  'Labour Charges — Pending',
  'Labour',
  30000.00, 0.00, '2026-03-31', 'NEFT',
  'PAYMENT PENDING | TDS ₹3,000 (10%) to be deducted — net payable ₹27,000');


-- ── SELF SALARY (6 months × ₹1,50,000) ─────────────────────
-- Uncomment and run if you want to record director/proprietor salary
-- For a company: director remuneration is a deductible expense
-- For proprietorship: this is drawings (not tax-deductible but track for management P&L)

-- INSERT INTO expenses (expense_type, category, description, vendor_name, amount, gst_input_credit, expense_date, payment_mode, notes)
-- VALUES ('salary', 'Director Remuneration', 'Director Salary — Oct 2025 to Mar 2026 (6 months)', 'Self', 900000.00, 0.00, '2026-03-31', 'Bank Transfer', '6 months @ ₹1,50,000/month');
