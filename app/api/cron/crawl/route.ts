import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { autoDiscover } from '@/lib/leadDiscovery';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ── GET — Cron-triggered lead discovery (daily fallback) ─────────────────────
// Primary discovery now happens on-login via /api/leads/discover.
// This cron is a fallback if no one logs in for a day.

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await autoDiscover(supabaseAdmin as any);

    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    console.error('[CRON /api/cron/crawl] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
