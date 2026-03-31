export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// GSTIN format: 2-digit state + 10-char PAN + entity number + Z + check digit
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

function buildAddress(adr: Record<string, string>): string {
  return [adr.bno, adr.flno, adr.bnm, adr.st, adr.loc, adr.dst, adr.stcd, adr.pncd]
    .filter(Boolean)
    .join(', ');
}

export async function GET(req: Request) {
  // Auth check
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const gstin = new URL(req.url).searchParams.get('gstin')?.trim().toUpperCase() ?? '';

  if (!GSTIN_RE.test(gstin)) {
    return NextResponse.json({ error: 'Invalid GSTIN format.' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.gst.gov.in/commonapi/search?action=TP&gstin=${gstin}`,
      {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8',
          'Origin': 'https://www.gst.gov.in',
          'Referer': 'https://www.gst.gov.in/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'GST portal did not respond. Enter details manually.' },
        { status: 502 }
      );
    }

    const json = await res.json();

    // Handle error flag from GST portal
    if (json.flag === 'N' || json.errorCode || json.message?.toLowerCase().includes('invalid')) {
      return NextResponse.json({ error: 'GSTIN not found on GST portal.' }, { status: 404 });
    }

    const d = json.data ?? json; // some responses wrap in .data, some don't

    // Build address from principal address
    const adrObj =
      d.pradr?.addr ?? d.pradr?.adr ?? d.adadr?.[0]?.addr ?? {};
    const address = buildAddress(adrObj as Record<string, string>);

    // Parse registration date
    let regDate: string | null = null;
    if (d.rgdt) {
      const [dd, mm, yyyy] = String(d.rgdt).split('/');
      if (dd && mm && yyyy) regDate = `${yyyy}-${mm}-${dd}`;
    }

    return NextResponse.json({
      gstin,
      legal_name:  d.lgnm  ?? d.LegalName ?? '',
      trade_name:  d.tradeNam ?? d.TradeName ?? '',
      gst_status:  d.sts   ?? d.Status ?? '',
      entity_type: d.ctb   ?? d.EntityType ?? '',
      state:       adrObj.stcd ?? '',
      pincode:     adrObj.pncd ?? '',
      address,
      reg_date:    regDate,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Could not reach GST portal: ${msg}. Enter details manually.` },
      { status: 502 }
    );
  }
}
