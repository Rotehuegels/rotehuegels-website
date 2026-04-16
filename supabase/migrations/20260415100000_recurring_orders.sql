-- ── Recurring Orders ─────────────────────────────────────────────────────────
-- Templates for orders that repeat on a schedule (monthly retainers, etc.)
CREATE TABLE IF NOT EXISTS recurring_order_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_gstin TEXT,
  client_pan TEXT,
  client_address TEXT,
  client_contact TEXT,
  order_type TEXT NOT NULL DEFAULT 'service' CHECK (order_type IN ('goods', 'service')),
  description TEXT,
  items JSONB,                            -- same format as orders.items
  base_value NUMERIC NOT NULL DEFAULT 0,
  gst_rate NUMERIC DEFAULT 18,
  total_value NUMERIC NOT NULL DEFAULT 0,
  hsn_sac_code TEXT,
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  next_run_date DATE NOT NULL,
  last_run_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_generate BOOLEAN NOT NULL DEFAULT false,  -- if true, auto-creates order on next_run_date
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE recurring_order_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_recurring" ON recurring_order_templates FOR ALL USING (true) WITH CHECK (true);
