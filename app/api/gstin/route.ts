export const runtime = 'edge';

import { NextResponse } from 'next/server';

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

function buildAddress(adr: Record<string, string>): string {
  return [adr.bno, adr.flno, adr.bnm, adr.st, adr.loc, adr.dst, adr.stcd, adr.pncd]
    .filter(Boolean)
    .join(', ');
}

// Try multiple known GST portal endpoints
const ENDPOINTS = (gstin: string) => [
  `https://api.gst.gov.in/commonapi/search?action=TP&gstin=${gstin}`,
  `https://api.gst.gov.in/commonapi/v1.0/search?action=TP&gstin=${gstin}`,
];

const HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8',
  'Origin': 'https://www.gst.gov.in',
  'Referer': 'https://www.gst.gov.in/',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
};

export async function GET(req: Request) {
  const gstin = new URL(req.url).searchParams.get('gstin')?.trim().toUpperCase() ?? '';

  if (!GSTIN_RE.test(gstin)) {
    return NextResponse.json({ error: 'Invalid GSTIN format.' }, { status: 400 });
  }

  let lastError = '';

  for (const url of ENDPOINTS(gstin)) {
    try {
      const res = await fetch(url, {
        headers: HEADERS,
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) { lastError = `HTTP ${res.status}`; continue; }

      const json = await res.json() as Record<string, unknown>;

      if (json.flag === 'N' || json.errorCode) {
        return NextResponse.json({ error: 'GSTIN not found on GST portal.' }, { status: 404 });
      }

      const d = (json.data ?? json) as Record<string, unknown>;
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

      return NextResponse.json({
        gstin,
        legal_name:  String(d.lgnm     ?? ''),
        trade_name:  String(d.tradeNam ?? ''),
        gst_status:  String(d.sts      ?? ''),
        entity_type: String(d.ctb      ?? ''),
        state:       adrObj.stcd ?? '',
        pincode:     adrObj.pncd ?? '',
        address:     buildAddress(adrObj),
        reg_date,
      });

    } catch (e) {
      lastError = e instanceof Error ? e.message : 'fetch failed';
    }
  }

  return NextResponse.json(
    { error: `GST portal unreachable: ${lastError}` },
    { status: 502 }
  );
}
