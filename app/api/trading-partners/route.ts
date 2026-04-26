export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { sendRegistrationConfirmation } from '@/lib/registrationEmails';

const Schema = z.object({
  company_name:    z.string().min(2),
  contact_person:  z.string().min(2),
  email:           z.string().email(),
  phone:           z.string().optional(),
  website:         z.string().optional(),
  country:         z.string().default('India'),
  gstin:           z.string().optional(),
  pan:             z.string().optional(),
  tax_id:          z.string().optional(),
  business_type:   z.string().optional(),
  commodities:     z.array(z.string()).min(1, 'Select at least one commodity'),
  trade_type:      z.enum(['seller', 'buyer', 'both']).default('seller'),
  typical_volume:  z.string().optional(),
  origin_countries: z.array(z.string()).optional(),
  certifications:  z.string().optional(),
  terms_accepted:  z.literal(true, { message: 'You must accept the terms' }),
  notes:           z.string().optional(),
});

export async function GET() {
  // Admin: list all trading partners — auth-gated (route is in PUBLIC_API for public POST)
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('trading_partners')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(ip, 3, 15 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: 'Too many submissions.' }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const d = parsed.data;

  // Duplicate check
  const { data: existing } = await supabaseAdmin
    .from('trading_partners').select('id').eq('email', d.email).not('status', 'eq', 'rejected').limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'A registration with this email already exists.' }, { status: 409 });
  }

  // Random 8-char alphanumeric reference (doesn't reveal sequence)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const regNo = `TP-${rand}`;

  const { data, error } = await supabaseAdmin
    .from('trading_partners')
    .insert({
      reg_no: regNo,
      company_name: d.company_name,
      contact_person: d.contact_person,
      email: d.email,
      phone: d.phone || null,
      website: d.website || null,
      country: d.country,
      gstin: d.gstin || null,
      pan: d.pan || null,
      tax_id: d.tax_id || null,
      business_type: d.business_type || null,
      commodities: d.commodities,
      trade_type: d.trade_type,
      typical_volume: d.typical_volume || null,
      origin_countries: d.origin_countries || [],
      certifications: d.certifications || null,
      terms_accepted: true,
      notes: d.notes || null,
    })
    .select('reg_no')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to save.' }, { status: 500 });

  // Send confirmation email (non-blocking)
  sendRegistrationConfirmation({
    to: d.email,
    companyName: d.company_name,
    contactPerson: d.contact_person,
    refNo: data.reg_no,
    type: 'trading_partner',
  });

  return NextResponse.json({ success: true, reg_no: data.reg_no }, { status: 201 });
}
