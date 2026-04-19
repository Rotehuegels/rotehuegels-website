import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { discoverAndSave, type LeadType } from '@/lib/leadDiscovery';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function requireUser() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

// ── POST — Trigger AI-powered lead discovery ─────────────────────────────────
// Kept for backward compat — proxies to new multi-AI discovery system

export async function POST(req: Request) {
  if (!(await requireUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const type: LeadType = body.type ?? 'supplier';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await discoverAndSave(type, supabaseAdmin as any);

    return NextResponse.json({
      ok: true,
      ...result,
      // Legacy field compat
      resultsCount: result.saved,
    });
  } catch (err: unknown) {
    console.error('[POST /api/crawl] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ── GET — List recent crawl jobs (legacy) ────────────────────────────────────

export async function GET() {
  if (!(await requireUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { data, error } = await supabaseAdmin
      .from('crawl_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return NextResponse.json({ jobs: data ?? [] });
  } catch (err: unknown) {
    console.error('[GET /api/crawl] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
