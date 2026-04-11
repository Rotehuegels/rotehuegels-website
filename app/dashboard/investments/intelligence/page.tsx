import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import {
  AlertTriangle, Shield, UserCheck, TrendingUp, GitBranch, CheckCircle,
  Activity, Flame, Eye, ChevronRight,
} from 'lucide-react';
import ScanButton from './ScanButton';

export const dynamic = 'force-dynamic';

const severityColor: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
  medium:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low:      'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
  positive: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

const severityDot: Record<string, string> = {
  critical: 'bg-red-400', high: 'bg-orange-400', medium: 'bg-amber-400',
  low: 'bg-zinc-500', positive: 'bg-emerald-400',
};

const typeIcon: Record<string, React.ElementType> = {
  accounting_red_flag: AlertTriangle, governance: Shield,
  management_credibility: UserCheck, capital_allocation: TrendingUp,
  divergence: GitBranch, positive: CheckCircle,
};

const typeLabel: Record<string, string> = {
  accounting_red_flag: 'Accounting', governance: 'Governance',
  management_credibility: 'Credibility', capital_allocation: 'Capital',
  divergence: 'Divergence', positive: 'Positive',
};

interface Signal {
  id: string; symbol: string; signal_type: string; severity: string;
  title: string; description: string; evidence: string | null;
  source_period: string | null; ai_confidence: number; created_at: string;
}

interface Holding {
  symbol: string; company_name: string; sector: string | null;
  quantity: number; avg_buy_price: number; total_invested: number;
}

export default async function IntelligenceDashboard() {
  const [holdingsRes, signalsRes] = await Promise.all([
    supabaseAdmin.from('demat_holdings')
      .select('symbol, company_name, sector, quantity, avg_buy_price, total_invested')
      .order('total_invested', { ascending: false }),
    supabaseAdmin.from('stock_signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const holdings = (holdingsRes.data ?? []) as Holding[];
  const signals = (signalsRes.data ?? []) as Signal[];

  // Stats
  const criticalCount = signals.filter(s => s.severity === 'critical').length;
  const highCount = signals.filter(s => s.severity === 'high').length;
  const positiveCount = signals.filter(s => s.severity === 'positive' || s.signal_type === 'positive').length;

  // Per-stock signal counts
  const stockSignalMap = new Map<string, { total: number; worst: string; types: Set<string> }>();
  for (const s of signals) {
    if (!stockSignalMap.has(s.symbol)) stockSignalMap.set(s.symbol, { total: 0, worst: 'low', types: new Set() });
    const entry = stockSignalMap.get(s.symbol)!;
    entry.total++;
    entry.types.add(s.signal_type);
    const rank = ['low', 'medium', 'high', 'critical'];
    if (rank.indexOf(s.severity) > rank.indexOf(entry.worst)) entry.worst = s.severity;
  }

  // Sector aggregation
  const sectorMap = new Map<string, { count: number; critical: number; stocks: string[] }>();
  for (const h of holdings) {
    const sec = h.sector ?? 'Other';
    if (!sectorMap.has(sec)) sectorMap.set(sec, { count: 0, critical: 0, stocks: [] });
    sectorMap.get(sec)!.stocks.push(h.symbol);
    const ss = stockSignalMap.get(h.symbol);
    if (ss) {
      sectorMap.get(sec)!.count += ss.total;
      if (ss.worst === 'critical') sectorMap.get(sec)!.critical++;
    }
  }

  // Signal type distribution
  const typeDist = new Map<string, number>();
  for (const s of signals) {
    typeDist.set(s.signal_type, (typeDist.get(s.signal_type) ?? 0) + 1);
  }
  const maxTypeCount = Math.max(...typeDist.values(), 1);

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Stock Intelligence</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{signals.length} signals across {holdings.length} holdings</p>
        </div>
        <ScanButton />
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Holdings', value: holdings.length, sub: `${stockSignalMap.size} analyzed`, color: 'text-white', bg: 'bg-zinc-800/60' },
          { label: 'Signals', value: signals.length, sub: `${typeDist.size} types`, color: 'text-amber-400', bg: 'bg-amber-500/5' },
          { label: 'Critical', value: criticalCount, sub: `${highCount} high`, color: 'text-red-400', bg: 'bg-red-500/5' },
          { label: 'Positive', value: positiveCount, sub: 'good signals', color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
          { label: 'Invested', value: '', sub: fmt(holdings.reduce((s, h) => s + h.total_invested, 0)), color: 'text-white', bg: 'bg-zinc-800/60' },
        ].map(({ label, value, sub, color, bg }) => (
          <div key={label} className={`rounded-xl border border-zinc-800 ${bg} px-4 py-3`}>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
            <p className={`text-lg font-black ${color} mt-0.5`}>{value}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        {/* Left: Holdings Table + Signals */}
        <div className="space-y-5">

          {/* Holdings Table */}
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">Portfolio Holdings</p>
              <p className="text-[10px] text-zinc-600">{holdings.length} stocks</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800/60">
                  <th className="text-left px-4 py-2">Stock</th>
                  <th className="text-left px-3 py-2">Sector</th>
                  <th className="text-right px-3 py-2">Invested</th>
                  <th className="text-center px-3 py-2">Signals</th>
                  <th className="text-center px-3 py-2">Risk</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {holdings.filter(h => h.sector !== 'Gold').map(h => {
                  const ss = stockSignalMap.get(h.symbol);
                  const worst = ss?.worst ?? 'none';
                  return (
                    <tr key={h.symbol} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-2">
                        <Link href={`/dashboard/investments/intelligence/${h.symbol}`} className="hover:text-amber-400 transition-colors">
                          <span className="font-mono font-semibold text-white text-xs">{h.symbol}</span>
                          <span className="text-[10px] text-zinc-600 ml-2 hidden xl:inline">{h.company_name.split(' ').slice(0, 3).join(' ')}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-800/60">{h.sector ?? '—'}</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-zinc-400">{fmt(h.total_invested)}</td>
                      <td className="px-3 py-2 text-center">
                        {ss ? (
                          <span className="text-xs font-semibold text-zinc-300">{ss.total}</span>
                        ) : (
                          <span className="text-[10px] text-zinc-700">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {worst !== 'none' && <span className={`inline-block h-2.5 w-2.5 rounded-full ${severityDot[worst] ?? 'bg-zinc-600'}`} />}
                      </td>
                      <td className="px-3 py-2">
                        <Link href={`/dashboard/investments/intelligence/${h.symbol}`}>
                          <ChevronRight className="h-3.5 w-3.5 text-zinc-700 hover:text-zinc-400 transition-colors" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Recent Signals */}
          <div>
            <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-3">Latest Signals</p>
            {signals.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
                <AlertTriangle className="h-6 w-6 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No signals yet. Click &quot;Scan All Stocks&quot; to start.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {signals.slice(0, 20).map(s => {
                  const Icon = typeIcon[s.signal_type] ?? AlertTriangle;
                  return (
                    <details key={s.id} className="rounded-xl border border-zinc-800 bg-zinc-900/30 group">
                      <summary className="flex items-center gap-3 px-4 py-2.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-zinc-800/30 transition-colors">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${severityDot[s.severity] ?? 'bg-zinc-600'}`} />
                        <Icon className={`h-3.5 w-3.5 shrink-0 ${severityColor[s.severity]?.split(' ')[0] ?? 'text-zinc-400'}`} />
                        <Link href={`/dashboard/investments/intelligence/${s.symbol}`}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 hover:text-white shrink-0">
                          {s.symbol}
                        </Link>
                        <p className="text-xs text-zinc-200 truncate flex-1">{s.title}</p>
                        <span className="text-[10px] text-zinc-600 shrink-0">{s.ai_confidence}%</span>
                      </summary>
                      <div className="px-4 pb-3 pt-1 border-t border-zinc-800/50">
                        <p className="text-xs text-zinc-400 leading-relaxed">{s.description}</p>
                        {s.evidence && (
                          <div className="mt-2 p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Evidence</p>
                            <p className="text-xs text-zinc-300">{s.evidence}</p>
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">
          {/* Signal Type Distribution */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">Signal Distribution</p>
            <div className="space-y-2">
              {Array.from(typeDist.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => {
                  const Icon = typeIcon[type] ?? Activity;
                  const pct = (count / maxTypeCount) * 100;
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <Icon className="h-3 w-3 text-zinc-500 shrink-0" />
                      <span className="text-[10px] text-zinc-400 w-20 truncate">{typeLabel[type] ?? type}</span>
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500/60 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 w-6 text-right">{count}</span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Sector Risk */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">Sector Risk</p>
            <div className="space-y-1.5">
              {Array.from(sectorMap.entries())
                .filter(([sec]) => sec !== 'Gold')
                .sort((a, b) => b[1].count - a[1].count)
                .map(([sector, data]) => (
                  <div key={sector} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-zinc-800/40 transition-colors">
                    <div className="flex items-center gap-2">
                      {data.critical > 0 && <span className="h-2 w-2 rounded-full bg-red-400" />}
                      {data.critical === 0 && data.count > 0 && <span className="h-2 w-2 rounded-full bg-amber-400" />}
                      {data.count === 0 && <span className="h-2 w-2 rounded-full bg-zinc-700" />}
                      <span className="text-xs text-zinc-300">{sector}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500">{data.stocks.length} stocks</span>
                      <span className="text-[10px] font-mono text-zinc-400">{data.count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Severity Breakdown */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">Severity</p>
            <div className="grid grid-cols-2 gap-2">
              {(['critical', 'high', 'medium', 'low', 'positive'] as const).map(sev => {
                const count = signals.filter(s => s.severity === sev).length;
                return (
                  <div key={sev} className={`rounded-lg border px-3 py-2 ${severityColor[sev]}`}>
                    <p className="text-lg font-black">{count}</p>
                    <p className="text-[10px] uppercase tracking-wide opacity-70">{sev}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
