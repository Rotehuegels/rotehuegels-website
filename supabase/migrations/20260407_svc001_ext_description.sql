-- Update SVC-001-EXT description to reflect actual scope billed and items waived
-- AutoREX excluded — not being provided currently; available as future paid service
UPDATE orders SET
  description = 'Prolongation Charges — Extended Supervision & Engineering Services (Feb 2026 – Mar 2026); Prolongation Charges — Buffer Period (7 days); Prolongation Charges — Jan 2026 (Waived as Goodwill); Die Charges (Waived); Design & Drafting Charges (Waived)',
  advance_note = 'Supplementary charge raised against original order SVC-001 (Work Order WOIZI00001 dt. 06 Oct 2025). Extension and prolongation of commissioning scope as mutually agreed. AutoREX Process Control Software and related services are not included in this engagement and remain available as a future paid service.'
WHERE order_no = 'SVC-001-EXT';
