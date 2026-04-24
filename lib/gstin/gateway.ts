// GSTIN gateway — the single point that ever spends a GSTINCheck credit.
//
// Contract:
//   1. Every caller goes through getGstinData().
//   2. getGstinData() hits the cache first.
//   3. On cache miss it calls gstincheck.co.in exactly once and persists the
//      full verbatim response via persist_gstin_lookup() RPC, which writes
//      raw_response to gstin_lookup_cache AND increments gstin_credits_used
//      in one atomic transaction.
//   4. The raw response is the source of truth. denormalize() is a
//      convenience projection for UI consumers — never stored exclusively.
//
// Do NOT call gstincheck.co.in from anywhere else in this codebase.

import type { SupabaseClient } from '@supabase/supabase-js';

export type GstinRawResponse = {
  data?: Record<string, unknown>;
  flag?: boolean;
  message?: string;
};

export type GstinFetchResult = {
  source: 'cache' | 'vendor';
  raw: GstinRawResponse;
  fetched_at: string;
};

export type GstinDenormalised = {
  gstin: string;
  legal_name: string;
  trade_name: string;
  gst_status: string;
  entity_type: string;
  state: string;
  pincode: string;
  address: string;
  reg_date: string | null;
};

const VENDOR_URL = (key: string, gstin: string) =>
  `https://sheet.gstincheck.co.in/check/${key}/${gstin}`;

/**
 * Fetch GSTIN data through the caching gateway.
 *
 * @param supabase       — Supabase client with at least write access to
 *                         gstin_lookup_cache and app_settings.
 * @param gstin          — 15-char GSTIN.
 * @param opts.forceRefresh — skip cache, always spend a credit and overwrite.
 *                         Use when a GSTIN has been suspended/cancelled and
 *                         you need current status.
 * @param opts.apiKey    — override the vendor key (defaults to GSTINCHECK_API_KEY).
 */
export async function getGstinData(
  supabase: SupabaseClient,
  gstin: string,
  opts: { forceRefresh?: boolean; apiKey?: string } = {},
): Promise<GstinFetchResult> {
  // 1. Cache lookup (free)
  if (!opts.forceRefresh) {
    const { data: cached, error: readErr } = await supabase
      .from('gstin_lookup_cache')
      .select('raw_response, fetched_at')
      .eq('gstin', gstin)
      .maybeSingle();

    if (readErr) throw new Error(`Cache read failed: ${readErr.message}`);

    if (cached) {
      await supabase.rpc('bump_gstin_cache_hit', { p_gstin: gstin });
      return {
        source: 'cache',
        raw: cached.raw_response as GstinRawResponse,
        fetched_at: cached.fetched_at as string,
      };
    }
  }

  // 2. Vendor call — spends exactly one credit
  const apiKey = opts.apiKey ?? process.env.GSTINCHECK_API_KEY;
  if (!apiKey) throw new Error('GSTINCHECK_API_KEY not configured.');

  const res = await fetch(VENDOR_URL(apiKey, gstin), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
  const json = (await res.json()) as GstinRawResponse;

  if (!res.ok || json.flag === false) {
    throw new Error(String(json.message ?? 'GSTIN not found.'));
  }

  // 3. Atomic persist (raw response + credit increment). If this fails the
  // credit is wasted at the vendor but we surface the error so the caller
  // can retry; the next retry will hit vendor again (one more credit) so
  // this path should be rare.
  const { data: persistedAt, error: persistErr } = await supabase.rpc('persist_gstin_lookup', {
    p_gstin: gstin,
    p_response: json,
  });
  if (persistErr) {
    throw new Error(`Persist failed after vendor call (credit spent, data saved nowhere): ${persistErr.message}`);
  }

  return {
    source: 'vendor',
    raw: json,
    fetched_at: String(persistedAt ?? new Date().toISOString()),
  };
}

/**
 * Project a raw GSTINCheck response into the flat shape that UI consumers
 * have historically used. The raw object itself stays available via .raw if
 * a caller needs a field this function doesn't expose yet.
 */
export function denormalize(raw: GstinRawResponse, gstin: string): GstinDenormalised {
  const d = (raw.data ?? raw) as Record<string, unknown>;
  const pradr = d.pradr as Record<string, unknown> | undefined;
  const adrObj = (
    pradr?.addr ??
    pradr?.adr ??
    ((d.adadr as unknown[])?.[0] as Record<string, unknown>)?.addr ??
    {}
  ) as Record<string, string>;

  let reg_date: string | null = null;
  if (d.rgdt) {
    const [dd, mm, yyyy] = String(d.rgdt).split('/');
    if (dd && mm && yyyy) reg_date = `${yyyy}-${mm}-${dd}`;
  }

  return {
    gstin,
    legal_name: String(d.lgnm ?? d.legal_name ?? ''),
    trade_name: String(d.tradeNam ?? d.trade_name ?? ''),
    gst_status: String(d.sts ?? d.status ?? ''),
    entity_type: String(d.ctb ?? d.constitution ?? ''),
    state: String(adrObj.stcd ?? d.state ?? ''),
    pincode: String(adrObj.pncd ?? d.pincode ?? ''),
    address: [adrObj.bno, adrObj.flno, adrObj.bnm, adrObj.st, adrObj.loc, adrObj.dst, adrObj.stcd, adrObj.pncd]
      .filter(Boolean)
      .join(', '),
    reg_date,
  };
}
