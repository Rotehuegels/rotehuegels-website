-- ============================================================
-- Seed: M/s India Zinc Inc — CUST-001
-- First customer post incorporation (17 Sep 2025)
-- ============================================================

INSERT INTO customers (
  customer_id,
  name,
  gstin,
  billing_address,
  contact_person,
  email,
  phone,
  state,
  state_code,
  notes
) VALUES (
  'CUST-001',
  'M/s India Zinc Inc',
  '33BZWPS7278C2ZN',
  '{
    "line1":   "No. 224, 1A/1B/1A, 1st Floor, Venkiteshwara Nagar",
    "line2":   "Vadaperumbakkam, Puzhal Village, Madhavaram",
    "city":    "Chennai",
    "state":   "Tamil Nadu",
    "pincode": "600060"
  }'::jsonb,
  'Mr. Sabare Alam, Director & CEO',
  'sabare729@gmail.com',
  '+91-9840830750',
  'Tamil Nadu',
  '33',
  'First customer post incorporation. Intra-state supply (Tamil Nadu). PAN to be updated.'
);
