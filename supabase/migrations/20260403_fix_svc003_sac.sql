-- Fix SVC-003 SAC code: 9988 → 998871
-- Fabricated metal product manufacturing services (bus bar bending, drilling, fabrication)
UPDATE orders SET hsn_sac_code = '998871' WHERE order_no = 'SVC-003';
