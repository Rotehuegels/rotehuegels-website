export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function deviceType(ua: string): string {
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}

function browser(ua: string): string {
  if (/edg\//i.test(ua)) return 'edge';
  if (/chrome/i.test(ua)) return 'chrome';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'safari';
  if (/firefox/i.test(ua)) return 'firefox';
  return 'other';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { visitor_id, path, referrer, utm_source, utm_medium, utm_campaign } = body;

    if (!visitor_id || !path) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const ua = req.headers.get('user-agent') ?? '';
    const country =
      req.headers.get('cf-ipcountry') ??
      req.headers.get('x-vercel-ip-country') ??
      null;

    await supabaseAdmin.from('page_views').insert([{
      visitor_id,
      path,
      referrer: referrer || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      country,
      device_type: deviceType(ua),
      browser: browser(ua),
    }]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
