-- Fix client name to use proper "M/s" prefix for all India Zinc orders
UPDATE orders
SET client_name = 'M/s India Zinc Inc'
WHERE order_no IN ('SVC-001', 'SVC-002', 'SVC-004', 'GDS-001', 'GDS-002', 'GDS-003');
