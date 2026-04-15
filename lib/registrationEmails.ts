// lib/registrationEmails.ts
// Centralized email templates for all registration workflows.
// All system-generated emails MUST use noreply@rotehuegels.com.

import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
const NOREPLY = 'Rotehügels <noreply@rotehuegels.com>';

function getTransporter() {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST, port: Number(SMTP_PORT), secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

function esc(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ── Shared layout ────────────────────────────────────────────────────────────
function wrap(department: string, body: string) {
  const deptLabel: Record<string, string> = {
    sales: 'Sales & Customer Relations',
    procurement: 'Procurement & Supply Chain',
    hr: 'Human Resources',
    network: 'REX Network',
    trading: 'Trading & Commodity Desk',
  };
  const deptName = deptLabel[department] ?? department;

  return `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
      <div style="border-bottom:3px solid #b45309;padding-bottom:10px;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:900;text-transform:uppercase;">Roteh&uuml;gels</div>
        <div style="font-size:10px;color:#888;margin-top:2px;">${esc(deptName)}</div>
      </div>
      ${body}
      <div style="border-top:1px solid #ddd;padding-top:10px;margin-top:24px;font-size:9px;color:#999;line-height:1.6;">
        <div>This is an automated email from Rotehuegel Research Business Consultancy Private Limited.</div>
        <div>Department: ${esc(deptName)}</div>
        <div>No. 1/584, 7th Street, Jothi Nagar, Padianallur, Chennai &ndash; 600052, Tamil Nadu, India</div>
        <div>www.rotehuegels.com | noreply@rotehuegels.com</div>
        <div style="margin-top:6px;font-style:italic;">
          This email was sent from an unmonitored address. Please do not reply to this email.
          For enquiries, contact the ${esc(deptName)} team via www.rotehuegels.com.
        </div>
      </div>
    </div>
  `;
}

// ── Registration Confirmation (sent immediately on form submission) ───────────
export async function sendRegistrationConfirmation(opts: {
  to: string;
  companyName: string;
  contactPerson: string;
  refNo: string;
  type: 'customer' | 'supplier' | 'trading_partner';
}) {
  const t = getTransporter();
  if (!t) { console.warn('[registrationEmails] SMTP not configured'); return; }

  const typeLabels: Record<string, { label: string; dept: string }> = {
    customer: { label: 'Customer', dept: 'sales' },
    supplier: { label: 'Supplier', dept: 'procurement' },
    trading_partner: { label: 'Trading Partner', dept: 'trading' },
  };
  const { label, dept } = typeLabels[opts.type];

  const html = wrap(dept, `
    <h2 style="font-size:16px;color:#111;margin:0 0 8px;">Registration Received</h2>
    <p style="font-size:13px;color:#555;">
      Dear ${esc(opts.contactPerson)},
    </p>
    <p style="font-size:13px;color:#555;">
      Thank you for registering <strong>${esc(opts.companyName)}</strong> as a ${label} with Roteh&uuml;gels.
      Your registration is under review.
    </p>
    <div style="margin:16px 0;padding:12px 16px;border:2px solid #b45309;border-radius:6px;background:#fffbeb;">
      <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;">Your Registration Reference</div>
      <div style="font-size:22px;font-weight:900;color:#b45309;margin-top:4px;">${esc(opts.refNo)}</div>
    </div>
    <p style="font-size:12px;color:#666;">
      Please save this reference number for your records. Our team will review your submission and
      you will receive a confirmation email once your registration is approved.
    </p>
  `);

  try {
    await t.sendMail({
      from: NOREPLY, to: opts.to,
      subject: `Registration Received — ${opts.refNo} | Rotehügels`,
      html,
      text: `Dear ${opts.contactPerson}, Thank you for registering ${opts.companyName} as a ${label}. Your reference: ${opts.refNo}. Our team will review and contact you.`,
    });
  } catch (err) { console.error('[registrationEmails] send failed:', err); }
}

// ── Approval Welcome Email (sent when admin approves) ────────────────────────
export async function sendRegistrationApproval(opts: {
  to: string;
  companyName: string;
  contactPerson: string;
  refNo: string;
  assignedId: string;  // e.g., CUST-ABC123, supplier code, RTP-ABC123
  type: 'customer' | 'supplier' | 'trading_partner';
}) {
  const t = getTransporter();
  if (!t) { console.warn('[registrationEmails] SMTP not configured'); return; }

  const typeLabels: Record<string, { label: string; dept: string; idLabel: string }> = {
    customer: { label: 'Customer', dept: 'sales', idLabel: 'Customer ID' },
    supplier: { label: 'Approved Supplier', dept: 'procurement', idLabel: 'Supplier Code' },
    trading_partner: { label: 'Verified Trading Partner', dept: 'trading', idLabel: 'Partner ID' },
  };
  const { label, dept, idLabel } = typeLabels[opts.type];

  const html = wrap(dept, `
    <h2 style="font-size:16px;color:#111;margin:0 0 8px;">Welcome to Roteh&uuml;gels!</h2>
    <p style="font-size:13px;color:#555;">
      Dear ${esc(opts.contactPerson)},
    </p>
    <p style="font-size:13px;color:#555;">
      We are pleased to inform you that <strong>${esc(opts.companyName)}</strong> has been approved
      as a <strong>${label}</strong> with Roteh&uuml;gels.
    </p>
    <div style="margin:16px 0;padding:12px 16px;border:2px solid #16a34a;border-radius:6px;background:#f0fdf4;">
      <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;">${esc(idLabel)}</div>
      <div style="font-size:22px;font-weight:900;color:#16a34a;margin-top:4px;">${esc(opts.assignedId)}</div>
      <div style="font-size:10px;color:#666;margin-top:4px;">Registration Ref: ${esc(opts.refNo)}</div>
    </div>
    <p style="font-size:12px;color:#666;">
      Please use this ${idLabel} for all future correspondence and transactions with Roteh&uuml;gels.
    </p>
    <p style="font-size:12px;color:#666;">
      We look forward to a mutually beneficial partnership.
    </p>
    <p style="font-size:12px;color:#555;margin-top:12px;">
      Warm regards,<br/>
      <strong>Roteh&uuml;gels Team</strong>
    </p>
  `);

  try {
    await t.sendMail({
      from: NOREPLY, to: opts.to,
      subject: `Welcome — Your ${idLabel}: ${opts.assignedId} | Rotehügels`,
      html,
      text: `Dear ${opts.contactPerson}, Welcome! ${opts.companyName} is now an ${label}. Your ${idLabel}: ${opts.assignedId}. Ref: ${opts.refNo}.`,
    });
  } catch (err) { console.error('[registrationEmails] send failed:', err); }
}

// ── REX Welcome Email ────────────────────────────────────────────────────────
export async function sendRexWelcome(opts: {
  to: string;
  fullName: string;
  title: string;
  rexId: string;
  memberType: string;
}) {
  const t = getTransporter();
  if (!t) { console.warn('[registrationEmails] SMTP not configured'); return; }

  const html = wrap('network', `
    <h2 style="font-size:16px;color:#111;margin:0 0 8px;">Welcome to the REX Network!</h2>
    <p style="font-size:13px;color:#555;">
      Dear ${esc(opts.title)} ${esc(opts.fullName)},
    </p>
    <p style="font-size:13px;color:#555;">
      Congratulations! You are now a member of the <strong>Roteh&uuml;gels Expert Network (REX)</strong>.
    </p>
    <div style="margin:16px 0;padding:12px 16px;border:2px solid #b45309;border-radius:6px;background:#fffbeb;">
      <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;">Your REX ID</div>
      <div style="font-size:22px;font-weight:900;color:#b45309;margin-top:4px;">${esc(opts.rexId)}</div>
      <div style="font-size:10px;color:#666;margin-top:4px;">Member Type: ${esc(opts.memberType)}</div>
    </div>
    <p style="font-size:12px;color:#666;">
      Your membership is <strong>voluntary, complimentary, and lifelong</strong> &mdash; no fees, no renewal required.
      You may be contacted for project opportunities, research collaborations, and industry events.
    </p>
    <p style="font-size:12px;color:#555;margin-top:12px;">
      Warm regards,<br/>
      <strong>Roteh&uuml;gels REX Network Team</strong>
    </p>
  `);

  try {
    await t.sendMail({
      from: NOREPLY, to: opts.to,
      subject: `Welcome to REX — Your ID: ${opts.rexId} | Rotehügels`,
      html,
      text: `Dear ${opts.title} ${opts.fullName}, Welcome to the REX Network! Your REX ID: ${opts.rexId}. Membership is voluntary, complimentary, and lifelong.`,
    });
  } catch (err) { console.error('[registrationEmails] send failed:', err); }
}
