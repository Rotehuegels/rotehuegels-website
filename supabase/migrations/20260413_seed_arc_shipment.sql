-- Seed first shipment: Lead Anodes from Galena Metals (Vapi) via ARC
INSERT INTO shipments (
  tracking_no, carrier, carrier_url,
  po_id, supplier_name, description,
  status, ship_date, expected_date, notes
) VALUES (
  'B4002064885',
  'ARC',
  'https://online.arclimited.com/cnstrk/cnstrk.aspx',
  (SELECT id FROM purchase_orders WHERE po_no = 'PO-2026-001' LIMIT 1),
  'Galena Metals Pvt. Ltd., Vapi',
  'High Purity Lead Anodes (12 NOS) for India Zinc — GDS-001',
  'in_transit',
  '2026-04-11',
  '2026-04-15',
  'ARC consignment from Vapi, Gujarat to Chennai. For M/s India Zinc zinc refinery project.'
)
ON CONFLICT DO NOTHING;
