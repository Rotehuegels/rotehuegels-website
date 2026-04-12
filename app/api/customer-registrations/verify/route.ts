export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import nodemailer from 'nodemailer';

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST, port: Number(SMTP_PORT || 587), secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const { data: reg, error } = await supabaseAdmin
    .from('customer_registrations')
    .select('*')
    .eq('verify_token', token)
    .single();

  if (error || !reg) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });

  if (reg.email_verified) return NextResponse.json({ message: 'Email already verified' });

  // Check expiry
  if (reg.verify_expires && new Date(reg.verify_expires) < new Date()) {
    return NextResponse.json({ error: 'Verification link has expired. Please register again.' }, { status: 410 });
  }

  // Mark as verified
  await supabaseAdmin
    .from('customer_registrations')
    .update({
      email_verified: true,
      status: 'kyc_submitted',
      verify_token: null,
    })
    .eq('id', reg.id);

  // Send welcome email from sales@
  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: 'Rotehügels Sales <sales@rotehuegels.com>',
        to: reg.email,
        subject: `Welcome to Rotehügels, ${reg.company_name}!`,
        html: `
          <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1a1a1a;">
            <div style="border-bottom:3px solid #b45309;padding-bottom:14px;margin-bottom:20px;">
              <div style="font-size:17px;font-weight:900;text-transform:uppercase;">Rotehügels</div>
              <div style="font-size:11px;color:#666;margin-top:4px;">Rotehuegel Research Business Consultancy Private Limited</div>
            </div>
            <p>Dear <strong>${reg.contact_person}</strong>,</p>
            <p>Thank you for verifying your email and completing the registration for <strong>${reg.company_name}</strong>.</p>
            <p>Your registration (<strong>${reg.reg_no}</strong>) is now under KYC review. Our team will verify your details and activate your customer account shortly.</p>
            <p>Once approved, you will receive your unique Customer ID and can start engaging with us for projects, quotations, and services.</p>
            <h3 style="color:#b45309;margin-top:24px;">What we offer:</h3>
            <ul style="color:#444;font-size:13px;line-height:1.8;">
              <li>Engineering consultancy and plant setup</li>
              <li>Industrial equipment supply and commissioning</li>
              <li>AutoREX — AI-powered plant automation</li>
              <li>LabREX — Laboratory information management</li>
              <li>Operon — Cloud ERP for operations management</li>
            </ul>
            <p>If you have any questions, feel free to reply to this email or call us at <strong>+91-90044 91275</strong>.</p>
            <p style="margin-top:24px;">Warm regards,<br/><strong>Sales Team</strong><br/>Rotehügels<br/>
            <a href="https://www.rotehuegels.com" style="color:#b45309;">www.rotehuegels.com</a></p>
            <div style="border-top:1px solid #ddd;padding-top:12px;margin-top:24px;font-size:10px;color:#999;">
              Rotehuegel Research Business Consultancy Private Limited<br/>
              Chennai, Tamil Nadu, India
            </div>
          </div>
        `,
      });
    } catch (e) {
      console.error('[customer-reg] Failed to send welcome email:', e);
    }

    // Notify admin
    try {
      await transporter.sendMail({
        from: 'Rotehügels <noreply@rotehuegels.com>',
        to: process.env.EMAIL_TO || 'sivakumar@rotehuegels.com',
        subject: `New customer KYC pending: ${reg.company_name}`,
        html: `
          <h2>New Customer Registration — KYC Review Required</h2>
          <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
            <tr><td><strong>Reg No</strong></td><td>${reg.reg_no}</td></tr>
            <tr><td><strong>Company</strong></td><td>${reg.company_name}</td></tr>
            <tr><td><strong>Contact</strong></td><td>${reg.contact_person}</td></tr>
            <tr><td><strong>Email</strong></td><td>${reg.email}</td></tr>
            <tr><td><strong>Phone</strong></td><td>${reg.phone || '—'}</td></tr>
            <tr><td><strong>GSTIN</strong></td><td>${reg.gstin || '—'}</td></tr>
            <tr><td><strong>PAN</strong></td><td>${reg.pan || '—'}</td></tr>
            <tr><td><strong>Business Type</strong></td><td>${reg.business_type || '—'}</td></tr>
            <tr><td><strong>Industry</strong></td><td>${reg.industry || '—'}</td></tr>
          </table>
          <p style="margin-top:16px;">
            <a href="https://rotehuegels.com/dashboard/accounts/customers/registrations" style="color:#e11d48;font-weight:700;">Review in Dashboard →</a>
          </p>
        `,
      });
    } catch (e) {
      console.error('[customer-reg] Failed to notify admin:', e);
    }
  }

  return NextResponse.json({ success: true, message: 'Email verified. KYC under review.' });
}
