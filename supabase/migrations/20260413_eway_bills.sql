-- E-way Bills — mandatory for goods movement >₹50,000
CREATE TABLE IF NOT EXISTS eway_bills (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  eway_bill_no      TEXT UNIQUE,                   -- 12-digit from NIC portal (null if not yet generated)

  -- Links
  order_id          UUID REFERENCES orders(id),
  shipment_id       UUID REFERENCES shipments(id),

  -- Document details
  doc_type          TEXT NOT NULL DEFAULT 'INV',    -- INV, BIL, BOE, CHL (delivery challan)
  doc_no            TEXT NOT NULL,                  -- invoice/bill number
  doc_date          DATE NOT NULL,
  supply_type       TEXT NOT NULL DEFAULT 'outward', -- outward, inward
  sub_supply_type   TEXT DEFAULT 'supply',          -- supply, export, job_work, own_use, sales_return
  transaction_type  TEXT DEFAULT 'regular',          -- regular, deemed_export, sez

  -- Consignor (From)
  from_gstin        TEXT NOT NULL,
  from_name         TEXT NOT NULL,
  from_address      TEXT NOT NULL,
  from_place        TEXT NOT NULL,
  from_pincode      TEXT NOT NULL,
  from_state_code   TEXT NOT NULL,

  -- Consignee (To)
  to_gstin          TEXT,
  to_name           TEXT NOT NULL,
  to_address        TEXT NOT NULL,
  to_place          TEXT NOT NULL,
  to_pincode        TEXT NOT NULL,
  to_state_code     TEXT NOT NULL,

  -- Goods details
  hsn_code          TEXT NOT NULL,
  description       TEXT,
  quantity          NUMERIC,
  unit              TEXT,
  taxable_value     NUMERIC NOT NULL,
  cgst_amount       NUMERIC DEFAULT 0,
  sgst_amount       NUMERIC DEFAULT 0,
  igst_amount       NUMERIC DEFAULT 0,
  cess_amount       NUMERIC DEFAULT 0,
  total_value       NUMERIC NOT NULL,

  -- Transport details (Part B)
  transport_mode    TEXT DEFAULT 'road',            -- road, rail, air, ship
  vehicle_no        TEXT,
  vehicle_type      TEXT,                           -- regular, ODC (over dimensional cargo)
  transporter_name  TEXT,
  transporter_id    TEXT,                           -- transporter GSTIN
  trans_doc_no      TEXT,                           -- LR/GR/RR number
  trans_doc_date    DATE,
  distance_km       INT,

  -- Status
  status            TEXT DEFAULT 'draft'
                      CHECK (status IN ('draft', 'generated', 'cancelled', 'expired')),
  valid_upto        TIMESTAMPTZ,
  generated_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  cancel_reason     TEXT,

  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eway_bills_status ON eway_bills(status);
CREATE INDEX IF NOT EXISTS idx_eway_bills_order ON eway_bills(order_id);
