-- Fix SVC-004: SAC code 9983 → 998313, add ™ to AutoREX
UPDATE orders SET
  hsn_sac_code = '998313',
  description  = 'AutoREX™ Implementation — Complimentary with 1-Year Upgradation Support'
WHERE order_no = 'SVC-004';
