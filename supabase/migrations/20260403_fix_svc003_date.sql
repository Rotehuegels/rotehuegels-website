-- Fix SVC-003 (Bus Bar Bending) order date to 10 Mar 2026
UPDATE orders SET order_date = '2026-03-10' WHERE order_no = 'SVC-003';
