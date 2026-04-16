-- Jain Recycling (Chennai) + HydroMet (Kanchipuram) update
-- These are metal/hazardous waste recyclers not in CPCB e-waste list

UPDATE ewaste_recyclers SET
  email = 'info@hydrometindia.com', phone = '04427301397',
  address = 'Vedal Village, Rajakulam Post, Kancheepuram D.T-631 561',
  city = 'Kanchipuram', website = 'https://www.hydrometindia.com',
  notes = 'Non-ferrous metal recycler since 1997. Produces: copper ingots, zinc oxide, zinc ingots, nickel cathodes, ferro alloys, cobalt concentrates.'
WHERE recycler_code = 'MRAI-TN-007';

INSERT INTO ewaste_recyclers (recycler_code, company_name, contact_person, email, phone, address, city, state, waste_type, facility_type, website, notes, is_active, is_verified, verified_at) VALUES
('METAL-TN-001', 'Jain Resource Recycling Limited', 'Registered Facility', 'Info@jainmetalgroup.com', '04443409494', 'The Lattice, Old no 7/1, New No 20, 4th Floor, Kilpauk', 'Chennai', 'Tamil Nadu', 'hazardous', 'recycler', 'https://www.jainmetalgroup.com', 'Non-ferrous metal recycler: copper, lead, aluminium alloys.', true, true, now()),
('METAL-TN-002', 'Jain Recycling Private Limited', 'Registered Facility', 'jainrecycling@gmail.com', NULL, 'Old No. 7/1, New No 20, 4th Floor, Waddels Road, Kilpauk', 'Chennai', 'Tamil Nadu', 'hazardous', 'recycler', NULL, 'PP granules, plastic recycling.', true, true, now())
ON CONFLICT (recycler_code) DO NOTHING;
