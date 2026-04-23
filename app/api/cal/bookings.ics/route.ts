// Host calendar feed — one URL the host subscribes to from Google / Microsoft
// / Apple / Zoho / any iCalendar-compliant app. Every confirmed booking in
// the future appears automatically; cancellations are emitted with
// METHOD:CANCEL so subscribing calendars remove them on next refresh.
//
// Subscribe URL pattern (shared via env):
//   https://www.rotehuegels.com/api/cal/bookings.ics?token=<CALENDAR_SUBSCRIBE_SECRET>

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { buildIcsCalendar, type IcsEventInput } from '@/lib/bookingsEmail';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const expected = process.env.CALENDAR_SUBSCRIBE_SECRET;

  if (!expected) {
    return NextResponse.json({ error: 'Calendar feed not configured' }, { status: 503 });
  }
  if (!token || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const host = url.searchParams.get('host'); // optional filter by host email
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.rotehuegels.com';

  // Pull every confirmed + cancelled booking from the last 30 days forward.
  // Including cancellations (with STATUS:CANCELLED) lets subscribing calendars
  // clean up events previously synced.
  const from = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
  let query = supabaseAdmin
    .from('bookings')
    .select(`
      id, starts_at, ends_at, status, visitor_name, visitor_email,
      visitor_company, visitor_phone, visitor_topic, cancel_token,
      event_type:booking_event_types ( id, slug, name, host_name, host_email, timezone )
    `)
    .gte('starts_at', from)
    .in('status', ['confirmed', 'cancelled']);

  const { data, error } = await query;
  if (error) {
    console.error('[cal feed] query failed', error);
    return NextResponse.json({ error: 'Feed query failed' }, { status: 500 });
  }

  type Row = {
    id: string; starts_at: string; ends_at: string; status: string;
    visitor_name: string; visitor_email: string;
    visitor_company: string | null; visitor_phone: string | null;
    visitor_topic: string | null; cancel_token: string;
    event_type: { id: string; slug: string; name: string; host_name: string; host_email: string; timezone: string } | null;
  };
  const rows = (data ?? []) as unknown as Row[];

  const events: IcsEventInput[] = rows
    .filter(r => r.event_type && (!host || r.event_type.host_email === host))
    .map(r => {
      const et = r.event_type!;
      return {
        uid: `booking-${r.id}@rotehuegels.com`,
        starts: new Date(r.starts_at),
        ends:   new Date(r.ends_at),
        summary: `${et.name} — ${r.visitor_name}${r.visitor_company ? ' · ' + r.visitor_company : ''}`,
        description:
          `${et.name}\n\n` +
          `Visitor: ${r.visitor_name}${r.visitor_company ? ' · ' + r.visitor_company : ''}\n` +
          `Email: ${r.visitor_email}\n` +
          (r.visitor_phone ? `Phone: ${r.visitor_phone}\n` : '') +
          (r.visitor_topic ? `\nTopic: ${r.visitor_topic}\n` : '') +
          `\nManage: ${siteUrl}/d/bookings`,
        organizerName: et.host_name,
        organizerEmail: et.host_email,
        attendeeName: r.visitor_name,
        attendeeEmail: r.visitor_email,
        status: r.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED',
        sequence: r.status === 'cancelled' ? 1 : 0,
        url: `${siteUrl}/d/bookings`,
      };
    });

  const ics = buildIcsCalendar(events);

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'private, max-age=300',
      'Content-Disposition': 'inline; filename="rotehuegels-bookings.ics"',
    },
  });
}
