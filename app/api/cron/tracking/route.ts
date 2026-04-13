import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ── Tracking notification cron ──────────────────────────────────────────────
// Hit this endpoint twice daily (6 AM + 6 PM IST) via external cron scheduler.
// Fetches live tracking for all active shipments and sends email + WhatsApp.

export async function GET(req: Request) {
  // Auth
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all non-delivered shipments
    const { data: shipments } = await supabaseAdmin
      .from('shipments')
      .select('*')
      .not('status', 'in', '("delivered","returned")')
      .order('created_at', { ascending: false });

    if (!shipments?.length) {
      return NextResponse.json({ ok: true, message: 'No active shipments', sent: 0 });
    }

    const updates: string[] = [];
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rotehuegels.com';

    for (const shipment of shipments) {
      // Fetch live tracking
      try {
        const trackRes = await fetch(`${baseUrl}/api/shipments/track?tracking_no=${encodeURIComponent(shipment.tracking_no)}&carrier=${encodeURIComponent(shipment.carrier)}`, {
          signal: AbortSignal.timeout(15000),
        });
        const tracking = await trackRes.json();

        const statusEmoji: Record<string, string> = {
          booked: '📦', in_transit: '🚚', out_for_delivery: '🏍️',
          delivered: '✅', returned: '↩️', not_found: '❌', unknown: '❓',
        };

        const emoji = statusEmoji[tracking.status] ?? '📦';
        const line = `${emoji} *${shipment.tracking_no}* (${shipment.carrier})\n` +
          `   ${shipment.supplier_name ?? shipment.description ?? ''}\n` +
          `   Status: ${tracking.current_status || shipment.status.replace(/_/g, ' ')}\n` +
          (tracking.origin ? `   ${tracking.origin} → ${tracking.destination}\n` : '') +
          (tracking.events?.length ? `   Latest: ${tracking.events[tracking.events.length - 1]?.status} (${tracking.events[tracking.events.length - 1]?.date})\n` : '') +
          `   Track: ${baseUrl}/d/shipments/${shipment.id}`;

        updates.push(line);

        // Auto-update status in DB
        if (tracking.status && !['unknown', 'not_found', 'error'].includes(tracking.status) && tracking.status !== shipment.status) {
          await supabaseAdmin.from('shipments').update({
            status: tracking.status,
            ...(tracking.status === 'delivered' ? { delivered_date: new Date().toISOString().split('T')[0] } : {}),
          }).eq('id', shipment.id);
        }
      } catch (err) {
        updates.push(`⚠️ *${shipment.tracking_no}* (${shipment.carrier}) — Failed to fetch tracking`);
        console.error(`[tracking-cron] Error tracking ${shipment.tracking_no}:`, err);
      }
    }

    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const message = `🔔 *Shipment Update — ${now}*\n\n${updates.join('\n\n')}`;

    // Send via email
    let emailSent = false;
    try {
      await sendTrackingEmail(message, shipments.length);
      emailSent = true;
    } catch (err) {
      console.error('[tracking-cron] Email failed:', err);
    }

    // Send via WhatsApp
    let whatsappSent = false;
    try {
      await sendWhatsApp(message);
      whatsappSent = true;
    } catch (err) {
      console.error('[tracking-cron] WhatsApp failed:', err);
    }

    return NextResponse.json({
      ok: true,
      shipments: shipments.length,
      emailSent,
      whatsappSent,
      message,
    });
  } catch (err: unknown) {
    console.error('[CRON /api/cron/tracking]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}

// ── Email notification ──────────────────────────────────────────────────────

async function sendTrackingEmail(message: string, count: number) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return;

  const to = EMAIL_TO || 'sivakumar@rotehuegels.com';
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  // Convert WhatsApp-style formatting to HTML
  const html = message
    .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#e11d48">$1</a>');

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Rotehügels <noreply@rotehuegels.com>',
    to,
    subject: `Shipment Update — ${count} active shipment${count > 1 ? 's' : ''}`,
    text: message.replace(/\*/g, ''),
    html: `<div style="font-family:monospace;font-size:13px;line-height:1.8">${html}</div>`,
  });
}

// ── WhatsApp notification ───────────────────────────────────────────────────
// Supports: Twilio WhatsApp, Meta Cloud API, or CallMeBot (free)

async function sendWhatsApp(message: string) {
  // Option 1: Twilio WhatsApp
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM; // whatsapp:+14155238886
  const twilioTo = process.env.TWILIO_WHATSAPP_TO;     // whatsapp:+919004491275

  if (twilioSid && twilioAuth && twilioFrom && twilioTo) {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64'),
      },
      body: new URLSearchParams({
        From: twilioFrom,
        To: twilioTo,
        Body: message.replace(/\*/g, ''), // Strip markdown for SMS fallback
      }).toString(),
    });
    if (!res.ok) throw new Error(`Twilio: ${res.status}`);
    return;
  }

  // Option 2: CallMeBot (free, no setup — just authorize once)
  // To setup: send "I allow callmebot to send me messages" to +34 644 47 46 51 on WhatsApp
  const callmebotKey = process.env.CALLMEBOT_API_KEY;
  const callmebotPhone = process.env.CALLMEBOT_PHONE; // your phone number with country code

  if (callmebotKey && callmebotPhone) {
    const res = await fetch(
      `https://api.callmebot.com/whatsapp.php?phone=${callmebotPhone}&text=${encodeURIComponent(message)}&apikey=${callmebotKey}`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) throw new Error(`CallMeBot: ${res.status}`);
    return;
  }

  // Option 3: Meta WhatsApp Cloud API
  const metaToken = process.env.WHATSAPP_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_ID;
  const metaRecipient = process.env.WHATSAPP_RECIPIENT; // recipient phone number

  if (metaToken && metaPhoneId && metaRecipient) {
    const res = await fetch(`https://graph.facebook.com/v18.0/${metaPhoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${metaToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: metaRecipient,
        type: 'text',
        text: { body: message.replace(/\*/g, '') },
      }),
    });
    if (!res.ok) throw new Error(`Meta WhatsApp: ${res.status}`);
    return;
  }

  console.warn('[tracking-cron] No WhatsApp provider configured. Set TWILIO_*, CALLMEBOT_*, or WHATSAPP_* env vars.');
}
