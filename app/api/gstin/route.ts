export const runtime = 'edge';

// ── GSTIN Lookup via GSP (Masters India free tier)
//
// Setup (one-time):
//   1. Register free at https://www.mastersindia.co/gst-api/
//   2. Get your API key from the dashboard
//   3. Add to Vercel → Settings → Environment Variables:
//        MASTERS_INDIA_API_KEY = <your key>
//        MASTERS_INDIA_GSTIN   = 33AAPCR0554G1ZE   (your own GSTIN — required by their API)
//   4. Redeploy — lookups will work automatically

import { NextResponse } from 'next/server';

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

function buildAddress(adr: Record<string, string>): string {
  return [adr.bno, adr.flno, adr.bnm, adr.st, adr.loc, adr.dst, adr.stcd, adr.pncd]
    .filter(Boolean)
    .join(', ');
}

function parseGstResponse(d: Record<string, unknown>, gstin: string) {
  const pradr = d.pradr as Record<string, unknown> | undefined;
  const adrObj = (
    pradr?.addr ?? pradr?.adr ??
    ((d.adadr as unknown[])?.[0] as Record<string, unknown>)?.addr ?? {}
  ) as Record<string, string>;

  let reg_date: string | null = null;
  if (d.rgdt) {
    const [dd, mm, yyyy] = String(d.rgdt).split('/');
    if (dd && mm && yyyy) reg_date = `${yyyy}-${mm}-${dd}`;
  }

  return {
    gstin,
    legal_name:  String(d.lgnm     ?? d.legal_name     ?? ''),
    trade_name:  String(d.tradeNam ?? d.trade_name     ?? ''),
    gst_status:  String(d.sts      ?? d.status         ?? ''),
    entity_type: String(d.ctb      ?? d.constitution   ?? ''),
    state:       String(adrObj.stcd ?? d.state          ?? ''),
    pincode:     String(adrObj.pncd ?? d.pincode        ?? ''),
    address:     buildAddress(adrObj),
    reg_date,
  };
}

export async function GET(req: Request) {
  const gstin = new URL(req.url).searchParams.get('gstin')?.trim().toUpperCase() ?? '';

  if (!GSTIN_RE.test(gstin)) {
    return NextResponse.json({ error: 'Invalid GSTIN format.' }, { status: 400 });
  }

  const apiKey      = process.env.MASTERS_INDIA_API_KEY ?? '';
  const yourGstin   = process.env.MASTERS_INDIA_GSTIN   ?? '33AAPCR0554G1ZE';

  if (!apiKey) {
    return NextResponse.json(
      { error: 'GSTIN_API_KEY not configured. Add MASTERS_INDIA_API_KEY to Vercel environment variables.' },
      { status: 503 }
    );
  }

  try {
    // Masters India GSTIN Verification API
    // Docs: https://developer.mastersindia.co/docs/gstin
    const url = `https://api.mastersindia.co/mastersindia/v1/search/gstin/${gstin}?user_gstin=${yourGstin}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    const json = await res.json() as Record<string, unknown>;

    if (!res.ok || json.success === false || json.error) {
      const msg = String(json.message ?? json.error ?? 'Lookup failed');
      return NextResponse.json({ error: msg }, { status: res.ok ? 400 : res.status });
    }

    // Masters India wraps response in .data
    const d = (json.data ?? json) as Record<string, unknown>;

    return NextResponse.json(parseGstResponse(d, gstin));

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `API error: ${msg}` }, { status: 502 });
  }
}
