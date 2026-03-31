// ── GSTIN Lookup via GSTINCheck API
//
// Env vars required:
//   GSTINCHECK_API_KEY — from gstincheck.co.in dashboard
//
// Tracks API credit usage in app_settings table.

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

function buildAddress(adr: Record<string, string>): string {
  return [adr.bno, adr.flno, adr.bnm, adr.st, adr.loc, adr.dst, adr.stcd, adr.pncd]
    .filter(Boolean)
    .join(', ');
}

async function getCredits() {
  const { data } = await supabaseAdmin
    .from('app_settings')
    .select('key, value')
    .in('key', ['gstin_credits_total', 'gstin_credits_used', 'gstin_credits_expiry']);

  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;

  const total    = parseInt(map['gstin_credits_total']  ?? '20', 10);
  const used     = parseInt(map['gstin_credits_used']   ?? '0',  10);
  const expiry   = map['gstin_credits_expiry'] ?? '2026-04-30';

  return { total, used, remaining: total - used, expiry };
}

async function incrementCreditsUsed(currentUsed: number) {
  await supabaseAdmin
    .from('app_settings')
    .update({ value: String(currentUsed + 1) })
    .eq('key', 'gstin_credits_used');
}

export async function GET(req: Request) {
  const url    = new URL(req.url);
  const gstin  = url.searchParams.get('gstin')?.trim().toUpperCase() ?? '';
  const onlyCredits = url.searchParams.get('credits') === '1';

  // Credits-only request (for initial display on page load)
  if (onlyCredits) {
    const credits = await getCredits();
    return NextResponse.json(credits);
  }

  if (!GSTIN_RE.test(gstin)) {
    return NextResponse.json({ error: 'Invalid GSTIN format.' }, { status: 400 });
  }

  const apiKey = process.env.GSTINCHECK_API_KEY ?? '';
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GSTINCHECK_API_KEY not configured. Add it to Vercel environment variables.' },
      { status: 503 }
    );
  }

  // Check credits before calling the API
  const credits = await getCredits();
  if (credits.remaining <= 0) {
    return NextResponse.json(
      { error: 'No GSTIN API credits remaining. Please renew at gstincheck.co.in.' },
      { status: 402 }
    );
  }

  try {
    const apiUrl = `https://sheet.gstincheck.co.in/check/${apiKey}/${gstin}`;
    const res    = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    const json = await res.json() as Record<string, unknown>;

    if (!res.ok || json.flag === false || json.flag === 'N') {
      const msg = String(json.message ?? json.error ?? 'GSTIN not found.');
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Increment usage after a successful call
    await incrementCreditsUsed(credits.used);
    const remaining = credits.remaining - 1;

    const d = (json.data ?? json) as Record<string, unknown>;

    const pradr  = d.pradr as Record<string, unknown> | undefined;
    const adrObj = (
      pradr?.addr ?? pradr?.adr ??
      ((d.adadr as unknown[])?.[0] as Record<string, unknown>)?.addr ?? {}
    ) as Record<string, string>;

    let reg_date: string | null = null;
    if (d.rgdt) {
      const [dd, mm, yyyy] = String(d.rgdt).split('/');
      if (dd && mm && yyyy) reg_date = `${yyyy}-${mm}-${dd}`;
    }

    return NextResponse.json({
      gstin,
      legal_name:  String(d.lgnm     ?? d.legal_name   ?? ''),
      trade_name:  String(d.tradeNam ?? d.trade_name   ?? ''),
      gst_status:  String(d.sts      ?? d.status       ?? ''),
      entity_type: String(d.ctb      ?? d.constitution ?? ''),
      state:       String(adrObj.stcd ?? d.state        ?? ''),
      pincode:     String(adrObj.pncd ?? d.pincode      ?? ''),
      address:     buildAddress(adrObj),
      reg_date,
      credits_remaining: remaining,
      credits_expiry:    credits.expiry,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `API error: ${msg}` }, { status: 502 });
  }
}
