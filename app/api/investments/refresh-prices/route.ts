export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const NSE_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

const NSE_SYMBOL_MAP: Record<string, string> = {
  SGBT65: 'SGBSEP31II',
  'SGB-DIRECT': 'SGBSEP31II',
};

// ── NSE fetching (works for all Indian stocks including SGB) ────────────────

async function getNSECookie(): Promise<string> {
  try {
    const res = await fetch('https://www.nseindia.com', {
      headers: { 'User-Agent': NSE_UA, Accept: 'text/html' },
      cache: 'no-store',
    });
    const raw: string[] =
      typeof (res.headers as { getSetCookie?: () => string[] }).getSetCookie === 'function'
        ? (res.headers as { getSetCookie: () => string[] }).getSetCookie()
        : [(res.headers.get('set-cookie') ?? '')];
    return raw.map(c => c.split(';')[0].trim()).filter(Boolean).join('; ');
  } catch { return ''; }
}

async function nseQuote(symbol: string, cookie: string): Promise<{ price: number; dayChangePct: number } | null> {
  try {
    const res = await fetch(
      `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(symbol)}`,
      {
        headers: {
          Cookie: cookie, 'User-Agent': NSE_UA,
          Referer: 'https://www.nseindia.com/',
          Accept: 'application/json',
        },
        cache: 'no-store',
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const price = json.priceInfo?.lastPrice;
    if (!price) return null;
    return { price: Number(price), dayChangePct: Number(json.priceInfo?.pChange ?? 0) };
  } catch { return null; }
}

// ── Yahoo fallback ──────────────────────────────────────────────────────────

async function yahooQuote(yahooSymbol: string): Promise<{ price: number; dayChangePct: number } | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    const price = meta.regularMarketPrice;
    const prev = meta.chartPreviousClose ?? meta.previousClose;
    return { price, dayChangePct: prev ? ((price - prev) / prev) * 100 : 0 };
  } catch { return null; }
}

// ── GET: Refresh all prices (called from client in background) ──────────────

export async function GET() {
  const { data: holdings } = await supabaseAdmin
    .from('demat_holdings')
    .select('id, symbol, yahoo_symbol');

  if (!holdings?.length) return NextResponse.json({ error: 'No holdings' }, { status: 404 });

  // Try NSE first (handles SGB bonds)
  let cookie = '';
  try { cookie = await getNSECookie(); } catch {}

  const results: Array<{ symbol: string; price: number | null; changePct: number | null }> = [];
  const now = new Date().toISOString();

  for (const h of holdings) {
    const nseSymbol = NSE_SYMBOL_MAP[h.symbol] ?? h.symbol;

    // Try NSE first, then Yahoo
    let quote = cookie ? await nseQuote(nseSymbol, cookie) : null;
    if (!quote) quote = await yahooQuote(h.yahoo_symbol);

    if (quote) {
      await supabaseAdmin.from('demat_holdings').update({
        last_price: quote.price,
        last_day_change_pct: quote.dayChangePct,
        price_updated_at: now,
      }).eq('id', h.id);

      results.push({ symbol: h.symbol, price: quote.price, changePct: quote.dayChangePct });
    } else {
      results.push({ symbol: h.symbol, price: null, changePct: null });
    }
  }

  const fetched = results.filter(r => r.price !== null).length;
  return NextResponse.json({ fetched, total: holdings.length, results, updatedAt: now });
}
