import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import {
  AlertTriangle, Shield, UserCheck, TrendingUp, GitBranch, CheckCircle,
  Activity, Flame, BarChart3, Eye,
} from 'lucide-react';
import ScanButton from './ScanButton';

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

interface Signal {
  id: string;
  symbol: string;
  signal_type: string;
  severity: string;
  title: string;
  description: string;
  evidence: string | null;
  source: string | null;
  source_period: string | null;
  ai_confidence: number;
  created_at: string;
}

interface Holding {
  symbol: string;
  company_name: string;
  sector: string | null;
}

export default async function IntelligenceDashboard() {
  // Fetch all data in parallel
  const [holdingsRes, signalsRes] = await Promise.all([
    supabaseAdmin.from('demat_holdings').select('symbol, company_name, sector').order('symbol'),
    supabaseAdmin.from('stock_signals').select('*').order('created_at', { ascending: false }).limit(100),
  ]);

  const holdings = (holdingsRes.data ?? []) as Holding[];
  const signals = (signalsRes.data ?? []) as Signal[];

  const totalSignals = signals.length;
  const criticalSignals = signals.filter((s) => s.severity === 'critical').length;
  const highSignals = signals.filter((s) => s.severity === 'high').length;

  // Sector risk aggregation
  const sectorMap = new Map<string, { signals: number; critical: number; high: number; stocks: string[] }>();
  for (const h of holdings) {
    const sec = h.sector ?? 'Uncategorized';
    if (!sectorMap.has(sec)) sectorMap.set(sec, { signals: 0, critical: 0, high: 0, stocks: [] });
    sectorMap.get(sec)!.stocks.push(h.symbol);
  }
  for (const s of signals) {
    const holding = holdings.find((h) => h.symbol === s.symbol);
    const sec = holding?.sector ?? 'Uncategorized';
    const entry = sectorMap.get(sec);
    if (entry) {
      entry.signals++;
      if (s.severity === 'critical') entry.critical++;
      if (s.severity === 'high') entry.high++;
    }
  }

  // Unique symbols that have signals
  const symbolsWithSignals = new Set(signals.map((s) => s.symbol));

  // Avg confidence
  const avgConfidence = signals.length
    ? Math.round(signals.reduce((a, s) => a + (s.ai_confidence ?? 0), 0) / signals.length)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Stock Intelligence</h1>
          <p className="mt-1 text-sm text-zinc-500">Forensic analysis and signal tracking across your portfolio</p>
        </div>
        <ScanButton />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-zinc-800"><BarChart3 className="h-4 w-4 text-zinc-400" /></div>
            <span className="text-xs text-zinc-500 uppercase tracking-wide">Holdings</span>
          </div>
          <p className="text-2xl font-bold text-white">{holdings.length}</p>
          <p className="text-xs text-zinc-500 mt-1">{symbolsWithSignals.size} with signals</p>
        </div>

        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10"><Activity className="h-4 w-4 text-amber-400" /></div>
            <span className="text-xs text-zinc-500 uppercase tracking-wide">Total Signals</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalSignals}</p>
          <p className="text-xs text-zinc-500 mt-1">Avg confidence: {avgConfidence}%</p>
        </div>

        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-500/10"><Flame className="h-4 w-4 text-red-400" /></div>
            <span className="text-xs text-zinc-500 uppercase tracking-wide">Critical</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{criticalSignals}</p>
          <p className="text-xs text-zinc-500 mt-1">{highSignals} high severity</p>
        </div>

        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10"><Eye className="h-4 w-4 text-emerald-400" /></div>
            <span className="text-xs text-zinc-500 uppercase tracking-wide">Monitored</span>
          </div>
          <p className="text-2xl font-bold text-white">{holdings.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Across {sectorMap.size} sectors</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Signal Feed — 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white">Signal Feed</h2>

          {signals.length === 0 && (
            <div className={`${glass} p-8 text-center`}>
              <AlertTriangle className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">No signals yet. Analyze a filing to generate intelligence.</p>
              <p className="text-xs text-zinc-600 mt-1">Go to any stock and paste a filing text to get started.</p>
            </div>
          )}

          {signals.map((s) => {
            const Icon = typeIcon[s.signal_type] ?? AlertTriangle;
            const style = severityStyle[s.severity] ?? severityStyle.medium;
            return (
              <details key={s.id} className={`${glass} p-4 group`}>
                <summary className="flex items-start gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <div className={`p-1.5 rounded-lg border ${style} shrink-0 mt-0.5`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/dashboard/investments/intelligence/${s.symbol}`}
                        className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                      >
                        {s.symbol}
                      </Link>
                      <span className={`text-[10px] uppercase font-semibold tracking-wide px-2 py-0.5 rounded border ${style}`}>
                        {s.severity}
                      </span>
                      <span className="text-[10px] text-zinc-600">{typeLabel[s.signal_type] ?? s.signal_type}</span>
                    </div>
                    <p className="text-sm font-medium text-white mt-1">{s.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{s.description}</p>
                  </div>
                  <span className="text-[10px] text-zinc-600 shrink-0 mt-1">
                    {s.source_period ?? ''} &middot; {s.ai_confidence}%
                  </span>
                </summary>
                {s.evidence && (
                  <div className="mt-3 ml-10 p-3 rounded-lg bg-zinc-800/60 border border-zinc-700/50">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Evidence</p>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{s.evidence}</p>
                  </div>
                )}
              </details>
            );
          })}
        </div>

        {/* Sector Heatmap + Stock List — 1 col */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Sector Risk</h2>
            <div className="space-y-2">
              {Array.from(sectorMap.entries())
                .sort((a, b) => b[1].critical + b[1].high - (a[1].critical + a[1].high))
                .map(([sector, data]) => {
                  const intensity =
                    data.critical > 0 ? 'bg-red-500/20 border-red-500/30' :
                    data.high > 0 ? 'bg-orange-500/15 border-orange-500/25' :
                    data.signals > 0 ? 'bg-amber-500/10 border-amber-500/20' :
                    'bg-zinc-800/40 border-zinc-700/30';
                  return (
                    <div key={sector} className={`rounded-xl border p-3 ${intensity}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{sector}</span>
                        <span className="text-xs text-zinc-400">{data.signals} signals</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {data.stocks.map((sym) => (
                          <Link
                            key={sym}
                            href={`/dashboard/investments/intelligence/${sym}`}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900/60 text-zinc-400 hover:text-white transition-colors"
                          >
                            {sym}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Quick Stock List */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">All Holdings</h2>
            <div className={`${glass} divide-y divide-zinc-800`}>
              {holdings.map((h) => {
                const stockSignals = signals.filter((s) => s.symbol === h.symbol);
                const worst = stockSignals.find((s) => s.severity === 'critical')
                  ? 'critical'
                  : stockSignals.find((s) => s.severity === 'high')
                    ? 'high'
                    : stockSignals.length > 0
                      ? 'medium'
                      : null;
                return (
                  <Link
                    key={h.symbol}
                    href={`/dashboard/investments/intelligence/${h.symbol}`}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-zinc-800/40 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                  >
                    <div>
                      <span className="text-sm font-medium text-white">{h.symbol}</span>
                      <span className="text-xs text-zinc-500 ml-2">{h.sector ?? ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stockSignals.length > 0 && (
                        <span className="text-[10px] text-zinc-500">{stockSignals.length}</span>
                      )}
                      {worst && (
                        <span className={`h-2 w-2 rounded-full ${
                          worst === 'critical' ? 'bg-red-400' :
                          worst === 'high' ? 'bg-orange-400' :
                          'bg-amber-400'
                        }`} />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
