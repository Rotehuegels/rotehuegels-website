import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import RefreshButton from './RefreshButton';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtCompact = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 2 }).format(n);

interface Holding {
  id: string;
  symbol: string;
  company_name: string;
  exchange: string;
  yahoo_symbol: string;
  quantity: number;
  avg_buy_price: number;
  total_invested: number;
}

interface EnrichedHolding extends Holding {
  currentPrice: number | null;
  currentValue: number | null;
  pnl: number | null;
  pnlPct: number | null;
  dayChangePct: number | null;
}

const NSE_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

async function getNSECookie(): Promise<string> {
  const res = await fetch('https://www.nseindia.com', {
    headers: {
      'User-Agent': NSE_UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    cache: 'no-store',
  });
  // getSetCookie() returns each Set-Cookie header as a separate string (Node 18+)
  const raw: string[] =
    typeof (res.headers as { getSetCookie?: () => string[] }).getSetCookie === 'function'
      ? (res.headers as { getSetCookie: () => string[] }).getSetCookie()
      : [(res.headers.get('set-cookie') ?? '')];
  return raw.map((c) => c.split(';')[0].trim()).filter(Boolean).join('; ');
}

async function nseQuote(
  symbol: string,
  cookie: string,
): Promise<{ price: number; dayChangePct: number } | null> {
  try {
    const res = await fetch(
      `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(symbol)}`,
      {
        headers: {
          Cookie: cookie,
          'User-Agent': NSE_UA,
          Referer: 'https://www.nseindia.com/',
          Accept: 'application/json, text/plain, */*',
          'X-Requested-With': 'XMLHttpRequest',
        },
        cache: 'no-store',
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const price = json.priceInfo?.lastPrice;
    if (!price) return null;
    return { price: Number(price), dayChangePct: Number(json.priceInfo?.pChange ?? 0) };
  } catch {
    return null;
  }
}

async function fetchNSEPrices(
  equitySymbols: string[],
): Promise<{ priceMap: Record<string, { price: number; dayChangePct: number }>; goldPrice: number | null }> {
  if (!equitySymbols.length) return { priceMap: {}, goldPrice: null };
  try {
    const cookie = await getNSECookie();
    if (!cookie) return { priceMap: {}, goldPrice: null };

    // Fetch all equity symbols + GOLDBEES (gold proxy) in parallel
    const allSymbols = [...equitySymbols, 'GOLDBEES'];
    const results = await Promise.all(allSymbols.map((s) => nseQuote(s, cookie)));

    const priceMap: Record<string, { price: number; dayChangePct: number }> = {};
    allSymbols.forEach((sym, i) => {
      const r = results[i];
      if (r) priceMap[sym] = r;
    });

    // GOLDBEES: 1 unit ≈ 1/100 gram gold → multiply by 100 for per-gram price
    const goldData = priceMap['GOLDBEES'];
    const goldPrice = goldData ? goldData.price * 100 : null;
    delete priceMap['GOLDBEES'];

    return { priceMap, goldPrice };
  } catch {
    return { priceMap: {}, goldPrice: null };
  }
}

export default async function InvestmentsPage() {
  const { data: holdings } = await supabaseAdmin
    .from('demat_holdings')
    .select('*')
    .order('total_invested', { ascending: false });

  const rows: Holding[] = holdings ?? [];

  // Fetch prices from NSE — equity symbols only (SGB-DIRECT priced via gold proxy)
  const equitySymbols = rows.filter((h) => h.symbol !== 'SGB-DIRECT').map((h) => h.symbol);
  const { priceMap, goldPrice } = await fetchNSEPrices(equitySymbols);

  const enriched: EnrichedHolding[] = rows.map((h) => {
    let currentPrice: number | null = null;
    let dayChangePct: number | null = null;

    if (h.symbol === 'SGB-DIRECT') {
      currentPrice = goldPrice;
    } else {
      const live = priceMap[h.symbol];
      currentPrice = live?.price ?? null;
      dayChangePct = live?.dayChangePct ?? null;
    }

    const currentValue = currentPrice !== null ? currentPrice * h.quantity : null;
    const pnl = currentValue !== null ? currentValue - h.total_invested : null;
    const pnlPct = pnl !== null ? (pnl / h.total_invested) * 100 : null;
    return { ...h, currentPrice, currentValue, pnl, pnlPct, dayChangePct };
  });

  const totalInvested = enriched.reduce((s, h) => s + h.total_invested, 0);
  const totalCurrent = enriched.reduce((s, h) => s + (h.currentValue ?? h.total_invested), 0);
  const totalPnl = totalCurrent - totalInvested;
  const totalPnlPct = (totalPnl / totalInvested) * 100;
  const liveCount = enriched.filter((h) => h.currentPrice !== null).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Investments</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            ICICI Direct — Demat Portfolio &nbsp;·&nbsp; {liveCount}/{enriched.length} live · NSE
          </p>
        </div>
        <RefreshButton />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className={`${glass} p-5`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Total Invested</p>
          <p className="mt-2 text-xl font-bold text-indigo-400">{fmtCompact(totalInvested)}</p>
          <p className="mt-0.5 text-xs text-zinc-600">{fmt(totalInvested)}</p>
        </div>
        <div className={`${glass} p-5`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Current Value</p>
          <p className="mt-2 text-xl font-bold text-indigo-300">{fmtCompact(totalCurrent)}</p>
          <p className="mt-0.5 text-xs text-zinc-600">{fmt(totalCurrent)}</p>
        </div>
        <div className={`${glass} p-5`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Total P&amp;L</p>
          <p className={`mt-2 text-xl font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalPnl >= 0 ? '+' : ''}{fmtCompact(totalPnl)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-600">{fmt(Math.abs(totalPnl))}</p>
        </div>
        <div className={`${glass} p-5`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">P&amp;L %</p>
          <div className="mt-2 flex items-center gap-1.5">
            {totalPnl >= 0
              ? <TrendingUp className="h-5 w-5 text-emerald-400" />
              : <TrendingDown className="h-5 w-5 text-rose-400" />}
            <p className={`text-xl font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalPnl >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
            </p>
          </div>
          <p className="mt-0.5 text-xs text-zinc-600">{enriched.length} holdings</p>
        </div>
      </div>

      {/* Holdings Table */}
      <div className={glass}>
        <div className="flex items-center gap-3 border-b border-zinc-800 px-6 py-4">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
          <h2 className="font-semibold text-white">Holdings</h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                <th className="px-6 py-3 text-left">Stock</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Avg Buy</th>
                <th className="px-4 py-3 text-right">Invested</th>
                <th className="px-4 py-3 text-right">Current Price</th>
                <th className="px-4 py-3 text-right">Current Value</th>
                <th className="px-4 py-3 text-right">P&amp;L</th>
                <th className="px-6 py-3 text-right">P&amp;L %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {enriched.map((h) => {
                const gain = h.pnl !== null ? h.pnl >= 0 : null;
                return (
                  <tr key={h.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-white">{h.symbol}</p>
                      <p className="text-xs text-zinc-500 truncate max-w-[180px]">{h.company_name}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right text-zinc-300">{h.quantity}</td>
                    <td className="px-4 py-3.5 text-right text-zinc-300">
                      {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(h.avg_buy_price)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-zinc-300">
                      {fmtCompact(h.total_invested)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {h.currentPrice !== null ? (
                        <div>
                          <p className="text-white font-medium">
                            {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(h.currentPrice)}
                          </p>
                          {h.dayChangePct !== null && (
                            <p className={`text-xs ${h.dayChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {h.dayChangePct >= 0 ? '+' : ''}{h.dayChangePct.toFixed(2)}%
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-600">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right text-zinc-300">
                      {h.currentValue !== null ? fmtCompact(h.currentValue) : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {h.pnl !== null ? (
                        <span className={gain ? 'text-emerald-400' : 'text-rose-400'}>
                          {gain ? '+' : ''}{fmtCompact(h.pnl)}
                        </span>
                      ) : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {h.pnlPct !== null ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          gain ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {gain ? '+' : ''}{h.pnlPct.toFixed(2)}%
                        </span>
                      ) : <span className="text-zinc-600">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totals row */}
            <tfoot>
              <tr className="border-t border-zinc-700 bg-zinc-900/60 text-sm font-semibold">
                <td className="px-6 py-3.5 text-zinc-400" colSpan={3}>Total</td>
                <td className="px-4 py-3.5 text-right text-indigo-400">{fmtCompact(totalInvested)}</td>
                <td className="px-4 py-3.5" />
                <td className="px-4 py-3.5 text-right text-indigo-300">{fmtCompact(totalCurrent)}</td>
                <td className="px-4 py-3.5 text-right">
                  <span className={totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {totalPnl >= 0 ? '+' : ''}{fmtCompact(totalPnl)}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    totalPnl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {totalPnl >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-zinc-800/60">
          {enriched.map((h) => {
            const gain = h.pnl !== null ? h.pnl >= 0 : null;
            return (
              <div key={h.id} className="px-4 py-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-white">{h.symbol}</p>
                    <p className="text-xs text-zinc-500">{h.company_name}</p>
                  </div>
                  {h.pnlPct !== null && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      gain ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {gain ? '+' : ''}{h.pnlPct.toFixed(2)}%
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-zinc-500">Qty</p>
                    <p className="text-zinc-300">{h.quantity}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Invested</p>
                    <p className="text-zinc-300">{fmtCompact(h.total_invested)}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Current</p>
                    <p className="text-zinc-300">{h.currentValue !== null ? fmtCompact(h.currentValue) : '—'}</p>
                  </div>
                </div>
                {h.pnl !== null && (
                  <p className={`text-xs font-medium ${gain ? 'text-emerald-400' : 'text-rose-400'}`}>
                    P&L: {gain ? '+' : ''}{fmt(h.pnl)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
