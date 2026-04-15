export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { sendRexWelcome } from '@/lib/registrationEmails';

const RexSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  full_name: z.string().min(2, 'Full name is required'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  email: z.string().email('Valid email required'),
  linkedin_url: z.string().url('Must be a valid LinkedIn URL').optional().or(z.literal('')),
  cv_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  member_type: z.enum(['student', 'professional', 'academic', 'enthusiast']),
  interests: z.string().max(500).optional(),
});

async function generateRexId(dob: string): Promise<string> {
  // Format: REXYYYYMMDD + 3-digit running number
  const dobStr = dob.replace(/-/g, ''); // "1990-05-15" → "19900515"
  const prefix = `REX${dobStr}`;

  const { count } = await supabaseAdmin
    .from('rex_members')
    .select('*', { count: 'exact', head: true })
    .like('rex_id', `${prefix}%`);

  const next = ((count ?? 0) + 1).toString().padStart(3, '0');
  return `${prefix}${next}`;
}

// Old inline sendWelcomeEmail replaced by centralized lib/registrationEmails.ts

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed, resetAt } = rateLimit(ip, 3, 60 * 60 * 1000); // 3 registrations per hour per IP
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = RexSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;

  // Check for duplicate email
  const { data: existing } = await supabaseAdmin
    .from('rex_members')
    .select('rex_id')
    .eq('email', data.email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'This email address is already registered. Each person may register only once.' },
      { status: 409 }
    );
  }

  // Generate REX ID
  const rex_id = await generateRexId(data.date_of_birth);

  // Insert member
  const { error: dbError } = await supabaseAdmin.from('rex_members').insert([{
    rex_id,
    title: data.title,
    full_name: data.full_name,
    date_of_birth: data.date_of_birth,
    email: data.email,
    linkedin_url: data.linkedin_url || null,
    cv_url: data.cv_url || null,
    member_type: data.member_type,
    interests: data.interests || null,
  }]);

  if (dbError) {
    // Handle race condition on duplicate rex_id (extremely rare)
    if (dbError.code === '23505') {
      return NextResponse.json({ error: 'Registration conflict. Please try again.' }, { status: 409 });
    }
    console.error('[rex/register] DB error:', dbError.message);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }

  // Send welcome email — must await before returning (Vercel terminates on response)
  try {
    await sendRexWelcome({
      to: data.email,
      title: data.title,
      fullName: data.full_name,
      rexId: rex_id,
      memberType: data.member_type,
    });
  } catch (err) {
    console.error('[rex/register] Email error:', err);
    // Registration succeeded even if email fails
  }

  return NextResponse.json({ success: true, rex_id }, { status: 201 });
}
