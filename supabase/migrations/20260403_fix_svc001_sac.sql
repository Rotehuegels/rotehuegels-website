-- Fix SVC-001 SAC code: 9983 → 998313
-- Engineering services for industrial and manufacturing projects
UPDATE orders SET hsn_sac_code = '998313' WHERE order_no = 'SVC-001';
