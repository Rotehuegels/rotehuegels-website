-- SVC-001: Stage 3 deferred to FY 2026-27
-- Update advance_note on the Stages 1–2 split row (order level note shown on all invoices)
UPDATE orders
SET advance_note = 'This invoice covers Stage 1 (40% Advance) and Stage 2 (40% Against Major Equipment Setup) only. Stage 3 — Water Testing Post Plumbing & Electrical — has been deferred to FY 2026-27. If water testing is completed within April 2026, Stage 3 will be invoiced at ₹2,00,000 + applicable GST (original contract value). If completion extends beyond April 2026, a delay charge of ₹2,50,000 + applicable GST per month will apply on a pro-rata basis for each day of delay, calculated from 1st April 2026, accumulating to ₹2,50,000 for a full month.'
WHERE order_no = 'SVC-001';
