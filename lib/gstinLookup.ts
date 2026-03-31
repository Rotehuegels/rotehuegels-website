// Shared GSTIN lookup — tries server proxy first, falls back to direct browser fetch

export interface GstinData {
  gstin: string;
  legal_name: string;
  trade_name: string;
  gst_status: string;
  entity_type: string;
  state: string;
  pincode: string;
  address: string;
  reg_date: string | null;
  credits_remaining?: number;
  credits_expiry?: string;
}

function buildAddress(adr: Record<string, string>): string {
  return [adr.bno, adr.flno, adr.bnm, adr.st, adr.loc, adr.dst, adr.stcd, adr.pncd]
    .filter(Boolean)
    .join(', ');
}

function parseGstPortalResponse(json: Record<string, unknown>, gstin: string): GstinData {
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

  return {
    gstin,
    legal_name:  String(d.lgnm  ?? d.LegalName  ?? ''),
    trade_name:  String(d.tradeNam ?? d.TradeName ?? ''),
    gst_status:  String(d.sts   ?? d.Status     ?? ''),
    entity_type: String(d.ctb   ?? d.EntityType ?? ''),
    state:       adrObj.stcd ?? '',
    pincode:     adrObj.pncd ?? '',
    address:     buildAddress(adrObj),
    reg_date,
  };
}

export async function lookupGstin(gstin: string): Promise<GstinData> {
  // 1️⃣ Try our server-side proxy
  try {
    const res = await fetch(`/api/gstin?gstin=${gstin}`, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    if (res.ok && !data.error) return data as GstinData;
  } catch { /* fall through to browser fetch */ }

  // 2️⃣ Fallback: fetch directly from browser (bypasses Vercel server)
  const gstRes = await fetch(
    `https://api.gst.gov.in/commonapi/search?action=TP&gstin=${gstin}`,
    {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.gst.gov.in',
        'Referer': 'https://www.gst.gov.in/',
      },
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!gstRes.ok) throw new Error('GST portal did not respond.');

  const json = await gstRes.json() as Record<string, unknown>;

  if (json.flag === 'N' || json.errorCode) throw new Error('GSTIN not found on GST portal.');

  return parseGstPortalResponse(json, gstin);
}
