export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const NSE_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

const NSE_SYMBOL_MAP: Record<string, string> = {
  SGBT65: 'SGBSEP31II',
  'SGB-DIRECT': 'SGBSEP31II',
};

// ── Yahoo Finance (fast, parallel, no auth needed) ──────────────────────────

async function yahooQuote(yahooSymbol: string): Promise<{ price: number; dayChangePct: number } | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) },
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

// ── NSE (for SGB bonds that Yahoo doesn't have) ─────────────────────────────

async function getNSECookie(): Promise<string> {
  try {
    const res = await fetch('https://www.nseindia.com', {
      headers: { 'User-Agent': NSE_UA, Accept: 'text/html' },
      signal: AbortSignal.timeout(5000),
    });
    const raw: string[] =
      typeof (res.headers as { getSetCookie?: () => string[] }).getSetCookie === 'function'
        ? (res.headers as { getSetCookie: () => string[] }).getSetCookie()
        : [(res.headers.get('set-cookie') ?? '')];
    return raw.map(c => c.split(';')[0].trim()).filter(Boolean).join('; ');
  } catch { return ''; }
}

async function nseQuote(symbol: string, cookie: string): Promise<{ price: number; dayChangePct: number } | null> {
  if (!cookie) return null;
  try {
    const res = await fetch(
      `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(symbol)}`,
      {
        headers: { Cookie: cookie, 'User-Agent': NSE_UA, Referer: 'https://www.nseindia.com/', Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const price = json.priceInfo?.lastPrice;
    if (!price) return null;
    return { price: Number(price), dayChangePct: Number(json.priceInfo?.pChange ?? 0) };
  } catch { return null; }
}

// ── GET: Refresh all prices in parallel ─────────────────────────────────────

export async function GET() {
  const { data: holdings } = await supabaseAdmin
    .from('demat_holdings')
    .select('id, symbol, yahoo_symbol');

  if (!holdings?.length) return NextResponse.json({ error: 'No holdings' }, { status: 404 });

  // SGB bonds share the same NSE quote — fetch once, apply to all SGB symbols
  const sgbHoldings = holdings.filter(h => h.symbol.startsWith('SGB'));
  const regularHoldings = holdings.filter(h => !h.symbol.startsWith('SGB'));

  const now = new Date().toISOString();

  // Fetch regular stocks from Yahoo in parallel (all at once, fast)
  const yahooPromises = regularHoldings.map(async h => {
    const quote = await yahooQuote(h.yahoo_symbol);
    return { ...h, quote };
  });

  // Fetch SGB price once from NSE, apply to all SGB holdings (they share the same price)
  const nsePromise = (async () => {
    if (!sgbHoldings.length) return [];
    const cookie = await getNSECookie();
    // Fetch one SGB quote — all SGB bonds have the same market price
    const sgbQuote = await nseQuote('SGBSEP31II', cookie);
    return sgbHoldings.map(h => ({ ...h, quote: sgbQuote }));
  })();

  // Run Yahoo + NSE in parallel
  const [yahooResults, nseResults] = await Promise.all([
    Promise.all(yahooPromises),
    nsePromise,
  ]);

  const allResults = [...yahooResults, ...nseResults];

  // Batch update DB
  const updates = allResults
    .filter(r => r.quote)
    .map(r => supabaseAdmin.from('demat_holdings').update({
      last_price: r.quote!.price,
      last_day_change_pct: r.quote!.dayChangePct,
      price_updated_at: now,
    }).eq('id', r.id));

  await Promise.all(updates);

  const fetched = allResults.filter(r => r.quote).length;
  return NextResponse.json({
    fetched,
    total: holdings.length,
    updatedAt: now,
    results: allResults.map(r => ({
      symbol: r.symbol,
      price: r.quote?.price ?? null,
      changePct: r.quote?.dayChangePct ?? null,
    })),
  });
}
