export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const Schema = z.object({
  company_name:   z.string().min(2),
  contact_person: z.string().min(2),
  email:          z.string().email(),
  phone:          z.string().optional(),
  city:           z.string().optional(),
  state:          z.string().optional(),
  gstin:          z.string().optional(),
  pan:            z.string().optional(),
  categories:     z.array(z.string()).min(1, 'Select at least one category'),
  certifications: z.string().optional(),
  notes:          z.string().optional(),
});

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

  // Random registration reference
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const regNo = `SR-${rand}`;

  const { error } = await supabaseAdmin
    .from('supplier_registrations')
    .insert([{ ...parsed.data, reg_no: regNo, status: 'pending' }]);

  if (error) return NextResponse.json({ error: 'Failed to save registration.' }, { status: 500 });

  return NextResponse.json({ success: true, reg_no: regNo }, { status: 201 });
}
