import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { discoverAndSave, autoDiscover, type LeadType } from '@/lib/leadDiscovery';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST — Trigger lead discovery for a specific type
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const type = body.type as LeadType | undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = type
      ? await discoverAndSave(type, supabaseAdmin as any)
      : await autoDiscover(supabaseAdmin as any);

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[POST /api/leads/discover]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Discovery failed' },
      { status: 500 },
    );
  }
}
