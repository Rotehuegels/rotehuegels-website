-- ============================================================
-- SVC-001: Fix order_date from placeholder (2025-01-01) to actual
-- Work Order WOIZI00001 dated 06 Oct 2025
-- Project: Zinc Dross Recycling Pilot Plant — India Zinc Inc.
-- ============================================================

UPDATE orders SET
  order_date = '2025-10-06',
  entry_date = '2025-10-06',
  notes      = 'Work Order WOIZI00001 dated 06 Oct 2025. '
               'Project: Zinc Dross Recycling Pilot Plant, India Zinc Inc. '
               'Work start: 07 Oct 2025 | Target completion: 05 Dec 2025 | Buffer: 20 Dec 2025. '
               'Total Man-Days: 75. Delay due to rain; completion extended to 31 Dec 2025 by mutual agreement. '
               'Three-stage payment: 40% at order placement | 40% against major equipment setup | 20% on water testing post plumbing and electrical. '
               'Stage 3 (₹2,00,000 + GST, TDS @ 2% = ₹4,000) pending — scheduled 11 Apr 2026 post commissioning.'
WHERE order_no = 'SVC-001';
