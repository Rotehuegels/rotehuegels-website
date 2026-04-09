-- SVC-001: Stage 3 deferred to FY 2026-27
-- Update advance_note on the Stages 1–2 split row (order level note shown on all invoices)
UPDATE orders
SET advance_note = 'This invoice covers Stage 1 (40% Advance) and Stage 2 (40% Against Major Equipment Setup) only. Stage 3 — 20% on Water Testing Post Plumbing & Electrical (₹2,00,000 + GST) has been deferred to FY 2026-27 and will be invoiced upon completion. Note: As per contract terms, any delay in Stage 3 completion beyond the agreed schedule will attract a penalty of ₹2,50,000 + applicable GST per month.'
WHERE order_no = 'SVC-001';
