CREATE TABLE IF NOT EXISTS supplier_registrations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name      text NOT NULL,
  contact_person    text NOT NULL,
  email             text NOT NULL,
  phone             text,
  city              text,
  state             text,
  gstin             text,
  pan               text,
  categories        text[] NOT NULL DEFAULT '{}',
  certifications    text,
  notes             text,
  status            text NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  rejection_reason  text,
  reviewed_at       timestamptz,
  created_at        timestamptz DEFAULT now()
);
