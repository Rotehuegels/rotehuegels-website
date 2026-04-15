-- ── E-Waste Collection Platform ──────────────────────────────────────────────
-- Rotehügels acts as intermediary between e-waste generators and recyclers.
-- Waste goes directly from generator to recycler — we facilitate and track.

-- ── E-Waste Categories ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ewaste_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,                          -- lucide icon name
  unit TEXT DEFAULT 'kg',             -- kg, units, pieces
  min_quantity NUMERIC DEFAULT 1,     -- minimum qty for pickup
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed common e-waste categories
INSERT INTO ewaste_categories (name, description, icon, unit, min_quantity, sort_order) VALUES
  ('Computers & Laptops', 'Desktops, laptops, servers, workstations', 'Monitor', 'units', 1, 1),
  ('Mobile Phones & Tablets', 'Smartphones, tablets, feature phones', 'Smartphone', 'units', 5, 2),
  ('Batteries', 'Li-ion, lead-acid, NiMH, button cells', 'Battery', 'kg', 5, 3),
  ('Monitors & Displays', 'CRT, LCD, LED monitors, TVs', 'MonitorSmartphone', 'units', 1, 4),
  ('Printers & Peripherals', 'Printers, scanners, keyboards, mice', 'Printer', 'units', 1, 5),
  ('Cables & Wiring', 'Power cables, data cables, ethernet, copper wiring', 'Cable', 'kg', 5, 6),
  ('PCBs & Circuit Boards', 'Printed circuit boards, motherboards, RAM', 'Cpu', 'kg', 2, 7),
  ('UPS & Power Supply', 'UPS units, SMPS, power adapters', 'Zap', 'units', 1, 8),
  ('Networking Equipment', 'Routers, switches, modems, access points', 'Wifi', 'units', 3, 9),
  ('Home Appliances', 'Washing machines, refrigerators, ACs, microwaves', 'Home', 'units', 1, 10),
  ('Medical Equipment', 'Diagnostic devices, lab instruments, imaging', 'Stethoscope', 'units', 1, 11),
  ('Industrial Electronics', 'PLCs, drives, sensors, control panels', 'Factory', 'kg', 10, 12),
  ('Solar Panels & Inverters', 'PV modules, solar inverters, charge controllers', 'Sun', 'units', 1, 13),
  ('Black Mass / Battery Waste', 'Shredded battery material, cathode/anode powder', 'FlaskConical', 'kg', 50, 14)
ON CONFLICT (name) DO NOTHING;

-- ── Registered Recyclers ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ewaste_recyclers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recycler_code TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  gstin TEXT,
  cpcb_registration TEXT,             -- Central Pollution Control Board reg number
  spcb_registration TEXT,             -- State Pollution Control Board reg number
  license_valid_until DATE,
  capabilities TEXT[],                -- array of category names they handle
  capacity_per_month TEXT,            -- e.g., "500 MT/month"
  service_radius_km INT DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  rating NUMERIC DEFAULT 0,           -- average rating (0-5)
  total_collections INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Collection Requests ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ewaste_collection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_no TEXT UNIQUE NOT NULL,    -- EW-YYYYMMDD-XXXX

  -- Generator (person/company requesting pickup)
  generator_name TEXT NOT NULL,
  generator_email TEXT NOT NULL,
  generator_phone TEXT NOT NULL,
  generator_company TEXT,
  generator_address TEXT NOT NULL,
  generator_city TEXT NOT NULL,
  generator_state TEXT DEFAULT 'Tamil Nadu',
  generator_pincode TEXT,
  generator_type TEXT DEFAULT 'individual' CHECK (generator_type IN ('individual', 'business', 'institution', 'government')),

  -- Collection details
  preferred_date DATE,
  preferred_time_slot TEXT,           -- 'morning', 'afternoon', 'evening'
  access_instructions TEXT,           -- gate code, floor, etc.

  -- Assignment
  recycler_id UUID REFERENCES ewaste_recyclers(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  scheduled_date DATE,

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted',     -- user submitted request
    'reviewing',     -- admin reviewing
    'assigned',      -- assigned to recycler
    'scheduled',     -- recycler confirmed pickup date
    'in_transit',    -- pickup vehicle en route
    'collected',     -- waste collected from generator
    'processing',    -- recycler processing waste
    'completed',     -- fully processed, certificate issued
    'cancelled'      -- cancelled by user or admin
  )),

  -- Tracking
  estimated_weight_kg NUMERIC,
  actual_weight_kg NUMERIC,
  collection_proof_url TEXT,          -- photo of collection
  processing_certificate_url TEXT,    -- recycling certificate

  -- Financials
  estimated_value NUMERIC DEFAULT 0,  -- estimated scrap value
  actual_value NUMERIC DEFAULT 0,
  payment_to_generator NUMERIC DEFAULT 0,  -- if we pay for valuable waste
  commission NUMERIC DEFAULT 0,       -- our intermediary fee

  -- Meta
  source TEXT DEFAULT 'website',      -- website, app, phone, referral
  notes TEXT,
  admin_notes TEXT,
  cancelled_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Collection Request Items ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ewaste_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES ewaste_collection_requests(id) ON DELETE CASCADE,
  category_id UUID REFERENCES ewaste_categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL,
  description TEXT,                   -- "5 old Dell laptops, 2017 model"
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'units',
  estimated_weight_kg NUMERIC,
  condition TEXT DEFAULT 'non_working' CHECK (condition IN ('working', 'partially_working', 'non_working', 'damaged', 'unknown')),
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Collection Activity Log ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ewaste_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES ewaste_collection_requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL,               -- status_change, note, assignment, etc.
  old_value TEXT,
  new_value TEXT,
  performed_by TEXT,                  -- email or 'system'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ewaste_requests_status ON ewaste_collection_requests(status);
CREATE INDEX IF NOT EXISTS idx_ewaste_requests_recycler ON ewaste_collection_requests(recycler_id);
CREATE INDEX IF NOT EXISTS idx_ewaste_requests_city ON ewaste_collection_requests(generator_city);
CREATE INDEX IF NOT EXISTS idx_ewaste_items_request ON ewaste_collection_items(request_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE ewaste_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ewaste_recyclers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ewaste_collection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ewaste_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ewaste_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_ewaste_categories" ON ewaste_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_ewaste_recyclers" ON ewaste_recyclers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_ewaste_requests" ON ewaste_collection_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_ewaste_items" ON ewaste_collection_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_ewaste_log" ON ewaste_activity_log FOR ALL USING (true) WITH CHECK (true);
