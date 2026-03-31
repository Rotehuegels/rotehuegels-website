-- ============================================================
-- Rotehügels — Supplier Seed (FY 2025-26 vendors)
-- Sourced from expense records. GSTINs to be added via UI lookup.
-- Run AFTER 20260331_suppliers_hsn.sql
-- ============================================================

INSERT INTO suppliers (
  legal_name, trade_name, entity_type,
  gst_status, state, notes
) VALUES

-- ── PROFESSIONAL & SOFTWARE ─────────────────────────────────

('Sraddhaa Advisory Private Limited',
  NULL, 'Private Limited Company',
  'Active', 'Tamil Nadu',
  'Advisory services — Nov 2025. CGST+SGST charged (intra-state TN). Add GSTIN via lookup.'),

('Tally Solutions Private Limited',
  'TallyPrime', 'Private Limited Company',
  'Active', 'Karnataka',
  'TallyPrime Silver + Cloud Access — Feb 2026. Add GSTIN via lookup.'),

('Anthropic',
  'Claude AI', 'Foreign Entity',
  'Not Registered', 'USA',
  'Claude AI Annual Subscription — Mar 2026. Foreign entity, no Indian GSTIN. CGST+SGST charged under RCM or import of services.'),

-- ── RAW MATERIALS — INTRA-STATE (Tamil Nadu) ────────────────

('Shree Padmavati Metal & Alloys',
  NULL, 'Proprietorship / Partnership',
  'Active', 'Tamil Nadu',
  'Metal & Alloys supply for GDS-001 — Feb 2026. CGST+SGST charged. Add GSTIN via lookup.'),

('Sharp Industries',
  NULL, 'Proprietorship / Partnership',
  'Active', 'Tamil Nadu',
  'Materials for GDS-001 — multiple invoices Feb 2026. CGST+SGST charged. Add GSTIN via lookup.'),

('Tamiinad Aluminium Company',
  NULL, 'Proprietorship / Partnership',
  'Active', 'Tamil Nadu',
  'High Purity Aluminium — 2 invoices Feb 2026. CGST+SGST charged. Add GSTIN via lookup.'),

('Virwadia Metal & Alloys',
  NULL, 'Proprietorship / Partnership',
  'Active', 'Tamil Nadu',
  'Metal & Alloys for GDS-001 — Feb 2026. CGST+SGST charged. Add GSTIN via lookup.'),

('Chennai Plastics Insulations',
  NULL, 'Proprietorship / Partnership',
  'Active', 'Tamil Nadu',
  'Plastic Insulations for GDS-001 — Feb 2026. CGST+SGST charged. Add GSTIN via lookup.'),

('Metal Source',
  NULL, 'Proprietorship / Partnership',
  'Active', 'Tamil Nadu',
  'Lead & Alloys for GDS-001 — ₹1,32,742 Feb 2026. CGST+SGST charged. Add GSTIN via lookup.'),

-- ── RAW MATERIALS — INTER-STATE ─────────────────────────────

('Galena Metals Private Limited',
  NULL, 'Private Limited Company',
  'Active', NULL,
  'Lead / Alloys — Advance ₹84,000 (Feb 2026) + Balance ₹3,07,244 (pending). IGST charged — inter-state supply. Add GSTIN via lookup to confirm state.'),

-- ── FABRICATION & JOB WORK ──────────────────────────────────

('SVK Fabricators',
  NULL, 'Proprietorship',
  'Not Registered', 'Tamil Nadu',
  'Fabrication work for GDS-001 — cash payments, no GST. Likely unregistered small vendor.'),

('Balaji Slotting Works',
  NULL, 'Proprietorship',
  'Not Registered', 'Tamil Nadu',
  'Slotting job work for GDS-001 — multiple cash payments. Likely unregistered small vendor.'),

('SJ Enterprises',
  NULL, 'Proprietorship / Partnership',
  'Not Registered', 'Tamil Nadu',
  'Job work for GDS-001 — ₹12,000 NEFT Feb 2026. No GST on invoice.'),

-- ── LOGISTICS & COURIER ─────────────────────────────────────

('Porter Technologies Private Limited',
  'Porter', 'Private Limited Company',
  'Active', 'Karnataka',
  'On-demand logistics / delivery app. Multiple CRN trips. No GST on Porter invoices (exempt threshold). Add GSTIN via lookup if needed.'),

('Shiv Shakti Agency',
  'Shree Maruthi Vapi', 'Proprietorship',
  'Not Registered', 'Gujarat',
  'Courier to customer via Shree Maruthi Vapi — ₹9,000 Feb 2026. No GST on invoice.'),

('MSS Ambattur',
  NULL, 'Proprietorship',
  'Not Registered', 'Tamil Nadu',
  'Delivery / logistics — ₹2,300 cash Feb 2026. No GST on invoice.'),

-- ── CONFERENCE & TRAINING ───────────────────────────────────

('National Metallurgical Laboratory',
  'NML', 'Government Research Institute',
  'Active', 'Jharkhand',
  'CRITMET 2025 conference registration — ₹11,800 Nov 2025. IGST charged (inter-state, Jharkhand). Add GSTIN via lookup.'),

-- ── SPONSORSHIP ─────────────────────────────────────────────

('Society of Materials Science Engineers, College of Engineering Guindy',
  'SMSE CEG', 'College Society',
  'Not Registered', 'Tamil Nadu',
  'Crysta 2025 sponsorship — ₹20,000 NEFT Oct 2025. College society, no GSTIN. A/c: 31098322208.');
