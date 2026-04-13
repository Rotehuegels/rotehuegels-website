-- Credit Notes & Debit Notes — GST-compliant adjustments
CREATE TABLE IF NOT EXISTS credit_debit_notes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_type       TEXT NOT NULL CHECK (note_type IN ('credit', 'debit')),
  note_no         TEXT UNIQUE NOT NULL,            -- CN-001, DN-001
  note_date       DATE NOT NULL,
  order_id        UUID REFERENCES orders(id),
  original_invoice TEXT,                           -- original invoice number

  -- Party
  party_name      TEXT NOT NULL,
  party_gstin     TEXT,
  party_address   TEXT,

  -- Financial
  reason          TEXT NOT NULL,                   -- "Rate difference", "Goods returned", "Discount"
  taxable_value   NUMERIC NOT NULL,
  gst_rate        NUMERIC DEFAULT 18,
  cgst_amount     NUMERIC DEFAULT 0,
  sgst_amount     NUMERIC DEFAULT 0,
  igst_amount     NUMERIC DEFAULT 0,
  total_value     NUMERIC NOT NULL,
  hsn_code        TEXT,

  -- Status
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'cancelled')),

  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cdn_type ON credit_debit_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_cdn_order ON credit_debit_notes(order_id);

-- Payment Receipts
CREATE TABLE IF NOT EXISTS payment_receipts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_no      TEXT UNIQUE NOT NULL,            -- RCP-001
  receipt_date    DATE NOT NULL,
  order_id        UUID REFERENCES orders(id),
  payment_id      UUID REFERENCES order_payments(id),

  -- Party
  received_from   TEXT NOT NULL,
  party_gstin     TEXT,

  -- Payment
  amount          NUMERIC NOT NULL,
  payment_mode    TEXT,                            -- Cash, UPI, NEFT, Cheque
  reference_no    TEXT,                            -- UTR, cheque no, UPI ref
  bank_name       TEXT,

  -- Status
  status          TEXT DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'cancelled')),

  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_order ON payment_receipts(order_id);
