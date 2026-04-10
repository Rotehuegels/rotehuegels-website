export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ── Geo-lookup (best-effort, non-blocking) ───────────────────────────────────

async function geoLookup(ip: string): Promise<{ city?: string; country?: string }> {
  // Skip private / localhost IPs
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {};
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,country`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return {};
    const data = await res.json();
    return { city: data.city || undefined, country: data.country || undefined };
  } catch {
    return {};
  }
}

// ── POST: Create a new session ───────────────────────────────────────────────

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null;

  const userAgent = req.headers.get('user-agent') || null;
  const sessionToken = crypto.randomUUID();

  // Geo-lookup in background (don't block response)
  const geo = ip ? await geoLookup(ip) : {};

  const { error } = await supabaseAdmin.from('chat_sessions').insert({
    session_token: sessionToken,
    ip_address: ip,
    city: geo.city || null,
    country: geo.country || null,
    user_agent: userAgent,
  });

  if (error) {
    console.error('Failed to create chat session:', error.message);
    return NextResponse.json({ error: 'Failed to create session.' }, { status: 500 });
  }

  return NextResponse.json({ sessionToken });
}

// ── PATCH: Update session ────────────────────────────────────────────────────

export async function PATCH(req: Request) {
  let body: {
    sessionToken: string;
    agentId?: string;
    message?: { role: string; content: string; agent: string; timestamp: string };
    strike?: { type: string; message: string; timestamp: string };
    status?: string;
    summarySent?: boolean;
    summarySentTo?: string;
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

  // Fetch current session
  const { data: session, error: fetchError } = await supabaseAdmin
    .from('chat_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .single();

  if (fetchError || !session) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  }

  // Build update payload
  const updates: Record<string, unknown> = {
    last_message_at: new Date().toISOString(),
  };

  if (body.agentId) {
    updates.agent_id = body.agentId;
  }

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

  if (body.summarySent !== undefined) {
    updates.summary_sent = body.summarySent;
  }
  if (body.summarySentTo) {
    updates.summary_sent_to = body.summarySentTo;
  }

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
