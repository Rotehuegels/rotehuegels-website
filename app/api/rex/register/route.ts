export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import nodemailer from 'nodemailer';

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

function sendWelcomeEmail(params: {
  to: string;
  title: string;
  full_name: string;
  rex_id: string;
  member_type: string;
}) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return Promise.resolve();

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const memberTypeLabel: Record<string, string> = {
    student: 'Student',
    professional: 'Professional',
    academic: 'Academic',
    enthusiast: 'Enthusiast',
  };

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
      <div style="background:#0a0a0a;padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;font-size:22px;margin:0">Welcome to the Rotehügels Expert Network</h1>
        <p style="color:#aaa;margin:8px 0 0;font-size:14px">REX — Connecting Experts in Sustainability, Recycling & Plant Automation</p>
      </div>

      <div style="background:#f9f9f9;padding:32px;border-radius:0 0 12px 12px;border:1px solid #eee">
        <p style="font-size:16px">Dear ${esc(params.title)} ${esc(params.full_name)},</p>

        <p>We are delighted to welcome you to the <strong>Rotehügels Expert Network (REX)</strong> as a lifelong member.</p>

        <div style="background:#fff;border:2px solid #e11d48;border-radius:10px;padding:20px 24px;margin:24px 0;text-align:center">
          <p style="margin:0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px">Your REX ID</p>
          <p style="margin:8px 0 0;font-size:32px;font-weight:800;color:#e11d48;letter-spacing:2px;font-family:monospace">${esc(params.rex_id)}</p>
          <p style="margin:8px 0 0;font-size:13px;color:#888">Member Type: ${memberTypeLabel[params.member_type] ?? params.member_type}</p>
        </div>

        <p>Your REX ID is your unique lifelong identifier within our growing network of experts. Please keep it safe.</p>

        <h3 style="color:#111;font-size:15px">What this means</h3>
        <ul style="color:#444;font-size:14px;line-height:1.8">
          <li>You are now part of a curated network of professionals, academics, students, and enthusiasts focused on sustainability, recycling, and plant automation.</li>
          <li>This membership is <strong>voluntary and complimentary</strong> — it does not guarantee any immediate assignment or compensation.</li>
          <li>You may be contacted by our team based on your profile and interests for current or future project opportunities, in line with Rotehügels' policies and requirements.</li>
          <li>Your REX membership is <strong>lifelong</strong> with no renewal required.</li>
        </ul>

        <p style="font-size:14px;color:#444">If you have any questions, feel free to reach us at <a href="mailto:info@rotehuegels.com" style="color:#e11d48">info@rotehuegels.com</a>.</p>

        <p style="font-size:14px;color:#444">Warm regards,<br/><strong>Team Rotehügels</strong></p>

        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="font-size:11px;color:#aaa;margin:0">
          Rotehügel Research Business Consultancy Private Limited · Chennai, India<br/>
          This is a system-generated email. Please do not reply to this message.
        </p>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: EMAIL_FROM ?? 'sivakumar@rotehuegels.com',
    to: params.to,
    subject: `Welcome to REX — Your REX ID: ${params.rex_id}`,
    html,
  });
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

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

  // Send welcome email (non-blocking)
  sendWelcomeEmail({
    to: data.email,
    title: data.title,
    full_name: data.full_name,
    rex_id,
    member_type: data.member_type,
  }).catch((err) => console.error('[rex/register] Email error:', err));

  return NextResponse.json({ success: true, rex_id }, { status: 201 });
}
