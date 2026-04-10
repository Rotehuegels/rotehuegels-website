export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import type { AgentId } from '@/lib/agents';

const {
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
  EMAIL_FROM = 'Rotehügels AI <noreply@rotehuegels.com>',
} = process.env;

// Department email routing
const AGENT_EMAIL: Record<AgentId, string> = {
  welcome:   'sivakumar@rotehuegels.com',
  sales:     'sales@rotehuegels.com',
  marketing: 'sales@rotehuegels.com',        // until marketing@ is created
  supplier:  'procurements@rotehuegels.com',
  hr:        'hr@rotehuegels.com',
};

const AGENT_LABEL: Record<AgentId, string> = {
  welcome:   'General Inquiry',
  sales:     'Sales Lead',
  marketing: 'Marketing Inquiry',
  supplier:  'Supplier / Procurement',
  hr:        'HR / Careers',
};

interface SummaryRequest {
  agent: AgentId;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  visitorName?: string;
  visitorEmail?: string;
  visitorPhone?: string;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function POST(req: Request) {
  let body: SummaryRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const { agent, messages, visitorName, visitorEmail, visitorPhone } = body;

  if (!agent || !messages?.length) {
    return NextResponse.json({ error: 'agent and messages are required.' }, { status: 400 });
  }

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return NextResponse.json({ error: 'Email service not configured.' }, { status: 503 });
  }

  const to = AGENT_EMAIL[agent] ?? AGENT_EMAIL.welcome;
  const label = AGENT_LABEL[agent] ?? 'General';
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // Build plain text summary
  const conversationText = messages
    .map(m => `${m.role === 'user' ? 'Visitor' : 'AI Agent'}: ${m.content}`)
    .join('\n\n');

  const contactInfo = [
    visitorName && `Name: ${visitorName}`,
    visitorEmail && `Email: ${visitorEmail}`,
    visitorPhone && `Phone: ${visitorPhone}`,
  ].filter(Boolean).join('\n');

  const subject = `[${label}] New chat inquiry via Rotehügels AI — ${now}`;

  const text = [
    `New ${label} inquiry received via website chat`,
    `Date: ${now}`,
    '',
    contactInfo ? `── Visitor Details ──\n${contactInfo}\n` : '',
    `── Conversation (${messages.length} messages) ──`,
    conversationText,
    '',
    '── End of conversation ──',
    '',
    'This is an automated summary from the Rotehügels AI assistant.',
  ].join('\n');

  // Build HTML email
  const messagesHtml = messages.map(m => {
    const isUser = m.role === 'user';
    const bg = isUser ? '#fef3c7' : '#f3f4f6';
    const label = isUser ? '👤 Visitor' : '🤖 AI Agent';
    return `
      <div style="margin-bottom:10px;padding:10px 14px;background:${bg};border-radius:8px;font-size:14px;line-height:1.6">
        <strong style="font-size:12px;color:#666">${label}</strong><br/>
        ${escapeHtml(m.content)}
      </div>`;
  }).join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#111;color:white;padding:16px 20px;border-radius:8px 8px 0 0">
        <h2 style="margin:0;font-size:16px">🔔 New ${escapeHtml(label)} Inquiry</h2>
        <p style="margin:4px 0 0;font-size:12px;color:#999">${escapeHtml(now)}</p>
      </div>

      ${contactInfo ? `
      <div style="background:#fafafa;padding:12px 20px;border:1px solid #eee;border-top:none">
        <h3 style="margin:0 0 6px;font-size:13px;color:#666">Visitor Details</h3>
        ${visitorName ? `<div style="font-size:14px"><strong>Name:</strong> ${escapeHtml(visitorName)}</div>` : ''}
        ${visitorEmail ? `<div style="font-size:14px"><strong>Email:</strong> ${escapeHtml(visitorEmail)}</div>` : ''}
        ${visitorPhone ? `<div style="font-size:14px"><strong>Phone:</strong> ${escapeHtml(visitorPhone)}</div>` : ''}
      </div>` : ''}

      <div style="padding:16px 20px;border:1px solid #eee;border-top:none">
        <h3 style="margin:0 0 12px;font-size:13px;color:#666">Conversation (${messages.length} messages)</h3>
        ${messagesHtml}
      </div>

      <div style="background:#f9f9f9;padding:12px 20px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;font-size:11px;color:#999">
        Automated summary from Rotehügels AI Assistant &middot; www.rotehuegels.com
      </div>
    </div>`;

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({ from: EMAIL_FROM, to, subject, text, html });

    return NextResponse.json({ success: true, sentTo: to });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Email send error:', msg);
    return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
  }
}
