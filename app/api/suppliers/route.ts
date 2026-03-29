export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendNewSupplierEmail } from '@/lib/mailer';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const SupplierSchema = z.object({
  company_name: z.string().min(2, 'Company name required'),
  contact_person: z.string().min(2, 'Contact person required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  website: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
  product_categories: z.string().min(3, 'Please describe your products/services'),
  certifications: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed, resetAt } = rateLimit(ip, 5, 15 * 60 * 1000); // 5 per 15 min
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = SupplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const { error: dbError } = await supabaseAdmin
    .from('suppliers')
    .insert([data]);

  if (dbError) {
    console.error('[api/suppliers] DB insert error:', dbError.message);
    return NextResponse.json({ error: 'Failed to save submission.' }, { status: 500 });
  }

  try {
    await sendNewSupplierEmail(data);
  } catch (emailErr) {
    // Don't fail the request if email fails — submission is already saved
    console.error('[api/suppliers] Email send error:', emailErr);
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
