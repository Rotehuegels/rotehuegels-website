-- Client-facing delivery updates (generic, no supplier/carrier info)
CREATE TABLE IF NOT EXISTS delivery_updates (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  shipment_id     UUID REFERENCES shipments(id),   -- internal link (not exposed)
  title           TEXT NOT NULL,                     -- "Equipment dispatched"
  description     TEXT,                              -- "Your order has been dispatched from our warehouse"
  status          TEXT NOT NULL DEFAULT 'dispatched'
                    CHECK (status IN ('processing', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered')),
  expected_date   DATE,
  delivered_date  DATE,
  visible_to_client BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_delivery_updates_project ON delivery_updates(project_id);
