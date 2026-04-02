import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { TrendingUp, TrendingDown, BarChart3, Lightbulb } from 'lucide-react';
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
  sector: string;
}

interface EnrichedHolding extends Holding {
  currentPrice: number | null;
  currentValue: number | null;
  pnl: number | null;
  pnlPct: number | null;
  dayChangePct: number | null;
}

const NSE_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

// Maps DB symbol → NSE quote symbol
const NSE_SYMBOL_MAP: Record<string, string> = {
  SGBT65:       'SGBSEP31II',
  'SGB-DIRECT': 'SGBSEP31II',  // Direct allotment SGB — use SGBSEP31II NSE LTP
};

const SECTOR_ORDER = [
  'Gold & Sovereign Bonds',
  'Banking & Finance',
  'Metals & Mining',
  'Energy',
  'Technology',
  'Pharma & Healthcare',
  'FMCG',
  'Auto',
  'Telecom Infrastructure',
  'Other',
];

const SECTOR_COLOR: Record<string, string> = {
  'Gold & Sovereign Bonds':   'text-yellow-400',
  'Banking & Finance':        'text-sky-400',
  'Metals & Mining':          'text-orange-400',
  'Energy':                   'text-red-400',
  'Technology':               'text-indigo-400',
  'Pharma & Healthcare':      'text-emerald-400',
  'FMCG':                     'text-pink-400',
  'Auto':                     'text-purple-400',
  'Telecom Infrastructure':   'text-cyan-400',
  'Other':                    'text-zinc-400',
};

const SECTOR_DOT: Record<string, string> = {
  'Gold & Sovereign Bonds':   'bg-yellow-400',
  'Banking & Finance':        'bg-sky-400',
  'Metals & Mining':          'bg-orange-400',
  'Energy':                   'bg-red-400',
  'Technology':               'bg-indigo-400',
  'Pharma & Healthcare':      'bg-emerald-400',
  'FMCG':                     'bg-pink-400',
  'Auto':                     'bg-purple-400',
  'Telecom Infrastructure':   'bg-cyan-400',
  'Other':                    'bg-zinc-400',
};

const IDEAS = [
  {
    symbol: 'HINDZINC',
    name: 'Hindustan Zinc Ltd',
    sector: 'Metals & Mining',
    rationale: 'Core raw material for your electrochemical business. World\'s 2nd largest zinc producer, consistent high dividend payer. Direct alignment with Rotehügels project scope.',
    color: 'text-orange-400',
  },
  {
    symbol: 'LT',
    name: 'Larsen & Toubro',
    sector: 'Engineering & Capital Goods',
    rationale: 'Strong order book in industrial infrastructure. Aligns with project-execution and EPC nature of your business. Defensive large-cap with steady compounding.',
    color: 'text-blue-400',
  },
  {
    symbol: 'ABB',
    name: 'ABB India Ltd',
    sector: 'Industrial Automation',
    rationale: 'Electrical & automation equipment — directly relevant to AutoREX and industrial commissioning projects. Well-positioned for India\'s manufacturing capex cycle.',
    color: 'text-cyan-400',
  },
  {
    symbol: 'RECLTD',
    name: 'REC Ltd',
    sector: 'Energy Finance',
    rationale: 'Government NBFC funding power infrastructure. High dividend yield (~4%), low valuation. Complements existing NTPC/POWERGRID holdings in the energy sector.',
    color: 'text-red-400',
  },
  {
    symbol: 'TATAPOWER',
    name: 'Tata Power Co Ltd',
    sector: 'Energy',
    rationale: 'Renewable energy transition play with growing solar EPC and rooftop segment. Balances conventional energy exposure from ONGC/IOC/COALINDIA holdings.',
    color: 'text-emerald-400',
  },
  {
    symbol: 'TITAN',
    name: 'Titan Company Ltd',
    sector: 'Consumer Discretionary',
    rationale: 'Portfolio has zero consumer discretionary exposure. Titan is a high-quality compounder across jewellery, watches and eyewear. Diversifies away from metals/banking concentration.',
    color: 'text-yellow-400',
  },
  {
    symbol: 'SGB ↑',
    name: 'Increase SGB Allocation',
    sector: 'Gold & Sovereign Bonds',
    rationale: 'SGBs are tax-free at 8-year maturity and earn 2.5% p.a. guaranteed interest. With business exposure to lead and aluminium, increasing gold allocation improves portfolio hedging.',
    color: 'text-yellow-500',
  },
];

async function getNSECookie(): Promise<string> {
  const res = await fetch('https://www.nseindia.com', {
    headers: {
      'User-Agent': NSE_UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    cache: 'no-store',
  });
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
  symbols: string[],
): Promise<Record<string, { price: number; dayChangePct: number }>> {
  if (!symbols.length) return {};
  try {
    const cookie = await getNSECookie();
    if (!cookie) return {};
    const results = await Promise.all(symbols.map((s) => nseQuote(s, cookie)));
    const priceMap: Record<string, { price: number; dayChangePct: number }> = {};
    symbols.forEach((sym, i) => { const r = results[i]; if (r) priceMap[sym] = r; });
    return priceMap;
  } catch {
    return {};
  }
}

export default async function InvestmentsPage() {
  const { data: holdings } = await supabaseAdmin
    .from('demat_holdings')
    .select('*')
    .order('total_invested', { ascending: false });

  const rows = (holdings ?? []) as Holding[];

  // Deduplicate NSE symbols (SGB-DIRECT and SGBT65 both map to SGBSEP31II)
  const nseSymbols = [...new Set(rows.map((h) => NSE_SYMBOL_MAP[h.symbol] ?? h.symbol))];
  const priceMap = await fetchNSEPrices(nseSymbols);

  const enriched: EnrichedHolding[] = rows.map((h) => {
    const nseSymbol    = NSE_SYMBOL_MAP[h.symbol] ?? h.symbol;
    const live         = priceMap[nseSymbol];
    const currentPrice = live?.price ?? null;
    const dayChangePct = live?.dayChangePct ?? null;
    const currentValue = currentPrice !== null ? currentPrice * h.quantity : null;
    const pnl          = currentValue !== null ? currentValue - h.total_invested : null;
    const pnlPct       = pnl !== null ? (pnl / h.total_invested) * 100 : null;
    return { ...h, currentPrice, currentValue, pnl, pnlPct, dayChangePct };
  });

  const totalInvested = enriched.reduce((s, h) => s + h.total_invested, 0);
  const totalCurrent  = enriched.reduce((s, h) => s + (h.currentValue ?? h.total_invested), 0);
  const totalPnl      = totalCurrent - totalInvested;
  const totalPnlPct   = (totalPnl / totalInvested) * 100;
  const liveCount     = enriched.filter((h) => h.currentPrice !== null).length;

  // Group by sector
  const sectorMap: Record<string, EnrichedHolding[]> = {};
  for (const h of enriched) {
    const s = h.sector ?? 'Other';
    if (!sectorMap[s]) sectorMap[s] = [];
    sectorMap[s].push(h);
  }
  const orderedSectors = SECTOR_ORDER.filter((s) => sectorMap[s]);

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

      {/* Sector Allocation Bars */}
      <div className={`${glass} p-5`}>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Sector Allocation</h2>
        <div className="space-y-2.5">
          {orderedSectors.map((sector) => {
            const sh      = sectorMap[sector];
            const inv     = sh.reduce((s, h) => s + h.total_invested, 0);
            const cur     = sh.reduce((s, h) => s + (h.currentValue ?? h.total_invested), 0);
            const pct     = (inv / totalInvested) * 100;
            const gain    = cur - inv;
            return (
              <div key={sector} className="flex items-center gap-3">
                <div className="w-40 shrink-0 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${SECTOR_DOT[sector] ?? 'bg-zinc-400'}`} />
                  <span className="text-xs text-zinc-400 truncate">{sector}</span>
                </div>
                <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full opacity-70 ${SECTOR_DOT[sector] ?? 'bg-zinc-400'}`}
                    style={{ width: `${pct.toFixed(1)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs text-zinc-500">{pct.toFixed(1)}%</span>
                <span className={`w-20 text-right text-xs ${gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {gain >= 0 ? '+' : ''}{fmtCompact(gain)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Holdings Table grouped by sector */}
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
              {orderedSectors.map((sector) => {
                const sh      = sectorMap[sector];
                const sInv    = sh.reduce((s, h) => s + h.total_invested, 0);
                const sCur    = sh.reduce((s, h) => s + (h.currentValue ?? h.total_invested), 0);
                const sPnl    = sCur - sInv;
                const sPnlPct = (sPnl / sInv) * 100;
                return [
                  <tr key={`hdr-${sector}`} className="bg-zinc-900/70 border-t border-zinc-700">
                    <td className="px-6 py-2" colSpan={3}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${SECTOR_DOT[sector] ?? 'bg-zinc-400'}`} />
                        <span className={`text-xs font-bold uppercase tracking-wider ${SECTOR_COLOR[sector] ?? 'text-zinc-400'}`}>{sector}</span>
                        <span className="text-xs text-zinc-600">({sh.length})</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-zinc-400">{fmtCompact(sInv)}</td>
                    <td className="px-4 py-2" />
                    <td className="px-4 py-2 text-right text-xs text-zinc-300">{fmtCompact(sCur)}</td>
                    <td className={`px-4 py-2 text-right text-xs ${sPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {sPnl >= 0 ? '+' : ''}{fmtCompact(sPnl)}
                    </td>
                    <td className={`px-6 py-2 text-right text-xs font-semibold ${sPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {sPnl >= 0 ? '+' : ''}{sPnlPct.toFixed(2)}%
                    </td>
                  </tr>,
                  ...sh.map((h) => {
                    const gain = h.pnl !== null ? h.pnl >= 0 : null;
                    return (
                      <tr key={h.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-3.5 pl-10">
                          <p className="font-medium text-white">{h.symbol}</p>
                          <p className="text-xs text-zinc-500 truncate max-w-[180px]">{h.company_name}</p>
                        </td>
                        <td className="px-4 py-3.5 text-right text-zinc-300">{h.quantity}</td>
                        <td className="px-4 py-3.5 text-right text-zinc-300">
                          {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(h.avg_buy_price)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-zinc-300">{fmtCompact(h.total_invested)}</td>
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
                  }),
                ];
              })}
            </tbody>
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
          {orderedSectors.map((sector) => (
            <div key={sector}>
              <div className="px-4 py-2 bg-zinc-900/70 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${SECTOR_DOT[sector] ?? 'bg-zinc-400'}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${SECTOR_COLOR[sector] ?? 'text-zinc-400'}`}>{sector}</span>
              </div>
              {sectorMap[sector].map((h) => {
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
                      <div><p className="text-zinc-500">Qty</p><p className="text-zinc-300">{h.quantity}</p></div>
                      <div><p className="text-zinc-500">Invested</p><p className="text-zinc-300">{fmtCompact(h.total_invested)}</p></div>
                      <div><p className="text-zinc-500">Current</p><p className="text-zinc-300">{h.currentValue !== null ? fmtCompact(h.currentValue) : '—'}</p></div>
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
          ))}
        </div>
      </div>

      {/* Investment Ideas */}
      <div className={glass}>
        <div className="flex items-center gap-3 border-b border-zinc-800 px-6 py-4">
          <Lightbulb className="h-5 w-5 text-yellow-400" />
          <h2 className="font-semibold text-white">Investment Ideas</h2>
          <span className="text-xs text-zinc-500">Based on portfolio gaps &amp; business alignment</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800">
          {IDEAS.map((idea) => (
            <div key={idea.symbol} className="bg-zinc-950 p-5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`font-bold text-sm ${idea.color}`}>{idea.symbol}</p>
                  <p className="text-xs text-zinc-400">{idea.name}</p>
                </div>
                <span className="text-xs text-zinc-600 bg-zinc-800/80 rounded px-1.5 py-0.5 shrink-0 text-right">{idea.sector}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{idea.rationale}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
