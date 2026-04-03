-- Fix SVC-002 SAC code: 9954 → 995452
-- Water plumbing and drain laying services including repair and maintenance
UPDATE orders SET hsn_sac_code = '995452' WHERE order_no = 'SVC-002';
