-- Fix PO-2026-001 amendment date: 13 Mar 2026 (drawing V05 issue date), not 07 Apr
UPDATE purchase_orders SET
  amendment_date  = '2026-03-13',
  amendment_notes = 'Amd 01 (13 Mar 2026): Drawing reference updated to ZDP0003 V05 dated 13 Mar 2026; '
                    'bus bar dimensions corrected to 40×16 mm; payment terms revised — '
                    'balance ₹2,25,915 payable against submission of revised CoA and Warranty/QA letter; '
                    'dispatch by supplier only after full payment confirmation.'
WHERE po_no = 'PO-2026-001';
