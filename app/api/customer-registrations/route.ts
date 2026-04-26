export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const Schema = z.object({
  company_name:   z.string().min(2),
  contact_person: z.string().min(2),
  email:          z.string().email(),
  phone:          z.string().optional(),
  website:        z.string().optional(),
  country:        z.string().default('India'),
  gstin:          z.string().optional(),
  pan:            z.string().optional(),
  tax_id:         z.string().optional(),
  business_type:  z.string().optional(),
  industry:       z.string().optional(),
  billing_address: z.object({
    line1:   z.string().min(1),
    line2:   z.string().optional(),
    city:    z.string().min(1),
    state:   z.string().min(1),
    pincode: z.string().optional(),
    country: z.string().optional(),
  }),
  shipping_address: z.object({
    line1: z.string(), line2: z.string().optional(),
    city: z.string(), state: z.string(), pincode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  terms_accepted: z.literal(true, { message: 'You must accept the terms' }),
  source:         z.string().optional(),
  notes:          z.string().optional(),
});

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function GET() {
  // Admin: list all registrations — auth-gated (route is in PUBLIC_API for public POST)
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('customer_registrations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed, resetAt } = rateLimit(ip, 3, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const d = parsed.data;

  // KYC check: Indian customers need GSTIN or PAN, international need tax_id
  const isIndia = !d.country || d.country === 'India';
  if (isIndia && !d.gstin && !d.pan) {
    return NextResponse.json({ error: 'Either GSTIN or PAN is required for Indian customers.' }, { status: 400 });
  }
  if (!isIndia && !d.tax_id) {
    return NextResponse.json({ error: 'Tax ID (VAT/EIN/TIN) is required for international customers.' }, { status: 400 });
  }

  // Duplicate check by email
  const { data: existing } = await supabaseAdmin
    .from('customer_registrations')
    .select('id')
    .eq('email', d.email)
    .not('status', 'eq', 'rejected')
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'A registration with this email already exists.' }, { status: 409 });
  }

  // Duplicate check by GSTIN
  if (d.gstin) {
    const { data: gstinExists } = await supabaseAdmin
      .from('customer_registrations')
      .select('id')
      .eq('gstin', d.gstin)
      .not('status', 'eq', 'rejected')
      .limit(1);

    if (gstinExists && gstinExists.length > 0) {
      return NextResponse.json({ error: 'A registration with this GSTIN already exists.' }, { status: 409 });
    }

    // Also check existing customers
    const { data: custExists } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('gstin', d.gstin)
      .limit(1);

    if (custExists && custExists.length > 0) {
      return NextResponse.json({ error: 'This GSTIN is already registered as a customer.' }, { status: 409 });
    }
  }

  // Generate random reg reference (not sequential)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const regNo = `CR-${rand}`;

  // Generate email verification token
  const verifyToken = crypto.randomBytes(32).toString('hex');
  const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  const { data: reg, error } = await supabaseAdmin
    .from('customer_registrations')
    .insert({
      reg_no: regNo,
      company_name: d.company_name,
      contact_person: d.contact_person,
      email: d.email,
      phone: d.phone || null,
      website: d.website || null,
      country: d.country || 'India',
      gstin: d.gstin || null,
      pan: d.pan || null,
      tax_id: d.tax_id || null,
      business_type: d.business_type || null,
      industry: d.industry || null,
      billing_address: d.billing_address,
      shipping_address: d.shipping_address || d.billing_address,
      terms_accepted: true,
      source: d.source || 'website',
      notes: d.notes || null,
      verify_token: verifyToken,
      verify_expires: verifyExpires,
      status: 'pending',
    })
    .select('id, reg_no')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to save registration.' }, { status: 500 });

  // Send verification email from noreply@
  const transporter = getTransporter();
  if (transporter) {
    const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rotehuegels.com'}/customers/verify?token=${verifyToken}`;
    try {
      await transporter.sendMail({
        from: 'Rotehügels <noreply@rotehuegels.com>',
        to: d.email,
        subject: `Verify your email — ${d.company_name} registration`,
        html: `
          <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1a1a1a;">
            <div style="border-bottom:3px solid #b45309;padding-bottom:14px;margin-bottom:20px;">
              <div style="font-size:17px;font-weight:900;text-transform:uppercase;">Rotehügels</div>
              <div style="font-size:11px;color:#666;margin-top:4px;">Customer Registration</div>
            </div>
            <p>Dear <strong>${d.contact_person}</strong>,</p>
            <p>Thank you for registering <strong>${d.company_name}</strong> with Rotehügels.</p>
            <p>Please verify your email address by clicking the button below:</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${verifyUrl}" style="display:inline-block;background:#b45309;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">
                Verify Email Address
              </a>
            </div>
            <p style="font-size:12px;color:#666;">This link expires in 24 hours. If you did not register, please ignore this email.</p>
            <p style="font-size:12px;color:#666;">Registration reference: <strong>${regNo}</strong></p>
            <div style="border-top:1px solid #ddd;padding-top:12px;margin-top:24px;font-size:10px;color:#999;">
              This is an automated email from Rotehügels. Do not reply to this address.
            </div>
          </div>
        `,
      });
    } catch (e) {
      console.error('[customer-reg] Failed to send verification email:', e);
    }
  }

  return NextResponse.json({ success: true, reg_no: reg.reg_no }, { status: 201 });
}
