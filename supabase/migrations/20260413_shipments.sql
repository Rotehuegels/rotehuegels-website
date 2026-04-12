-- Shipment tracking
CREATE TABLE IF NOT EXISTS shipments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_no     TEXT NOT NULL,
  carrier         TEXT NOT NULL,                -- ARC, DTDC, DHL, FedEx, BlueDart, etc.
  carrier_url     TEXT,                         -- tracking URL template
  po_id           UUID REFERENCES purchase_orders(id),
  order_id        UUID REFERENCES orders(id),
  supplier_name   TEXT,
  description     TEXT,
  status          TEXT DEFAULT 'in_transit'
                    CHECK (status IN ('booked', 'in_transit', 'out_for_delivery', 'delivered', 'returned')),
  ship_date       DATE,
  expected_date   DATE,
  delivered_date  DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_po ON shipments(po_id);
CREATE TRIGGER shipments_updated_at
  BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
