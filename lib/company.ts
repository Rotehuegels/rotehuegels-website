// lib/company.ts
// Centralized company settings loader with in-memory cache.
// Every page / API that needs company details should use getCompanySettings().

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface CompanySettings {
  name: string;
  short_name: string;
  address_line1: string;
  address_line2: string;
  cin: string;
  gstin: string;
  pan: string;
  tan: string;
  email: string;
  procurement_email: string;
  noreply_email: string;
  phone: string;
  website: string;
  bank_name: string;
  bank_account: string;
  bank_ifsc: string;
  bank_branch: string;
  upi_id: string;
  fy_start_month: number;
}

// ── In-memory cache (5 min TTL) ────────────────────────────────────────────
let cached: CompanySettings | null = null;
let cachedAt = 0;
const TTL = 5 * 60 * 1000; // 5 minutes

export async function getCompanySettings(): Promise<CompanySettings> {
  if (cached && Date.now() - cachedAt < TTL) return cached;

  const { data, error } = await supabaseAdmin
    .from('company_settings')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) {
    // Fallback so the app doesn't crash if DB is empty
    return FALLBACK;
  }

  cached = data as CompanySettings;
  cachedAt = Date.now();
  return cached;
}

/** Bust the cache after a settings update */
export function invalidateCompanyCache() {
  cached = null;
  cachedAt = 0;
}

/**
 * Returns a CO object matching the shape used across invoices, reports, and emails.
 * Drop-in replacement for the hardcoded `const CO = { ... }` blocks.
 */
export async function getCompanyCO() {
  const s = await getCompanySettings();
  return {
    name:  s.name,
    addr1: s.address_line1,
    addr2: s.address_line2,
    cin:   s.cin,
    gstin: s.gstin,
    pan:   s.pan,
    tan:   s.tan,
    email: s.email,
    procurementEmail: s.procurement_email,
    phone: s.phone,
    web:   s.website,
    bank:  s.bank_name,
    acc:   s.bank_account,
    ifsc:  s.bank_ifsc,
    upi:   s.upi_id,
    // aliases used in notifications.ts
    bankName:    s.bank_name,
    bankAccount: s.bank_account,
    bankIfsc:    s.bank_ifsc,
    bankBranch:  s.bank_branch,
  };
}

// ── Fallback (same as current hardcoded values) ────────────────────────────
const FALLBACK: CompanySettings = {
  name: 'Rotehuegel Research Business Consultancy Private Limited',
  short_name: 'Rotehügels',
  address_line1: 'No. 1/584, 7th Street, Jothi Nagar, Padianallur,',
  address_line2: 'Near Gangaiamman Kovil, Redhills, Chennai – 600052, Tamil Nadu, India',
  cin: 'U70200TN2025PTC184573',
  gstin: '33AAPCR0554G1ZE',
  pan: 'AAPCR0554G',
  tan: 'CHER28694B',
  email: 'sales@rotehuegels.com',
  procurement_email: 'procurements@rotehuegels.com',
  noreply_email: 'noreply@rotehuegels.com',
  phone: '+91-90044 91275',
  website: 'www.rotehuegels.com',
  bank_name: 'State Bank of India, Padianallur Branch',
  bank_account: '44512115640',
  bank_ifsc: 'SBIN0014160',
  bank_branch: 'Padianallur',
  upi_id: 'rotehuegels@sbi',
  fy_start_month: 4,
};
