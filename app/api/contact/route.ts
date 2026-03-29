export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import nodemailer from 'nodemailer';

const ContactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  company: z.string().optional(),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  inquiry: z.enum(['general', 'sales', 'investor', 'partnership', 'careers']),
  message: z.string().min(10, 'Please provide more detail (min 10 characters)'),
});

const INQUIRY_LABELS: Record<string, string> = {
  general: 'General Enquiry',
  sales: 'RFP / Sales',
  investor: 'Investor Relations',
  partnership: 'Partnership',
  careers: 'Careers',
};

const INQUIRY_RECIPIENTS: Record<string, string> = {
  general: 'info@rotehuegels.com',
  sales: 'sales@rotehuegels.com',
  investor: 'ir@rotehuegels.com',
  partnership: 'sales@rotehuegels.com',
  careers: 'hr@rotehuegels.com',
};

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed, resetAt } = rateLimit(ip, 5, 15 * 60 * 1000);
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
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, company, email, phone, inquiry, message } = parsed.data;
  const inquiryLabel = INQUIRY_LABELS[inquiry];
  const to = INQUIRY_RECIPIENTS[inquiry];

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn('[api/contact] SMTP not configured, skipping email.');
    return NextResponse.json({ success: true });
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const subject = `[${inquiryLabel}] New contact from ${esc(name)}${company ? ` — ${esc(company)}` : ''}`;

  const html = `
    <h2 style="color:#111">New contact form submission</h2>
    <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <tr><td><strong>Name</strong></td><td>${esc(name)}</td></tr>
      ${company ? `<tr><td><strong>Company</strong></td><td>${esc(company)}</td></tr>` : ''}
      <tr><td><strong>Email</strong></td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
      ${phone ? `<tr><td><strong>Phone</strong></td><td>${esc(phone)}</td></tr>` : ''}
      <tr><td><strong>Inquiry type</strong></td><td>${esc(inquiryLabel)}</td></tr>
      <tr><td valign="top"><strong>Message</strong></td><td style="white-space:pre-wrap">${esc(message)}</td></tr>
    </table>
    <p style="color:#888;font-size:12px;margin-top:24px">Sent via rotehuegels.com contact form</p>
  `;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM ?? 'Rotehügels Website <noreply@rotehuegels.com>',
      to,
      replyTo: email,
      subject,
      html,
    });
  } catch (err) {
    console.error('[api/contact] Failed to send email:', err);
    // Still return success — submission was received even if email failed
  }

  return NextResponse.json({ success: true });
}

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
