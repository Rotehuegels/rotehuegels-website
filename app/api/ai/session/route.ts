export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ── IP geolocation (ip-api.com returns ISP, org, city, country, etc.) ───────

interface GeoData {
  city?: string;
  region?: string;
  country?: string;
  timezone?: string;
  isp?: string;
  org?: string;
}

async function geoLookup(ip: string): Promise<GeoData> {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {};
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=city,regionName,country,timezone,isp,org`,
      { signal: AbortSignal.timeout(3000) },
    );
    if (!res.ok) return {};
    const d = await res.json();
    return {
      city:     d.city || undefined,
      region:   d.regionName || undefined,
      country:  d.country || undefined,
      timezone: d.timezone || undefined,
      isp:      d.isp || undefined,
      org:      d.org || undefined,
    };
  } catch {
    return {};
  }
}

// ── Parse user agent into device_type, browser, os ──────────────────────────

function parseUserAgent(ua: string): { device_type: string; browser: string; os: string } {
  let device_type = 'desktop';
  if (/Mobile|Android|iPhone|iPod/i.test(ua)) device_type = 'mobile';
  else if (/iPad|Tablet/i.test(ua)) device_type = 'tablet';

  let browser = 'Unknown';
  if (/Edg\/(\d+)/i.test(ua))           browser = `Edge ${ua.match(/Edg\/(\d+)/i)?.[1]}`;
  else if (/OPR\/(\d+)/i.test(ua))      browser = `Opera ${ua.match(/OPR\/(\d+)/i)?.[1]}`;
  else if (/Chrome\/(\d+)/i.test(ua))    browser = `Chrome ${ua.match(/Chrome\/(\d+)/i)?.[1]}`;
  else if (/Safari\/.*Version\/(\d+)/i.test(ua)) browser = `Safari ${ua.match(/Version\/(\d+)/i)?.[1]}`;
  else if (/Firefox\/(\d+)/i.test(ua))   browser = `Firefox ${ua.match(/Firefox\/(\d+)/i)?.[1]}`;

  let os = 'Unknown';
  if (/Windows NT 10/i.test(ua))         os = 'Windows 10/11';
  else if (/Windows/i.test(ua))          os = 'Windows';
  else if (/Mac OS X (\d+[._]\d+)/i.test(ua)) os = `macOS ${ua.match(/Mac OS X (\d+[._]\d+)/i)?.[1]?.replace('_', '.')}`;
  else if (/Android (\d+)/i.test(ua))    os = `Android ${ua.match(/Android (\d+)/i)?.[1]}`;
  else if (/iPhone OS (\d+)/i.test(ua))  os = `iOS ${ua.match(/iPhone OS (\d+)/i)?.[1]}`;
  else if (/iPad.*OS (\d+)/i.test(ua))   os = `iPadOS ${ua.match(/OS (\d+)/i)?.[1]}`;
  else if (/Linux/i.test(ua))            os = 'Linux';

  return { device_type, browser, os };
}

// ── POST: Create a new session ──────────────────────────────────────────────

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null;

  const userAgent = req.headers.get('user-agent') || '';

  // Parse client-sent metadata
  let clientData: Record<string, unknown> = {};
  try {
    clientData = await req.json();
  } catch {
    // No body is fine — client metadata is optional
  }

  // If body has sessionToken, this is a beacon update (sendBeacon sends POST)
  if (clientData.sessionToken) {
    const updates: Record<string, unknown> = {};
    if (clientData.sessionDuration) updates.session_duration_secs = clientData.sessionDuration;
    if (clientData.status) {
      updates.status = clientData.status;
      updates.ended_at = new Date().toISOString();
    }
    if (Object.keys(updates).length > 0) {
      await supabaseAdmin.from('chat_sessions')
        .update(updates)
        .eq('session_token', clientData.sessionToken as string);
    }
    return NextResponse.json({ success: true });
  }

  const sessionToken = crypto.randomUUID();

  const geo = ip ? await geoLookup(ip) : {};
  const uaParsed = userAgent ? parseUserAgent(userAgent) : { device_type: null, browser: null, os: null };

  const { error } = await supabaseAdmin.from('chat_sessions').insert({
    session_token:     sessionToken,
    ip_address:        ip,
    city:              geo.city || null,
    region:            geo.region || null,
    country:           geo.country || null,
    timezone:          geo.timezone || clientData.timezone || null,
    isp:               geo.isp || null,
    org:               geo.org || null,
    user_agent:        userAgent || null,
    device_type:       uaParsed.device_type,
    browser:           uaParsed.browser,
    os:                uaParsed.os,
    screen_resolution: clientData.screenResolution || null,
    browser_language:  clientData.browserLanguage || null,
    connection_type:   clientData.connectionType || null,
    referrer:          clientData.referrer || null,
    landing_page:      clientData.landingPage || null,
    pages_visited:     clientData.pagesVisited || [],
    visitor_token:     clientData.visitorToken || null,
  });

  if (error) {
    console.error('Failed to create chat session:', error.message);
    return NextResponse.json({ error: 'Failed to create session.' }, { status: 500 });
  }

  return NextResponse.json({ sessionToken });
}

// ── PATCH: Update session ───────────────────────────────────────────────────

export async function PATCH(req: Request) {
  let body: {
    sessionToken: string;
    agentId?: string;
    message?: { role: string; content: string; agent: string; timestamp: string };
    strike?: { type: string; message: string; timestamp: string };
    status?: string;
    summarySent?: boolean;
    summarySentTo?: string;
    pagesVisited?: string[];
    sessionDuration?: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const { sessionToken } = body;
  if (!sessionToken) {
    return NextResponse.json({ error: 'sessionToken is required.' }, { status: 400 });
  }

  const { data: session, error: fetchError } = await supabaseAdmin
    .from('chat_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .single();

  if (fetchError || !session) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    last_message_at: new Date().toISOString(),
  };

  if (body.agentId) updates.agent_id = body.agentId;

  if (body.message) {
    const messages = Array.isArray(session.messages) ? session.messages : [];
    messages.push(body.message);
    updates.messages = messages;
    updates.message_count = (session.message_count || 0) + 1;
  }

  if (body.strike) {
    const violations = Array.isArray(session.violations) ? session.violations : [];
    violations.push(body.strike);
    updates.violations = violations;
    updates.strike_count = (session.strike_count || 0) + 1;
  }

  if (body.status) {
    updates.status = body.status;
    if (body.status === 'blocked' || body.status === 'completed') {
      updates.ended_at = new Date().toISOString();
    }
  }

  if (body.summarySent !== undefined) updates.summary_sent = body.summarySent;
  if (body.summarySentTo) updates.summary_sent_to = body.summarySentTo;
  if (body.pagesVisited) updates.pages_visited = body.pagesVisited;
  if (body.sessionDuration) updates.session_duration_secs = body.sessionDuration;

  const { error: updateError } = await supabaseAdmin
    .from('chat_sessions')
    .update(updates)
    .eq('session_token', sessionToken);

  if (updateError) {
    console.error('Failed to update chat session:', updateError.message);
    return NextResponse.json({ error: 'Failed to update session.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
