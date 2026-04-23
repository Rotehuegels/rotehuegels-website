// lib/bookingsEmail.ts
// Email + iCalendar generation for booking confirmations and cancellations.
// Uses the same SMTP transport as lib/notifications.ts.

import 'server-only';
import nodemailer from 'nodemailer';
import type { Booking, EventType } from '@/lib/bookings';

const {
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
  EMAIL_FROM = 'Rotehügels <noreply@rotehuegels.com>',
  NEXT_PUBLIC_SITE_URL = 'https://www.rotehuegels.com',
} = process.env;

let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!transporter) {
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      throw new Error('[bookingsEmail] SMTP env vars not set');
    }
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

function esc(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// ── ICS generation ───────────────────────────────────────────────────────

function toIcsDate(d: Date): string {
  // YYYYMMDDTHHMMSSZ
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function foldLine(line: string): string {
  // RFC5545 recommends folding long lines at 75 octets.
  if (line.length <= 75) return line;
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    const end = Math.min(i + (i === 0 ? 75 : 74), line.length);
    out.push((i === 0 ? '' : ' ') + line.slice(i, end));
    i = end;
  }
  return out.join('\r\n');
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export interface IcsEventInput {
  uid: string;
  starts: Date;
  ends: Date;
  summary: string;
  description: string;
  location?: string;
  organizerName?: string;
  organizerEmail?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  status?: 'CONFIRMED' | 'CANCELLED';
  sequence?: number;
  url?: string;
}

export function buildIcsCalendar(events: IcsEventInput[]): string {
  const now = toIcsDate(new Date());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rotehügels//Bookings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  for (const e of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(foldLine(`UID:${e.uid}`));
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${toIcsDate(e.starts)}`);
    lines.push(`DTEND:${toIcsDate(e.ends)}`);
    lines.push(`SEQUENCE:${e.sequence ?? 0}`);
    lines.push(`STATUS:${e.status ?? 'CONFIRMED'}`);
    lines.push(foldLine(`SUMMARY:${icsEscape(e.summary)}`));
    if (e.description) lines.push(foldLine(`DESCRIPTION:${icsEscape(e.description)}`));
    if (e.location)    lines.push(foldLine(`LOCATION:${icsEscape(e.location)}`));
    if (e.url)         lines.push(foldLine(`URL:${e.url}`));
    if (e.organizerEmail) {
      lines.push(foldLine(`ORGANIZER;CN=${icsEscape(e.organizerName ?? e.organizerEmail)}:mailto:${e.organizerEmail}`));
    }
    if (e.attendeeEmail) {
      lines.push(foldLine(`ATTENDEE;CN=${icsEscape(e.attendeeName ?? e.attendeeEmail)};RSVP=TRUE:mailto:${e.attendeeEmail}`));
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function buildBookingIcs(booking: Booking, eventType: EventType, status: 'CONFIRMED' | 'CANCELLED' = 'CONFIRMED'): string {
  const url = `${NEXT_PUBLIC_SITE_URL}/book/${eventType.slug}`;
  return buildIcsCalendar([{
    uid: `booking-${booking.id}@rotehuegels.com`,
    starts: new Date(booking.starts_at),
    ends:   new Date(booking.ends_at),
    summary: `${eventType.name} — Rotehügels (${booking.visitor_name})`,
    description:
      `${eventType.name}\n\n` +
      `Visitor: ${booking.visitor_name}${booking.visitor_company ? ' · ' + booking.visitor_company : ''}\n` +
      `Email: ${booking.visitor_email}\n` +
      (booking.visitor_phone ? `Phone: ${booking.visitor_phone}\n` : '') +
      (booking.visitor_topic ? `\nTopic: ${booking.visitor_topic}\n` : '') +
      `\nCancel / reschedule: ${NEXT_PUBLIC_SITE_URL}/book/cancel/${booking.cancel_token}`,
    organizerName: eventType.host_name,
    organizerEmail: eventType.host_email,
    attendeeName: booking.visitor_name,
    attendeeEmail: booking.visitor_email,
    status,
    sequence: status === 'CANCELLED' ? 1 : 0,
    url,
  }]);
}

// ── Notification senders ────────────────────────────────────────────────

function fmtSlot(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: tz,
    weekday: 'long', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZoneName: 'short',
  }).format(d);
}

export async function sendBookingConfirmation(booking: Booking, eventType: EventType): Promise<void> {
  const ics = buildBookingIcs(booking, eventType, 'CONFIRMED');
  const startsAt = new Date(booking.starts_at);
  const hostSlot    = fmtSlot(startsAt, eventType.timezone);
  const visitorSlot = fmtSlot(startsAt, booking.visitor_timezone || eventType.timezone);
  const cancelUrl = `${NEXT_PUBLIC_SITE_URL}/book/cancel/${booking.cancel_token}`;

  const attachments = [{
    filename: 'rotehuegels-booking.ics',
    content: ics,
    contentType: 'text/calendar; charset=utf-8; method=REQUEST',
  }];

  // ── Visitor confirmation ──
  const visitorSubject = `Confirmed: ${eventType.name} with ${esc(eventType.host_name)} — ${visitorSlot}`;
  const visitorHtml = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;line-height:1.55">
      <h2 style="margin:0 0 12px">Your booking is confirmed</h2>
      <p style="margin:0 0 8px"><strong>${esc(eventType.name)}</strong> with ${esc(eventType.host_name)}, Rotehügels.</p>
      <p style="margin:0 0 8px"><strong>When:</strong> ${esc(visitorSlot)}</p>
      ${booking.visitor_timezone && booking.visitor_timezone !== eventType.timezone
        ? `<p style="margin:0 0 8px;color:#555"><small>Host local time: ${esc(hostSlot)}</small></p>` : ''}
      <p style="margin:0 0 8px"><strong>Duration:</strong> ${eventType.duration_minutes} minutes</p>
      ${booking.visitor_topic ? `<p style="margin:0 0 8px"><strong>Topic:</strong> ${esc(booking.visitor_topic)}</p>` : ''}
      <p style="margin:16px 0 8px">An <code>.ics</code> file is attached — opening it adds the meeting to your calendar (Google, Microsoft, Apple, Zoho, anything that speaks iCalendar).</p>
      <p style="margin:16px 0 8px">Need to cancel? <a href="${esc(cancelUrl)}">Cancel this booking</a>.</p>
      <p style="margin:24px 0 0;color:#555;font-size:12px">Rotehügels Research Business Consultancy Pvt. Ltd.<br/>
      sales@rotehuegels.com · +91 90044 91275 · www.rotehuegels.com</p>
    </div>`;

  await getTransporter().sendMail({
    from: EMAIL_FROM,
    to: booking.visitor_email,
    subject: visitorSubject,
    html: visitorHtml,
    attachments,
  });

  // ── Host notification ──
  const hostSubject = `New booking: ${eventType.name} — ${booking.visitor_name} — ${hostSlot}`;
  const hostHtml = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;line-height:1.55">
      <h2 style="margin:0 0 12px">New booking</h2>
      <table style="border-collapse:collapse;font-size:14px">
        <tr><td style="padding:4px 10px 4px 0;color:#666">Event</td><td><strong>${esc(eventType.name)}</strong> (${eventType.duration_minutes} min)</td></tr>
        <tr><td style="padding:4px 10px 4px 0;color:#666">When</td><td>${esc(hostSlot)}</td></tr>
        <tr><td style="padding:4px 10px 4px 0;color:#666">Visitor</td><td>${esc(booking.visitor_name)}${booking.visitor_company ? ' · ' + esc(booking.visitor_company) : ''}</td></tr>
        <tr><td style="padding:4px 10px 4px 0;color:#666">Email</td><td><a href="mailto:${esc(booking.visitor_email)}">${esc(booking.visitor_email)}</a></td></tr>
        ${booking.visitor_phone ? `<tr><td style="padding:4px 10px 4px 0;color:#666">Phone</td><td>${esc(booking.visitor_phone)}</td></tr>` : ''}
        ${booking.visitor_timezone ? `<tr><td style="padding:4px 10px 4px 0;color:#666">Visitor TZ</td><td>${esc(booking.visitor_timezone)} — ${esc(visitorSlot)}</td></tr>` : ''}
        ${booking.visitor_topic ? `<tr><td style="padding:4px 10px 4px 0;color:#666;vertical-align:top">Topic</td><td>${esc(booking.visitor_topic).replace(/\n/g, '<br/>')}</td></tr>` : ''}
      </table>
      <p style="margin:16px 0 8px">Manage: <a href="${esc(NEXT_PUBLIC_SITE_URL)}/d/bookings">/d/bookings</a></p>
      <p style="margin:0 0 8px">Cancel link (share if you need to reschedule manually): <a href="${esc(cancelUrl)}">${esc(cancelUrl)}</a></p>
    </div>`;

  await getTransporter().sendMail({
    from: EMAIL_FROM,
    to: eventType.host_email,
    replyTo: booking.visitor_email,
    subject: hostSubject,
    html: hostHtml,
    attachments,
  });
}

export async function sendBookingCancellation(booking: Booking, eventType: EventType, cancelledBy: 'visitor' | 'host'): Promise<void> {
  const ics = buildBookingIcs(booking, eventType, 'CANCELLED');
  const slot = fmtSlot(new Date(booking.starts_at), eventType.timezone);

  const attachments = [{
    filename: 'rotehuegels-booking-cancelled.ics',
    content: ics,
    contentType: 'text/calendar; charset=utf-8; method=CANCEL',
  }];

  const subject = `Cancelled: ${eventType.name} — ${slot}`;
  const byLabel = cancelledBy === 'visitor' ? 'the visitor' : 'Rotehügels';
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;line-height:1.55">
      <h2 style="margin:0 0 12px">Booking cancelled</h2>
      <p style="margin:0 0 8px">${esc(eventType.name)} — ${esc(slot)}</p>
      <p style="margin:0 0 8px">Cancelled by ${byLabel}.</p>
      <p style="margin:16px 0 0;color:#555;font-size:12px">The attached <code>.ics</code> with METHOD:CANCEL will remove this event from any calendar that subscribes to it.</p>
    </div>`;

  const tasks: Promise<unknown>[] = [];
  tasks.push(getTransporter().sendMail({
    from: EMAIL_FROM,
    to: booking.visitor_email,
    subject, html, attachments,
  }));
  tasks.push(getTransporter().sendMail({
    from: EMAIL_FROM,
    to: eventType.host_email,
    subject, html, attachments,
  }));
  await Promise.all(tasks);
}
