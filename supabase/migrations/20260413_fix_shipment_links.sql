-- Link ARC shipment to GDS-001 order (India Zinc) and remove text supplier_name
UPDATE shipments
SET
  order_id = (SELECT id FROM orders WHERE order_no = 'GDS-001' LIMIT 1),
  supplier_name = NULL,
  description = 'High Purity Lead Anodes (12 NOS)'
WHERE tracking_no = 'B4002064885';
