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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('customer_registrations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH — approve or reject
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action, rejection_reason, approved_by } = body;

  const { data: reg } = await supabaseAdmin
    .from('customer_registrations')
    .select('*')
    .eq('id', id)
    .single();

  if (!reg) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'reject') {
    await supabaseAdmin
      .from('customer_registrations')
      .update({ status: 'rejected', rejection_reason: rejection_reason || null })
      .eq('id', id);

    return NextResponse.json({ success: true, status: 'rejected' });
  }

  if (action === 'approve') {
    // Generate random customer_id (not sequential)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const customer_id = `CUST-${rand}`;

    // Derive state/PAN from GSTIN
    let state_code: string | null = null;
    let pan: string | null = reg.pan;
    if (reg.gstin && reg.gstin.length >= 15) {
      state_code = reg.gstin.slice(0, 2);
      if (!pan) pan = reg.gstin.slice(2, 12);
    }

    const addr = reg.billing_address || {};

    // Create customer
    const { data: customer, error: custErr } = await supabaseAdmin
      .from('customers')
      .insert({
        customer_id,
        name: reg.company_name,
        gstin: reg.gstin || null,
        pan,
        billing_address: reg.billing_address,
        shipping_address: reg.shipping_address || reg.billing_address,
        contact_person: reg.contact_person,
        email: reg.email,
        phone: reg.phone || null,
        state: addr.state || null,
        state_code,
        notes: `Registered via website. Reg: ${reg.reg_no}. Industry: ${reg.industry || '—'}. Type: ${reg.business_type || '—'}.`,
      })
      .select('id, customer_id')
      .single();

    if (custErr) return NextResponse.json({ error: custErr.message }, { status: 500 });

    // Update registration with approval
    await supabaseAdmin
      .from('customer_registrations')
      .update({
        status: 'approved',
        approved_by: approved_by || 'Admin',
        approved_at: new Date().toISOString(),
        customer_id: customer.id,
      })
      .eq('id', id);

    // Send approval email with customer ID
    const transporter = getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: 'Rotehügels Sales <sales@rotehuegels.com>',
          to: reg.email,
          subject: `KYC Approved — Your Customer ID: ${customer_id}`,
          html: `
            <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1a1a1a;">
              <div style="border-bottom:3px solid #b45309;padding-bottom:14px;margin-bottom:20px;">
                <div style="font-size:17px;font-weight:900;text-transform:uppercase;">Rotehügels</div>
              </div>
              <p>Dear <strong>${reg.contact_person}</strong>,</p>
              <p>Great news! Your KYC verification for <strong>${reg.company_name}</strong> has been approved.</p>
              <div style="margin:20px 0;padding:16px 20px;border:2px solid #b45309;border-radius:8px;text-align:center;background:#fffbeb;">
                <p style="font-size:12px;color:#92400e;margin:0 0 6px;">Your Customer ID</p>
                <p style="font-size:24px;font-weight:900;color:#b45309;margin:0;font-family:monospace;">${customer_id}</p>
              </div>
              <p>Please quote this ID in all future communications, orders, and invoices.</p>
              <p>You can now:</p>
              <ul style="color:#444;font-size:13px;line-height:1.8;">
                <li>Request quotations for projects and services</li>
                <li>Place orders and track deliveries</li>
                <li>Access the Client Portal for project monitoring</li>
              </ul>
              <p style="margin-top:24px;">Welcome aboard!<br/><strong>Sales Team</strong><br/>Rotehügels<br/>
              <a href="https://www.rotehuegels.com" style="color:#b45309;">www.rotehuegels.com</a> · +91-90044 91275</p>
              <div style="border-top:1px solid #ddd;padding-top:12px;margin-top:24px;font-size:10px;color:#999;">
                Rotehuegel Research Business Consultancy Private Limited, Chennai, Tamil Nadu, India
              </div>
            </div>
          `,
        });
      } catch (e) {
        console.error('[customer-reg] Failed to send approval email:', e);
      }
    }

    return NextResponse.json({
      success: true,
      status: 'approved',
      customer_id: customer.customer_id,
      customer_uuid: customer.id,
    });
  }

  return NextResponse.json({ error: 'Invalid action. Use "approve" or "reject".' }, { status: 400 });
}
