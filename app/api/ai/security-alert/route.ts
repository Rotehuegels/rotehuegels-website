export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import type { Violation } from '@/lib/moderation';

const {
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
  EMAIL_FROM = 'Rotehügels Security <noreply@rotehuegels.com>',
} = process.env;

const SECURITY_EMAIL = 'sivakumar@rotehuegels.com';

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface AlertRequest {
  sessionId: string;
  sessionToken: string;
  ipAddress: string | null;
  city: string | null;
  country: string | null;
  userAgent: string | null;
  violations: Violation[];
  messages: Array<{ role: string; content: string; agent?: string; timestamp?: string }>;
  violationType: string;
}

export async function POST(req: Request) {
  let body: AlertRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn('[security-alert] SMTP not configured, skipping email.');
    return NextResponse.json({ error: 'Email service not configured.' }, { status: 503 });
  }

  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const subject = `[SECURITY] Chat session blocked — ${body.violationType}`;

  // ── Plain text ──────────────────────────────────────────────────────────
  const violationsText = body.violations
    .map((v, i) => `  ${i + 1}. [${v.type}] "${v.message}" — ${v.timestamp}`)
    .join('\n');

  const transcriptText = body.messages
    .map(m => `  ${m.role === 'user' ? 'Visitor' : 'AI'}: ${m.content}`)
    .join('\n\n');

  const text = [
    `SECURITY ALERT — Chat session blocked`,
    `Time: ${now}`,
    '',
    `── Session Details ──`,
    `Session ID: ${body.sessionId}`,
    `Session Token: ${body.sessionToken}`,
    `IP Address: ${body.ipAddress || 'unknown'}`,
    `Location: ${[body.city, body.country].filter(Boolean).join(', ') || 'unknown'}`,
    `User Agent: ${body.userAgent || 'unknown'}`,
    '',
    `── Violations (${body.violations.length}) ──`,
    violationsText,
    '',
    `── Full Conversation Transcript ──`,
    transcriptText,
    '',
    '── End of alert ──',
  ].join('\n');

  // ── HTML ────────────────────────────────────────────────────────────────
  const violationsHtml = body.violations
    .map(v => `
      <tr>
        <td style="padding:6px 10px;border:1px solid #ddd;font-size:13px">${escapeHtml(v.type)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;font-size:13px">${escapeHtml(v.message)}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;font-size:13px">${escapeHtml(v.timestamp)}</td>
      </tr>`)
    .join('');

  const transcriptHtml = body.messages
    .map(m => {
      const isUser = m.role === 'user';
      const bg = isUser ? '#fef3c7' : '#f3f4f6';
      const label = isUser ? 'Visitor' : 'AI Agent';
      return `
        <div style="margin-bottom:8px;padding:8px 12px;background:${bg};border-radius:6px;font-size:13px;line-height:1.5">
          <strong style="font-size:11px;color:#666">${label}</strong><br/>
          ${escapeHtml(m.content)}
        </div>`;
    })
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto">
      <div style="background:#dc2626;color:white;padding:16px 20px;border-radius:8px 8px 0 0">
        <h2 style="margin:0;font-size:16px">🚨 Security Alert — Chat Session Blocked</h2>
        <p style="margin:4px 0 0;font-size:12px;color:#fecaca">${escapeHtml(now)}</p>
      </div>

      <div style="background:#fef2f2;padding:14px 20px;border:1px solid #fecaca;border-top:none">
        <h3 style="margin:0 0 8px;font-size:13px;color:#991b1b">Session Details</h3>
        <div style="font-size:13px;line-height:1.8">
          <strong>Session ID:</strong> ${escapeHtml(body.sessionId)}<br/>
          <strong>IP Address:</strong> ${escapeHtml(body.ipAddress || 'unknown')}<br/>
          <strong>Location:</strong> ${escapeHtml([body.city, body.country].filter(Boolean).join(', ') || 'unknown')}<br/>
          <strong>User Agent:</strong> ${escapeHtml(body.userAgent || 'unknown')}
        </div>
      </div>

      <div style="padding:14px 20px;border:1px solid #eee;border-top:none">
        <h3 style="margin:0 0 8px;font-size:13px;color:#666">Violations (${body.violations.length})</h3>
        <table style="width:100%;border-collapse:collapse">
          <tr style="background:#f9fafb">
            <th style="padding:6px 10px;border:1px solid #ddd;text-align:left;font-size:12px">Type</th>
            <th style="padding:6px 10px;border:1px solid #ddd;text-align:left;font-size:12px">Message</th>
            <th style="padding:6px 10px;border:1px solid #ddd;text-align:left;font-size:12px">Time</th>
          </tr>
          ${violationsHtml}
        </table>
      </div>

      <div style="padding:14px 20px;border:1px solid #eee;border-top:none">
        <h3 style="margin:0 0 8px;font-size:13px;color:#666">Full Conversation Transcript</h3>
        ${transcriptHtml}
      </div>

      <div style="background:#f9f9f9;padding:10px 20px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;font-size:11px;color:#999">
        Automated security alert from Rotehügels AI &middot; www.rotehuegels.com
      </div>
    </div>`;

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({ from: EMAIL_FROM, to: SECURITY_EMAIL, subject, text, html });
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[security-alert] Email send error:', msg);
    return NextResponse.json({ error: 'Failed to send alert.' }, { status: 500 });
  }
}
