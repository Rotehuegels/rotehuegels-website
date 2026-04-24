// GSTIN lookup endpoint. Thin wrapper around lib/gstin/gateway — the gateway
// enforces cache-first, single-credit-spend-per-gstin, and atomic persist.
//
// Response adds:
//   source      — 'cache' | 'vendor' (lets the UI show "✓ cached, free lookup")
//   fetched_at  — ISO timestamp of the stored response
//   raw         — full verbatim GSTINCheck payload (so callers can persist
//                 anything they want without spending another credit)

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { getGstinData, denormalize } from '@/lib/gstin/gateway';

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

async function getCredits() {
  const { data } = await supabaseAdmin
    .from('app_settings')
    .select('key, value')
    .in('key', ['gstin_credits_total', 'gstin_credits_used', 'gstin_credits_expiry']);

  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;

  const total  = parseInt(map['gstin_credits_total'] ?? '20', 10);
  const used   = parseInt(map['gstin_credits_used']  ?? '0',  10);
  const expiry = map['gstin_credits_expiry'] ?? '2026-04-30';

  return { total, used, remaining: total - used, expiry };
}

export async function GET(req: Request) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url    = new URL(req.url);
  const gstin  = url.searchParams.get('gstin')?.trim().toUpperCase() ?? '';
  const force  = url.searchParams.get('refresh') === '1';
  const onlyCredits = url.searchParams.get('credits') === '1';

  if (onlyCredits) {
    const credits = await getCredits();
    return NextResponse.json(credits);
  }

  if (!GSTIN_RE.test(gstin)) {
    return NextResponse.json({ error: 'Invalid GSTIN format.' }, { status: 400 });
  }

  // Only gate credit exhaustion when we'd actually spend one. A cache hit
  // spends nothing, so refusing on zero credits would block legitimate reads.
  if (force || !(await hasCache(gstin))) {
    const credits = await getCredits();
    if (credits.remaining <= 0) {
      return NextResponse.json(
        { error: 'No GSTIN API credits remaining. Please renew at gstincheck.co.in.' },
        { status: 402 },
      );
    }
  }

  try {
    const { source, raw, fetched_at } = await getGstinData(supabaseAdmin, gstin, { forceRefresh: force });
    const flat = denormalize(raw, gstin);
    const credits = await getCredits();

    return NextResponse.json({
      ...flat,
      source,
      fetched_at,
      raw,
      credits_remaining: credits.remaining,
      credits_expiry: credits.expiry,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

async function hasCache(gstin: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('gstin_lookup_cache')
    .select('gstin')
    .eq('gstin', gstin)
    .maybeSingle();
  return Boolean(data);
}
