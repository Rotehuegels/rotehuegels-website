-- ============================================================
-- QT-2026-003: re-format notes & terms as bullet lists.
-- PDF render logic turns paragraphs whose lines all start with
-- "- " into native pdfmake bullet lists; other paragraphs stay
-- as justified prose. Leading prose paragraph is kept as the
-- summary, then bullet paragraphs split out deliveries +
-- lead-times etc.
-- ============================================================

UPDATE quotes
SET
  notes = E'Replacement of the Rotameter supplied under GDS-003 to 0-250 LPH scale. The original 0-6000 LPH / 100 LPM unit was oversized for the dosing pump flow range (0-250 LPH max).\n\n'
       || E'Scope covered by this quote:\n'
       || E'- 1 No differential charge for the replacement rotameter (Item 1)\n'
       || E'- 2 Nos fresh rotameters of the same new spec (Item 2)\n'
       || E'- 1 No PP Sheet 20 mm (30% disc on MRP ₹14,000) (Item 3)\n'
       || E'- 1 day on-site T&P Sensor Installation (Item 4)\n'
       || E'- Acid Proof Tiles ₹1,00,000 lot for the ground floor below the 1st floor mezzanine (Item 5)\n'
       || E'- Rubber 3 mm Electrical Insulation supply & layering, 5 rolls @ ₹14,700/roll composite (material ₹11,700/roll + layering ₹3,000/roll) for the 1st floor mezzanine (Item 6)\n\n'
       || E'Door delivery (shown separately per consignment to Madhavaram, Chennai):\n'
       || E'- ₹1,000 — Instrumentation (Item 7)\n'
       || E'- ₹500 — PP Sheet (Item 8)\n'
       || E'- ₹2,000 — Acid Proof Tiles (Item 9)\n'
       || E'- ₹2,000 — Rubber Rolls for Electrical Insulation 3 mm (Item 10)\n\n'
       || E'Lead times:\n'
       || E'- T&P Sensor Installation (Item 4) — next day of order placement\n'
       || E'- PP Sheet + PP Sheet delivery (Items 3, 8) — 1 day (by Tue 21 Apr 2026 if ordered today)\n'
       || E'- All other new items — by Fri 24 Apr 2026\n'
       || E'- Item 11 already delivered\n\n'
       || E'Pending from earlier consignments:\n'
       || E'- Item 11: ₹3,000 pending door delivery charges carried over from earlier GDS-003 consignments (Float & Scale, T&P Sensors, Rotameter) that were not billed on the original invoice',

  terms = E'- Prices are exclusive of GST. GST @ 18% (CGST 9% + SGST 9%) applicable.\n'
       || E'- Door delivery to India Zinc site, Madhavaram, Chennai is included (refer per-consignment breakdown in Notes, Items 7–10).\n'
       || E'- Lead times: T&P Sensor Installation (Item 4) → next day of order placement; PP Sheet and its delivery → 1 day (by Tue 21 Apr 2026 if ordered today); all other items → by Fri 24 Apr 2026.\n'
       || E'- Payment: 100% advance before dispatch. Kindly reference Quote No. QT-2026-003 in the transaction remarks.\n'
       || E'- Payment channels: UPI (scan QR or use rotehuegels@sbi) / NEFT / RTGS / IMPS using the bank details below.\n'
       || E'- Validity: 1 day only (valid until Tue 21 Apr 2026).'
WHERE quote_no = 'QT-2026-003';
