-- Gold jewellery holdings
create table if not exists gold_jewellery (
  id               uuid primary key default gen_random_uuid(),
  purchase_date    date          not null,
  owner            text          not null,  -- 'Sivakumar' | 'Arrthe'
  item_name        text          not null,
  grams_22k        numeric(10,3) not null,  -- weight in 22K grams
  gold_rate_22k    numeric(10,2) not null,  -- purchase 22K rate per gram
  making_charges   numeric(12,2) not null default 0,
  purchase_value   numeric(12,2) not null,  -- total paid (gold + MC + VAT)
  created_at       timestamptz   default now()
);

-- Sivakumar's holdings (247.745g, ₹19,46,643.51)
insert into gold_jewellery (purchase_date, owner, item_name, grams_22k, gold_rate_22k, making_charges, purchase_value) values
  ('2019-01-12', 'Sivakumar', 'Jumka',       16.264, 3286.00, 13163.50,  66607.00),
  ('2024-02-15', 'Sivakumar', 'Gold Coins',  10.008, 5700.00,  2889.40,  59935.00),
  ('2024-02-15', 'Sivakumar', 'Gold Coins',  20.033, 5700.00,  5773.90, 119962.00),
  ('2024-02-15', 'Sivakumar', 'Gold Coins',  20.012, 5700.00,  5769.60, 119838.00),
  ('2024-02-15', 'Sivakumar', 'Chain',       54.952, 5690.00, 27153.12, 339830.00),
  ('2025-06-25', 'Sivakumar', 'Chain',       56.148, 9070.00, 41501.15, 550763.51),
  ('2025-06-27', 'Sivakumar', 'Chain',       70.328, 9025.00, 54997.80, 689708.00);

-- Arrthe's holdings (144.972g, ₹9,47,181.33)
insert into gold_jewellery (purchase_date, owner, item_name, grams_22k, gold_rate_22k, making_charges, purchase_value) values
  ('2020-01-10', 'Arrthe', 'Necklace',                  21.484, 4109.00, 14514.18, 102791.94),
  ('2020-07-29', 'Arrthe', 'Chain, Ring & Drop Earring',16.386, 5230.00, 14140.22,  99839.00),
  ('2021-03-08', 'Arrthe', 'Bangles & Bracelet',        31.592, 4401.00, 30713.80, 169750.19),
  ('2021-12-11', 'Arrthe', 'Drop Earrings',              2.400, 4671.00,  2941.25,  14151.65),
  ('2023-02-14', 'Arrthe', 'Bangles',                   22.353, 5265.00, 12258.43, 129946.97),
  ('2023-02-14', 'Arrthe', 'Drop Earrings',              3.948, 5265.00,  5012.60,  25798.82),
  ('2025-01-16', 'Arrthe', 'Chain',                     24.889, 7430.00, 26309.49, 211234.76),
  ('2025-01-16', 'Arrthe', 'Jumka',                      7.019, 7430.00, 12237.95,  64389.12),
  ('2025-01-16', 'Arrthe', 'Baby Chain',                14.901, 7430.00, 18564.45, 129278.88);
