import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { fetchStockPrice } from '@/lib/stockAnalysis';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle, Shield, UserCheck, TrendingUp, GitBranch, CheckCircle,
  ArrowLeft, TrendingDown, FileText, Clock,
} from 'lucide-react';
import AnalyzeForm from './AnalyzeForm';
import ClaimActions from './ClaimActions';

export const dynamic = 'force-dynamic';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const severityStyle: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high:     'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low:      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  positive: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const typeIcon: Record<string, React.ElementType> = {
  accounting_red_flag:    AlertTriangle,
  governance:             Shield,
  management_credibility: UserCheck,
  capital_allocation:     TrendingUp,
  divergence:             GitBranch,
  positive:               CheckCircle,
};

const typeLabel: Record<string, string> = {
  accounting_red_flag:    'Accounting Red Flag',
  governance:             'Governance',
  management_credibility: 'Management Credibility',
  capital_allocation:     'Capital Allocation',
  divergence:             'Divergence',
  positive:               'Positive Signal',
};

const claimStatusStyle: Record<string, string> = {
  pending:       'bg-zinc-500/10 text-zinc-400',
  met:           'bg-emerald-500/10 text-emerald-400',
  partially_met: 'bg-amber-500/10 text-amber-400',
  missed:        'bg-red-500/10 text-red-400',
  unverifiable:  'bg-zinc-500/10 text-zinc-500',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

interface Props {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function StockIntelligencePage({ params, searchParams }: Props) {
  const { symbol } = await params;
  const { tab = 'signals' } = await searchParams;

  // Fetch holding
  const { data: holding } = await supabaseAdmin
    .from('demat_holdings')
    .select('*')
    .eq('symbol', symbol)
    .single();

  if (!holding) notFound();

  // Fetch all data in parallel
  const [signalsRes, claimsRes, filingsRes, priceData] = await Promise.all([
    supabaseAdmin.from('stock_signals').select('*').eq('symbol', symbol).order('created_at', { ascending: false }),
    supabaseAdmin.from('stock_claims').select('*').eq('symbol', symbol).order('created_at', { ascending: false }),
    supabaseAdmin.from('stock_filings').select('id, symbol, filing_type, title, period, signals_generated, analyzed_at, ai_analysis, created_at').eq('symbol', symbol).order('created_at', { ascending: false }),
    fetchStockPrice(holding.yahoo_symbol),
  ]);

  const signals = signalsRes.data ?? [];
  const claims = claimsRes.data ?? [];
  const filings = filingsRes.data ?? [];

  const currentValue = priceData.price ? priceData.price * holding.quantity : null;
  const pnl = currentValue ? currentValue - holding.total_invested : null;
  const pnlPct = pnl != null ? (pnl / holding.total_invested) * 100 : null;

  const tabs = [
    { key: 'signals', label: 'Signals', count: signals.length },
    { key: 'claims', label: 'Claims', count: claims.length },
    { key: 'filings', label: 'Filings', count: filings.length },
    { key: 'analysis', label: 'Analysis', count: null },
  ];

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link href="/dashboard/investments/intelligence" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Intelligence
        </Link>

        <div className={`${glass} p-6`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{holding.company_name}</h1>
                <span className="text-sm font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{symbol}</span>
                {holding.sector && (
                  <span className="text-xs px-2 py-0.5 rounded bg-zinc-800/60 text-zinc-500">{holding.sector}</span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {holding.quantity} shares @ {fmt(holding.avg_buy_price)} avg &middot; Invested: {fmt(holding.total_invested)}
              </p>
            </div>

            <div className="flex items-center gap-6">
              {priceData.price != null && (
                <div className="text-right">
                  <p className="text-xl font-bold text-white">{fmt(priceData.price)}</p>
                  <p className={`text-xs font-medium ${(priceData.changePct ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {(priceData.changePct ?? 0) >= 0 ? '+' : ''}{priceData.changePct?.toFixed(2)}% today
                  </p>
                </div>
              )}
              {pnl != null && (
                <div className="text-right">
                  <p className={`text-lg font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pnl >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
                    {fmt(Math.abs(pnl))}
                  </p>
                  <p className={`text-xs ${pnl >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                    {pnlPct != null && `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}% P&L`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800 pb-px">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/dashboard/investments/intelligence/${symbol}?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.key
                ? 'bg-zinc-800 text-white border-b-2 border-rose-500'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
            }`}
          >
            {t.label}
            {t.count != null && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700/50 text-zinc-400">{t.count}</span>
            )}
          </Link>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'signals' && (
        <div className="space-y-3">
          {signals.length === 0 && (
            <div className={`${glass} p-8 text-center`}>
              <p className="text-zinc-400">No signals for {symbol}. Analyze a filing to generate intelligence.</p>
            </div>
          )}

          {/* Group by type */}
          {Object.entries(
            signals.reduce<Record<string, typeof signals>>((acc, s) => {
              const key = s.signal_type;
              if (!acc[key]) acc[key] = [];
              acc[key].push(s);
              return acc;
            }, {}),
          ).map(([type, typeSignals]) => {
            const Icon = typeIcon[type] ?? AlertTriangle;
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-2 mt-4">
                  <Icon className="h-4 w-4 text-zinc-400" />
                  <h3 className="text-sm font-semibold text-zinc-300">{typeLabel[type] ?? type}</h3>
                  <span className="text-xs text-zinc-600">({typeSignals.length})</span>
                </div>
                <div className="space-y-2">
                  {typeSignals.map((s) => {
                    const style = severityStyle[s.severity] ?? severityStyle.medium;
                    return (
                      <details key={s.id} className={`${glass} p-4`}>
                        <summary className="flex items-start gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                          <span className={`text-[10px] uppercase font-semibold tracking-wide px-2 py-0.5 rounded border shrink-0 mt-0.5 ${style}`}>
                            {s.severity}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">{s.title}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">{s.description}</p>
                          </div>
                          <span className="text-[10px] text-zinc-600 shrink-0">{s.source_period} &middot; {s.ai_confidence}%</span>
                        </summary>
                        {s.evidence && (
                          <div className="mt-3 ml-16 p-3 rounded-lg bg-zinc-800/60 border border-zinc-700/50">
                            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Evidence</p>
                            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{s.evidence}</p>
                          </div>
                        )}
                      </details>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'claims' && (
        <div className="space-y-3">
          {claims.length === 0 && (
            <div className={`${glass} p-8 text-center`}>
              <p className="text-zinc-400">No management claims tracked for {symbol}.</p>
            </div>
          )}
          {claims.map((c) => (
            <div key={c.id} className={`${glass} p-4`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-white">{c.claim}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-zinc-500">{c.source}</span>
                    {c.target_date && (
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Target: {c.target_date}
                      </span>
                    )}
                    <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${claimStatusStyle[c.status] ?? claimStatusStyle.pending}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                  {c.actual_result && (
                    <p className="text-xs text-zinc-400 mt-2 p-2 rounded bg-zinc-800/40">Result: {c.actual_result}</p>
                  )}
                </div>
                <ClaimActions claimId={c.id} currentStatus={c.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'filings' && (
        <div className="space-y-3">
          {filings.length === 0 && (
            <div className={`${glass} p-8 text-center`}>
              <p className="text-zinc-400">No filings analyzed for {symbol}.</p>
            </div>
          )}
          {filings.map((f) => (
            <details key={f.id} className={`${glass} p-4`}>
              <summary className="flex items-center gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <FileText className="h-4 w-4 text-zinc-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{f.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-zinc-500">{f.filing_type.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-zinc-600">{f.period}</span>
                    <span className="text-xs text-zinc-600">{f.signals_generated} signals</span>
                  </div>
                </div>
                <span className="text-xs text-zinc-600">
                  {f.analyzed_at ? new Date(f.analyzed_at).toLocaleDateString('en-IN') : ''}
                </span>
              </summary>
              {f.ai_analysis && (
                <div className="mt-3 p-3 rounded-lg bg-zinc-800/60 border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">AI Summary</p>
                  <p className="text-sm text-zinc-300">
                    {typeof f.ai_analysis === 'object' && 'summary' in (f.ai_analysis as Record<string, unknown>)
                      ? String((f.ai_analysis as Record<string, unknown>).summary)
                      : 'No summary available.'}
                  </p>
                  {'risk_score' in (f.ai_analysis as Record<string, unknown>) && (
                    <p className="text-xs text-zinc-400 mt-2">
                      Risk Score: <span className="font-mono font-bold">{String((f.ai_analysis as Record<string, unknown>).risk_score)}/100</span>
                    </p>
                  )}
                </div>
              )}
            </details>
          ))}
        </div>
      )}

      {tab === 'analysis' && (
        <AnalyzeForm symbol={symbol} companyName={holding.company_name} />
      )}
    </div>
  );
}
