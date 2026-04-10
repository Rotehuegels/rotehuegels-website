export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { sendNewApplicationEmail } from '@/lib/mailer';

const ApplySchema = z.object({
  job_id: z.string().uuid(),
  job_title: z.string().min(1),
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  cv_url: z.string().url().optional().or(z.literal('')),
  cover_letter: z.string().max(2000).optional(),
  current_company: z.string().optional(),
  current_role: z.string().optional(),
  experience_years: z.coerce.number().int().min(0).max(50).optional(),
  expected_ctc: z.string().optional(),
  current_ctc: z.string().optional(),
  notice_period: z.string().optional(),
  source: z.enum(['website', 'linkedin', 'referral', 'naukri', 'other']).default('website'),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed, resetAt } = rateLimit(ip, 5, 60 * 60 * 1000); // 5 per hour
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many applications from this device. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = ApplySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const d = parsed.data;

  // Check if job is published
  const { data: job } = await supabaseAdmin
    .from('job_postings')
    .select('id, title, status')
    .eq('id', d.job_id)
    .single();

  if (!job || job.status !== 'published') {
    return NextResponse.json({ error: 'This position is no longer accepting applications.' }, { status: 410 });
  }

  // Check for duplicate application
  const { data: existing } = await supabaseAdmin
    .from('applications')
    .select('id')
    .eq('job_id', d.job_id)
    .eq('email', d.email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'You have already applied for this position.' }, { status: 409 });
  }

  // Check REX membership
  const { data: rexMember } = await supabaseAdmin
    .from('rex_members')
    .select('rex_id')
    .eq('email', d.email)
    .maybeSingle();

  const { error } = await supabaseAdmin.from('applications').insert([{
    job_id: d.job_id,
    job_title: d.job_title,
    full_name: d.full_name,
    email: d.email,
    phone: d.phone || null,
    linkedin_url: d.linkedin_url || null,
    cv_url: d.cv_url || null,
    cover_letter: d.cover_letter || null,
    current_company: d.current_company || null,
    current_role: d.current_role || null,
    experience_years: d.experience_years ?? null,
    expected_ctc: d.expected_ctc || null,
    current_ctc: d.current_ctc || null,
    notice_period: d.notice_period || null,
    source: d.source,
    rex_id: rexMember?.rex_id ?? null,
    stage: 'applied',
  }]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send email notification (fire-and-forget)
  sendNewApplicationEmail({
    candidate_name: d.full_name,
    email: d.email,
    phone: d.phone,
    job_title: job.title,
    current_company: d.current_company,
    current_role: d.current_role,
    experience_years: d.experience_years,
    expected_ctc: d.expected_ctc,
    current_ctc: d.current_ctc,
    notice_period: d.notice_period,
    source: d.source,
  }).catch(err => console.error('[mailer] Failed to send application notification:', err));

  return NextResponse.json({
    success: true,
    is_rex_member: !!rexMember,
    rex_id: rexMember?.rex_id ?? null,
  }, { status: 201 });
}
