import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { TrendingUp, TrendingDown, BarChart3, Sparkles, Gem } from 'lucide-react';
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

const SECTOR_HEX: Record<string, string> = {
  'Gold & Sovereign Bonds':   '#facc15',
  'Banking & Finance':        '#38bdf8',
  'Metals & Mining':          '#fb923c',
  'Energy':                   '#f87171',
  'Technology':               '#818cf8',
  'Pharma & Healthcare':      '#34d399',
  'FMCG':                     '#f472b6',
  'Auto':                     '#c084fc',
  'Telecom Infrastructure':   '#22d3ee',
  'Other':                    '#71717a',
};

// Left-border accent color for sector rows in the table
const SECTOR_BORDER: Record<string, string> = {
  'Gold & Sovereign Bonds':   'border-l-yellow-400',
  'Banking & Finance':        'border-l-sky-400',
  'Metals & Mining':          'border-l-orange-400',
  'Energy':                   'border-l-red-400',
  'Technology':               'border-l-indigo-400',
  'Pharma & Healthcare':      'border-l-emerald-400',
  'FMCG':                     'border-l-pink-400',
  'Auto':                     'border-l-purple-400',
  'Telecom Infrastructure':   'border-l-cyan-400',
  'Other':                    'border-l-zinc-400',
};

// ─── SVG Donut Chart (pure server-renderable) ───────────────────────────────
function DonutChart({ slices }: { slices: Array<{ sector: string; pct: number }> }) {
  const r = 56;
  const cx = 80;
  const cy = 80;
  const sw = 22;
  const C = 2 * Math.PI * r;

  let cum = 0;
  const segs = slices.map((s) => {
    const len = (s.pct / 100) * C;
    const off = -(cum / 100) * C;
    cum += s.pct;
    return { ...s, len, off };
  });

  return (
    <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0">
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#27272a" strokeWidth={sw + 1} />
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        {segs.map((seg, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={SECTOR_HEX[seg.sector] ?? '#71717a'}
            strokeWidth={sw}
            strokeDasharray={`${seg.len.toFixed(2)} ${C.toFixed(2)}`}
            strokeDashoffset={seg.off.toFixed(2)}
            strokeLinecap="butt"
          />
        ))}
      </g>
    </svg>
  );
}

// ─── Dynamic Investment Ideas via Claude ─────────────────────────────────────
interface IdeaItem {
  symbol: string;
  name: string;
  sector: string;
  rationale: string;
  theme: string;
}

const FALLBACK_IDEAS: IdeaItem[] = [
  { symbol: 'HINDZINC',  name: 'Hindustan Zinc Ltd',  sector: 'Metals & Mining',    theme: 'Core alignment',       rationale: 'World\'s 2nd largest zinc producer and consistent high dividend payer. Direct raw material alignment with your electrochemical business.' },
  { symbol: 'LT',        name: 'Larsen & Toubro',      sector: 'Engineering',         theme: 'Capex cycle',          rationale: 'Strong order book in industrial infrastructure. Aligns with EPC and project-execution nature of your business.' },
  { symbol: 'RECLTD',    name: 'REC Ltd',              sector: 'Energy Finance',      theme: 'High yield',           rationale: 'Government NBFC funding power infrastructure. High dividend yield, low valuation, complements existing energy holdings.' },
  { symbol: 'TATAPOWER', name: 'Tata Power Co Ltd',    sector: 'Energy',              theme: 'Green transition',     rationale: 'Renewable energy transition play with growing solar EPC. Balances conventional energy exposure.' },
  { symbol: 'ABB',       name: 'ABB India Ltd',        sector: 'Industrial Auto',     theme: 'Manufacturing capex',  rationale: 'Electrical & automation equipment — directly relevant to AutoREX and industrial commissioning projects.' },
  { symbol: 'TITAN',     name: 'Titan Company Ltd',    sector: 'Consumer',            theme: 'Diversification',      rationale: 'Portfolio has zero consumer discretionary exposure. High-quality compounder across jewellery, watches and eyewear.' },
];

async function generateInvestmentIdeas(
  sectorAllocations: Array<{ sector: string; pct: number }>,
  currentDate: string,
): Promise<{ ideas: IdeaItem[]; generatedAt: string; isAI: boolean }> {
  // Check cache first (regenerate only once per day)
  try {
    const { data: cached } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'investment_ideas_cache')
      .single();

    if (cached?.value) {
      const cache = JSON.parse(cached.value);
      // Use cache if less than 24 hours old
      if (cache.generatedAt && (Date.now() - new Date(cache.generatedAt).getTime()) < 24 * 60 * 60 * 1000) {
        return { ideas: cache.ideas, generatedAt: cache.generatedAt, isAI: cache.isAI };
      }
    }
  } catch { /* no cache, generate fresh */ }

  try {
    const client = new Anthropic();
    const portfolioSummary = sectorAllocations.map((s) => `${s.sector}: ${s.pct.toFixed(1)}%`).join(', ');

    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `You are an investment advisor for an Indian investor using ICICI Direct Demat (NSE stocks).

Current portfolio allocation: ${portfolioSummary}
Date: ${currentDate}

Considering current geopolitical context (US-China trade tensions, Middle East instability, global energy transition, India's manufacturing growth, defence capex, digital infrastructure build-out, commodity cycles) AND portfolio gaps — generate exactly 6 investment ideas for Indian listed stocks/ETFs.

Return ONLY a valid JSON array, no other text:
[
  {
    "symbol": "NSE_SYMBOL",
    "name": "Full Company Name",
    "sector": "Sector Name",
    "rationale": "2-3 sentences linking the geopolitical/macro theme to this specific stock and why it fits this portfolio.",
    "theme": "Short theme tag (e.g. 'China+1 Play', 'Defence Capex', 'Energy Transition')"
  }
]

Rules: real NSE symbols only, no duplicates with portfolio sectors already over 25%, cover at least 3 different geopolitical themes.`,
      }],
    });

    const text = resp.content[0].type === 'text' ? resp.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return { ideas: FALLBACK_IDEAS, generatedAt: currentDate, isAI: false };

    const parsed = JSON.parse(jsonMatch[0]) as IdeaItem[];
    const result = { ideas: parsed.slice(0, 6), generatedAt: new Date().toISOString(), isAI: true };

    // Cache the result
    supabaseAdmin.from('app_settings').upsert({ key: 'investment_ideas_cache', value: JSON.stringify(result) }).then(() => {});

    return result;
  } catch {
    return { ideas: FALLBACK_IDEAS, generatedAt: currentDate, isAI: false };
  }
}

// ─── Gold jewellery ───────────────────────────────────────────────────────────
interface GoldItem {
  id: string;
  purchase_date: string;
  owner: string;
  item_name: string;
  grams_22k: number;
  gold_rate_22k: number;
  making_charges: number;
  purchase_value: number;
}

// Fetches live 22K gold rate in INR/gram via Yahoo Finance (GC=F + USDINR=X)
// India domestic rate = COMEX × USD/INR × import-duty-factor / troy-oz-per-gram
// Empirical duty+GST factor ≈ 1.1447 (derived from user's data: COMEX $4820.10 → 24K ₹16,366.36)
const GOLD_DUTY_FACTOR = 1.1447;
const TROY_OZ_PER_GRAM = 31.1035;

async function fetchLive22KRate(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v7/finance/quote?symbols=GC%3DF%2CUSDINR%3DX',
      { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store', signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const quotes: Array<{ symbol: string; regularMarketPrice: number }> =
      json?.quoteResponse?.result ?? [];
    const gcf    = quotes.find((q) => q.symbol === 'GC=F')?.regularMarketPrice;
    const usdInr = quotes.find((q) => q.symbol === 'USDINR=X')?.regularMarketPrice;
    if (!gcf || !usdInr) return null;
    const rate24k = (gcf * usdInr * GOLD_DUTY_FACTOR) / TROY_OZ_PER_GRAM;
    return rate24k * (22 / 24);
  } catch {
    return null;
  }
}

// ─── Yahoo Finance price fetching (faster than NSE, no cookies needed) ───────
async function fetchYahooPrices(
  holdings: Array<{ symbol: string; yahoo_symbol: string }>,
): Promise<Record<string, { price: number; dayChangePct: number }>> {
  const priceMap: Record<string, { price: number; dayChangePct: number }> = {};

  // Batch fetch — 5 at a time for speed
  const batches: Array<typeof holdings> = [];
  for (let i = 0; i < holdings.length; i += 5) {
    batches.push(holdings.slice(i, i + 5));
  }

  for (const batch of batches) {
    const results = await Promise.all(
      batch.map(async (h) => {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(h.yahoo_symbol)}?interval=1d&range=1d`;
          const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 300 }, // Cache for 5 minutes
          });
          if (!res.ok) return null;
          const data = await res.json();
          const meta = data.chart?.result?.[0]?.meta;
          if (!meta?.regularMarketPrice) return null;
          const price = meta.regularMarketPrice;
          const prev = meta.chartPreviousClose ?? meta.previousClose;
          const changePct = prev ? ((price - prev) / prev) * 100 : 0;
          return { symbol: h.symbol, price, dayChangePct: changePct };
        } catch { return null; }
      }),
    );
    for (const r of results) {
      if (r) priceMap[r.symbol] = { price: r.price, dayChangePct: r.dayChangePct };
    }
  }

  return priceMap;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function InvestmentsPage() {
  const [{ data: holdings }, { data: goldRaw }] = await Promise.all([
    supabaseAdmin.from('demat_holdings').select('*').order('total_invested', { ascending: false }),
    supabaseAdmin.from('gold_jewellery').select('*').order('purchase_date', { ascending: true }),
  ]);

  const rows = (holdings ?? []) as Holding[];
  const goldItems = (goldRaw ?? []) as GoldItem[];

  // Group by sector
  const rawSectorMap: Record<string, Holding[]> = {};
  for (const h of rows) {
    const s = h.sector ?? 'Other';
    if (!rawSectorMap[s]) rawSectorMap[s] = [];
    rawSectorMap[s].push(h);
  }
  const totalRawInvested = rows.reduce((s, h) => s + h.total_invested, 0);
  const sectorAllocations = SECTOR_ORDER.filter((s) => rawSectorMap[s]).map((s) => ({
    sector: s,
    pct: (rawSectorMap[s].reduce((acc, h) => acc + h.total_invested, 0) / totalRawInvested) * 100,
  }));

  const currentDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // Fetch Yahoo prices, gold rate, and AI ideas in parallel
  // Yahoo Finance is faster (no cookie dance) and cached for 5 min
  const [priceMap, live22kRate, ideasResult] = await Promise.all([
    fetchYahooPrices(rows.map(h => ({ symbol: h.symbol, yahoo_symbol: h.yahoo_symbol }))),
    fetchLive22KRate(),
    generateInvestmentIdeas(sectorAllocations, currentDate),
  ]);

  const enriched: EnrichedHolding[] = rows.map((h) => {
    const live         = priceMap[h.symbol];
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

  const sectorMap: Record<string, EnrichedHolding[]> = {};
  for (const h of enriched) {
    const s = h.sector ?? 'Other';
    if (!sectorMap[s]) sectorMap[s] = [];
    sectorMap[s].push(h);
  }
  const orderedSectors = SECTOR_ORDER.filter((s) => sectorMap[s]);

  // Sector stats for allocation panel
  const sectorStats = orderedSectors.map((sector) => {
    const sh   = sectorMap[sector];
    const inv  = sh.reduce((s, h) => s + h.total_invested, 0);
    const cur  = sh.reduce((s, h) => s + (h.currentValue ?? h.total_invested), 0);
    const pct  = (inv / totalInvested) * 100;
    const gain = cur - inv;
    return { sector, inv, cur, pct, gain };
  });

  // Gold jewellery computed values
  const goldRate = live22kRate ?? 15002.42; // fallback: COMEX-based rate from user's data
  const goldRateIsLive = live22kRate !== null;

  const goldEnriched = goldItems.map((item) => ({
    ...item,
    currentValue: item.grams_22k * goldRate,
    gain: item.grams_22k * goldRate - item.purchase_value,
    gainPct: ((item.grams_22k * goldRate - item.purchase_value) / item.purchase_value) * 100,
  }));

  const goldByOwner = ['Sivakumar', 'Arrthe'].map((owner) => {
    const items = goldEnriched.filter((g) => g.owner === owner);
    const totalInv = items.reduce((s, g) => s + g.purchase_value, 0);
    const totalCur = items.reduce((s, g) => s + g.currentValue, 0);
    const totalGrams = items.reduce((s, g) => s + g.grams_22k, 0);
    return { owner, items, totalInv, totalCur, totalGrams, gain: totalCur - totalInv };
  });

  const goldTotalInvested = goldEnriched.reduce((s, g) => s + g.purchase_value, 0);
  const goldTotalCurrent  = goldEnriched.reduce((s, g) => s + g.currentValue, 0);
  const goldTotalGrams    = goldEnriched.reduce((s, g) => s + g.grams_22k, 0);
  const goldTotalGain     = goldTotalCurrent - goldTotalInvested;
  const goldTotalGainPct  = (goldTotalGain / goldTotalInvested) * 100;

  return (
    <div className="p-6 space-y-4 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Investments</h1>
          <p className="text-xs text-zinc-500">
            ICICI Direct Demat · {liveCount}/{enriched.length} live · NSE
          </p>
        </div>
        <RefreshButton />
      </div>

      {/* Summary Strip — 5 cols compact */}
      <div className="grid grid-cols-5 gap-2">
        <div className={`${glass} px-4 py-2.5`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Invested</p>
          <p className="text-lg font-black text-indigo-400">{fmtCompact(totalInvested)}</p>
        </div>
        <div className={`${glass} px-4 py-2.5`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Current</p>
          <p className="text-lg font-black text-indigo-300">{fmtCompact(totalCurrent)}</p>
        </div>
        <div className={`${glass} px-4 py-2.5`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">P&amp;L</p>
          <p className={`text-lg font-black ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalPnl >= 0 ? '+' : ''}{fmtCompact(totalPnl)}
          </p>
        </div>
        <div className={`${glass} px-4 py-2.5`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Return</p>
          <div className="flex items-center gap-1">
            {totalPnl >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <TrendingDown className="h-4 w-4 text-rose-400" />}
            <p className={`text-lg font-black ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalPnl >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
            </p>
          </div>
        </div>
        <div className={`${glass} px-4 py-2.5`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Positions</p>
          <p className="text-lg font-black text-white">{enriched.length}</p>
        </div>
      </div>

      {/* Sector Allocation — Donut + Bars */}
      <div className={`${glass} p-4`}>
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <DonutChart slices={sectorStats.map((s) => ({ sector: s.sector, pct: s.pct }))} />
            <p className="text-[10px] text-zinc-600">{orderedSectors.length} sectors</p>
          </div>
          <div className="flex-1 space-y-1.5 w-full">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Sector Allocation</p>
            {sectorStats.map(({ sector, pct, gain }) => (
              <div key={sector} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${SECTOR_DOT[sector] ?? 'bg-zinc-400'}`} />
                <span className="text-[11px] text-zinc-300 truncate w-32">{sector}</span>
                <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div className={`h-full rounded-full ${SECTOR_DOT[sector] ?? 'bg-zinc-400'}`} style={{ width: `${pct}%`, opacity: 0.7 }} />
                </div>
                <span className="w-8 text-right text-[10px] text-zinc-400 font-mono">{pct.toFixed(0)}%</span>
                <span className={`w-14 text-right text-[10px] font-mono ${gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {gain >= 0 ? '+' : ''}{fmtCompact(gain)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className={glass}>
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2">
          <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
          <h2 className="font-semibold text-white text-xs uppercase tracking-wide">Holdings</h2>
          <span className="text-[10px] text-zinc-600 ml-auto">{enriched.length} positions</span>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider">
                <th className="px-5 py-2.5 text-left">Stock</th>
                <th className="px-3 py-2.5 text-right">Qty</th>
                <th className="px-3 py-2.5 text-right">Avg Buy</th>
                <th className="px-3 py-2.5 text-right">Invested</th>
                <th className="px-3 py-2.5 text-right">Curr Price</th>
                <th className="px-3 py-2.5 text-right">Curr Value</th>
                <th className="px-3 py-2.5 text-right">P&amp;L</th>
                <th className="px-5 py-2.5 text-right">P&amp;L %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {orderedSectors.map((sector) => {
                const sh      = sectorMap[sector];
                const sInv    = sh.reduce((s, h) => s + h.total_invested, 0);
                const sCur    = sh.reduce((s, h) => s + (h.currentValue ?? h.total_invested), 0);
                const sPnl    = sCur - sInv;
                const sPnlPct = (sPnl / sInv) * 100;
                const border  = SECTOR_BORDER[sector] ?? 'border-l-zinc-600';
                return [
                  <tr key={`hdr-${sector}`} className={`bg-zinc-900/80 border-t border-zinc-700/60 border-l-2 ${border}`}>
                    <td className="px-5 py-1.5" colSpan={3}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${SECTOR_COLOR[sector] ?? 'text-zinc-400'}`}>{sector}</span>
                        <span className="text-zinc-600">({sh.length})</span>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-right text-zinc-400">{fmtCompact(sInv)}</td>
                    <td className="px-3 py-1.5" />
                    <td className="px-3 py-1.5 text-right text-zinc-300">{fmtCompact(sCur)}</td>
                    <td className={`px-3 py-1.5 text-right ${sPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {sPnl >= 0 ? '+' : ''}{fmtCompact(sPnl)}
                    </td>
                    <td className={`px-5 py-1.5 text-right font-semibold ${sPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {sPnl >= 0 ? '+' : ''}{sPnlPct.toFixed(2)}%
                    </td>
                  </tr>,
                  ...sh.map((h) => {
                    const gain = h.pnl !== null ? h.pnl >= 0 : null;
                    return (
                      <tr key={h.id} className={`hover:bg-zinc-800/20 transition-colors border-l-2 ${border} border-l-transparent hover:border-l-2`}>
                        <td className="px-5 py-2 pl-8">
                          <p className="font-semibold text-white text-xs">{h.symbol}</p>
                          <p className="text-zinc-500 truncate max-w-[160px]" style={{ fontSize: '10px' }}>{h.company_name}</p>
                        </td>
                        <td className="px-3 py-2 text-right text-zinc-300">{h.quantity}</td>
                        <td className="px-3 py-2 text-right text-zinc-400 font-mono">
                          {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(h.avg_buy_price)}
                        </td>
                        <td className="px-3 py-2 text-right text-zinc-300">{fmtCompact(h.total_invested)}</td>
                        <td className="px-3 py-2 text-right">
                          {h.currentPrice !== null ? (
                            <div>
                              <p className="text-white font-mono">
                                {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(h.currentPrice)}
                              </p>
                              {h.dayChangePct !== null && (
                                <p className={`${h.dayChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} style={{ fontSize: '10px' }}>
                                  {h.dayChangePct >= 0 ? '+' : ''}{h.dayChangePct.toFixed(2)}%
                                </p>
                              )}
                            </div>
                          ) : <span className="text-zinc-700">N/A</span>}
                        </td>
                        <td className="px-3 py-2 text-right text-zinc-300">
                          {h.currentValue !== null ? fmtCompact(h.currentValue) : <span className="text-zinc-700">—</span>}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {h.pnl !== null ? (
                            <span className={gain ? 'text-emerald-400' : 'text-rose-400'}>
                              {gain ? '+' : ''}{fmtCompact(h.pnl)}
                            </span>
                          ) : <span className="text-zinc-700">—</span>}
                        </td>
                        <td className="px-5 py-2 text-right">
                          {h.pnlPct !== null ? (
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 font-medium ${
                              gain ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                            }`} style={{ fontSize: '10px' }}>
                              {gain ? '+' : ''}{h.pnlPct.toFixed(2)}%
                            </span>
                          ) : <span className="text-zinc-700">—</span>}
                        </td>
                      </tr>
                    );
                  }),
                ];
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-700 bg-zinc-900/60 font-semibold text-xs">
                <td className="px-5 py-2.5 text-zinc-400" colSpan={3}>Portfolio Total</td>
                <td className="px-3 py-2.5 text-right text-indigo-400">{fmtCompact(totalInvested)}</td>
                <td className="px-3 py-2.5" />
                <td className="px-3 py-2.5 text-right text-indigo-300">{fmtCompact(totalCurrent)}</td>
                <td className="px-3 py-2.5 text-right">
                  <span className={totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {totalPnl >= 0 ? '+' : ''}{fmtCompact(totalPnl)}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-right">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                    totalPnl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`} style={{ fontSize: '10px' }}>
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
              <div className={`px-4 py-1.5 bg-zinc-900/70 flex items-center gap-2 border-l-2 ${SECTOR_BORDER[sector] ?? 'border-l-zinc-600'}`}>
                <span className={`text-xs font-bold uppercase tracking-wider ${SECTOR_COLOR[sector] ?? 'text-zinc-400'}`}>{sector}</span>
              </div>
              {sectorMap[sector].map((h) => {
                const gain = h.pnl !== null ? h.pnl >= 0 : null;
                return (
                  <div key={h.id} className="px-4 py-3 space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-white text-sm">{h.symbol}</p>
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
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Gold Jewellery */}
      {goldItems.length > 0 && (
        <div className={glass}>
          <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-3">
            <Gem className="h-4 w-4 text-yellow-400" />
            <h2 className="font-semibold text-white text-sm">Physical Gold — 22K Jewellery</h2>
            <span className="ml-auto flex items-center gap-1.5 text-xs">
              {goldRateIsLive
                ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-emerald-400">Live · ₹{goldRate.toFixed(0)}/g</span></>
                : <span className="text-zinc-500">₹{goldRate.toFixed(0)}/g (last known)</span>
              }
            </span>
          </div>

          {/* Owner summary strip */}
          <div className="grid grid-cols-2 divide-x divide-zinc-800 border-b border-zinc-800">
            {goldByOwner.map(({ owner, totalGrams, totalInv, totalCur, gain }) => (
              <div key={owner} className="px-5 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-zinc-500">{owner}</p>
                  <p className="text-sm font-bold text-yellow-400">{totalGrams.toFixed(3)} g</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-400">{fmtCompact(totalCur)}</p>
                  <p className={`text-xs font-medium ${gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {gain >= 0 ? '+' : ''}{fmtCompact(gain)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Items by owner */}
          {goldByOwner.map(({ owner, items }) => (
            <div key={owner}>
              <div className="px-5 py-1.5 bg-zinc-900/60 border-b border-zinc-800/50">
                <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">{owner}</span>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider">
                      <th className="px-5 py-2 text-left">Item</th>
                      <th className="px-3 py-2 text-right">Date</th>
                      <th className="px-3 py-2 text-right">Grams</th>
                      <th className="px-3 py-2 text-right">Buy Rate</th>
                      <th className="px-3 py-2 text-right">MC+VAT</th>
                      <th className="px-3 py-2 text-right">Invested</th>
                      <th className="px-3 py-2 text-right">Curr Value</th>
                      <th className="px-5 py-2 text-right">Gain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {items.map((g) => (
                      <tr key={g.id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="px-5 py-2 font-medium text-white">{g.item_name}</td>
                        <td className="px-3 py-2 text-right text-zinc-500 font-mono">
                          {new Date(g.purchase_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-3 py-2 text-right text-zinc-300 font-mono">{g.grams_22k.toFixed(3)}</td>
                        <td className="px-3 py-2 text-right text-zinc-400 font-mono">
                          {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(g.gold_rate_22k)}
                        </td>
                        <td className="px-3 py-2 text-right text-zinc-500">{fmtCompact(g.making_charges)}</td>
                        <td className="px-3 py-2 text-right text-zinc-300">{fmtCompact(g.purchase_value)}</td>
                        <td className="px-3 py-2 text-right text-yellow-300">{fmtCompact(g.currentValue)}</td>
                        <td className="px-5 py-2 text-right">
                          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 font-medium ${
                            g.gain >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`} style={{ fontSize: '10px' }}>
                            {g.gain >= 0 ? '+' : ''}{g.gainPct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-zinc-800/50">
                {items.map((g) => (
                  <div key={g.id} className="px-4 py-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-white text-sm">{g.item_name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        g.gain >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {g.gain >= 0 ? '+' : ''}{g.gainPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><p className="text-zinc-500">Grams</p><p className="text-zinc-300">{g.grams_22k.toFixed(3)}g</p></div>
                      <div><p className="text-zinc-500">Invested</p><p className="text-zinc-300">{fmtCompact(g.purchase_value)}</p></div>
                      <div><p className="text-zinc-500">Current</p><p className="text-yellow-300">{fmtCompact(g.currentValue)}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Gold total footer */}
          <div className="border-t border-zinc-700 bg-zinc-900/60 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <span className="text-zinc-400">Total <span className="text-yellow-400 font-bold">{goldTotalGrams.toFixed(3)} g</span> 22K</span>
              <span className="text-zinc-400">Invested <span className="text-zinc-200 font-semibold">{fmtCompact(goldTotalInvested)}</span></span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-zinc-400">Current <span className="text-yellow-300 font-semibold">{fmtCompact(goldTotalCurrent)}</span></span>
              <span className={`font-bold ${goldTotalGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {goldTotalGain >= 0 ? '+' : ''}{fmtCompact(goldTotalGain)} ({goldTotalGainPct.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Investment Ideas */}
      <div className={glass}>
        <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-3">
          <Sparkles className="h-4 w-4 text-yellow-400" />
          <h2 className="font-semibold text-white text-sm">Investment Ideas</h2>
          {ideasResult.isAI ? (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI · {ideasResult.generatedAt}
            </span>
          ) : (
            <span className="ml-auto text-xs text-zinc-500">Portfolio gaps &amp; business alignment</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800/60">
          {ideasResult.ideas.map((idea, i) => (
            <div key={`${idea.symbol}-${i}`} className="bg-zinc-950 p-4 space-y-2 hover:bg-zinc-900/60 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`font-bold text-sm ${SECTOR_COLOR[idea.sector] ?? 'text-indigo-400'}`}>{idea.symbol}</p>
                  <p className="text-xs text-zinc-400">{idea.name}</p>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <p className="text-xs bg-zinc-800 text-zinc-400 rounded px-1.5 py-0.5">{idea.sector}</p>
                  {idea.theme && (
                    <p className="text-xs bg-indigo-500/10 text-indigo-400 rounded px-1.5 py-0.5">{idea.theme}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{idea.rationale}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
