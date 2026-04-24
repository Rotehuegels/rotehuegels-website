// Script-side counterpart of lib/gstin/gateway.ts — same contract, same
// cache-first behaviour, same persist_gstin_lookup RPC. Exists as a .mjs
// so node-run scripts (seed-psu-gstins, validate-gstin-candidates, etc.)
// can import it without a TS toolchain.
//
// If you change the contract here, change it in gateway.ts too.

const VENDOR_URL = (key, gstin) => `https://sheet.gstincheck.co.in/check/${key}/${gstin}`;

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} sb
 * @param {string} gstin
 * @param {{ forceRefresh?: boolean, apiKey?: string }} [opts]
 * @returns {Promise<{ source: 'cache' | 'vendor', raw: any, fetched_at: string }>}
 */
export async function getGstinData(sb, gstin, opts = {}) {
  // 1. Cache first
  if (!opts.forceRefresh) {
    const { data: cached, error: readErr } = await sb
      .from('gstin_lookup_cache')
      .select('raw_response, fetched_at')
      .eq('gstin', gstin)
      .maybeSingle();
    if (readErr) throw new Error(`cache read failed: ${readErr.message}`);
    if (cached) {
      await sb.rpc('bump_gstin_cache_hit', { p_gstin: gstin });
      return { source: 'cache', raw: cached.raw_response, fetched_at: cached.fetched_at };
    }
  }

  // 2. Vendor
  const apiKey = opts.apiKey ?? process.env.GSTINCHECK_API_KEY;
  if (!apiKey) throw new Error('GSTINCHECK_API_KEY not configured.');

  const res = await fetch(VENDOR_URL(apiKey, gstin), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  const json = await res.json();

  if (!res.ok || json?.flag === false || json?.flag === 'N') {
    const msg = String(json?.message ?? `vendor HTTP ${res.status}`);
    const err = new Error(msg);
    err.raw = json;
    err.vendorInvalid = true;
    throw err;
  }

  // 3. Atomic persist (raw + credit increment)
  const { data: fetched_at, error: persistErr } = await sb.rpc('persist_gstin_lookup', {
    p_gstin: gstin,
    p_response: json,
  });
  if (persistErr) {
    throw new Error(`persist failed after vendor call (credit spent, data orphaned): ${persistErr.message}`);
  }

  return { source: 'vendor', raw: json, fetched_at: String(fetched_at ?? new Date().toISOString()) };
}
