/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect, notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';
import Link from 'next/link';
import { TrendingUp, ArrowLeft, Target, DollarSign, Calendar, Clock } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

const fmtDateFull = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function barColor(pct: number): string {
  if (pct >= 100) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
}

function textColor(pct: number): string {
  if (pct >= 100) return 'text-emerald-400';
  if (pct >= 50) return 'text-amber-400';
  return 'text-rose-400';
}

export default async function ROITrackerPage({ params }: { params: Promise<{ projectId: string }> }) {
  const portalUser = await getPortalUser();
  if (!portalUser) redirect('/login?next=/portal');

  const { projectId } = await params;

  const { data: project } = await supabaseAdmin
    .from('projects').select('id, name').eq('id', projectId).eq('customer_id', portalUser.customerId).single();
  if (!project) notFound();

  const { data: contract } = await supabaseAdmin
    .from('operations_contracts').select('id, investment_amount, contract_start').eq('project_id', projectId).single();

  if (!contract) {
    return (
      <div className="p-6 max-w-[1800px] mx-auto">
        <div className={`${glass} p-12 text-center`}>
          <TrendingUp className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">No operations contract found.</p>
        </div>
      </div>
    );
  }

  // All production logs sorted by date
  const { data: logs } = await supabaseAdmin
    .from('production_logs')
    .select('log_date, revenue, zinc_recovered_kg')
    .eq('contract_id', contract.id)
    .order('log_date');

  const entries = logs ?? [];
  const investment = contract.investment_amount ?? 0;

  // Build cumulative timeline
  let cumulative = 0;
  const timeline = entries.map(l => {
    cumulative += l.revenue ?? 0;
    return {
      date: l.log_date,
      dailyRevenue: l.revenue ?? 0,
      cumulative,
      pct: investment > 0 ? (cumulative / investment) * 100 : 0,
      zinc: l.zinc_recovered_kg ?? 0,
    };
  });

  const totalRevenue = cumulative;
  const recoveryPct = investment > 0 ? (totalRevenue / investment) * 100 : 0;
  const remaining = Math.max(0, investment - totalRevenue);
  const avgDaily = entries.length > 0 ? totalRevenue / entries.length : 0;
  const daysToBreakeven = avgDaily > 0 ? Math.ceil(remaining / avgDaily) : null;
  const breakevenDate = daysToBreakeven != null
    ? new Date(Date.now() + daysToBreakeven * 86400000).toISOString().split('T')[0]
    : null;

  // Chart: cumulative revenue area
  const chartMax = Math.max(investment, totalRevenue, 1);
  const investmentLine = (investment / chartMax) * 100;

  return (
    <div className="p-6 max-w-[1800px] mx-auto space-y-6">

      <div>
        <Link href={`/p/${projectId}/operations`} className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mb-3">
          <ArrowLeft className="h-3 w-3" /> Back to Operations
        </Link>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-rose-400" />
          <h1 className="text-xl font-bold text-white">Investment Recovery Tracker</h1>
        </div>
        <p className="text-sm text-zinc-500">{project.name}</p>
      </div>

      {/* Big progress bar */}
      <div className={`${glass} p-5`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">Recovery Progress</span>
          <span className={`text-2xl font-black ${textColor(recoveryPct)}`}>{recoveryPct.toFixed(1)}%</span>
        </div>
        <div className="h-5 rounded-full bg-zinc-800 overflow-hidden relative">
          <div className={`h-full rounded-full transition-all ${barColor(recoveryPct)}`} style={{ width: `${Math.min(recoveryPct, 100)}%` }} />
          {recoveryPct < 100 && (
            <div className="absolute top-0 right-0 h-full flex items-center pr-2">
              <span className="text-[10px] text-zinc-500">{fmt(remaining)} remaining</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`${glass} p-4`}>
          <div className="flex items-center gap-1.5 mb-1"><Target className="h-3.5 w-3.5 text-zinc-500" /><p className="text-xs text-zinc-500">Investment</p></div>
          <p className="text-lg font-bold text-white">{fmt(investment)}</p>
        </div>
        <div className={`${glass} p-4`}>
          <div className="flex items-center gap-1.5 mb-1"><DollarSign className="h-3.5 w-3.5 text-emerald-400" /><p className="text-xs text-zinc-500">Revenue</p></div>
          <p className="text-lg font-bold text-emerald-400">{fmt(totalRevenue)}</p>
        </div>
        <div className={`${glass} p-4`}>
          <div className="flex items-center gap-1.5 mb-1"><Clock className="h-3.5 w-3.5 text-amber-400" /><p className="text-xs text-zinc-500">Avg Daily</p></div>
          <p className="text-lg font-bold text-white">{fmt(avgDaily)}</p>
        </div>
        <div className={`${glass} p-4`}>
          <div className="flex items-center gap-1.5 mb-1"><Calendar className="h-3.5 w-3.5 text-blue-400" /><p className="text-xs text-zinc-500">Est. Breakeven</p></div>
          <p className="text-sm font-bold text-white">{breakevenDate ? fmtDateFull(breakevenDate) : '—'}</p>
          {daysToBreakeven != null && <p className="text-xs text-zinc-600">{daysToBreakeven} days</p>}
        </div>
      </div>

      {/* Cumulative Revenue Chart */}
      {timeline.length > 1 && (
        <div className={`${glass} p-5`}>
          <h2 className="text-sm font-semibold text-white mb-4">Cumulative Revenue vs Investment</h2>
          <div className="relative h-48">
            {/* Investment target line */}
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-rose-500/40 z-10"
              style={{ bottom: `${investmentLine}%` }}
            >
              <span className="absolute right-0 -top-4 text-[10px] text-rose-400">Target: {fmt(investment)}</span>
            </div>

            {/* Area chart using CSS */}
            <div className="flex items-end h-full gap-px">
              {timeline.map((t, i) => {
                const h = chartMax > 0 ? (t.cumulative / chartMax) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                    <div
                      className={`w-full rounded-t-sm transition-all ${t.cumulative >= investment ? 'bg-emerald-500/60' : 'bg-blue-500/50'}`}
                      style={{ height: `${h}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-20 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs whitespace-nowrap shadow-lg">
                      <p className="text-zinc-300">{fmtDate(t.date)}</p>
                      <p className="text-zinc-500">Daily: <span className="text-emerald-400">{fmt(t.dailyRevenue)}</span></p>
                      <p className="text-zinc-500">Cumulative: <span className="text-white font-medium">{fmt(t.cumulative)}</span></p>
                      <p className="text-zinc-500">Recovery: <span className={textColor(t.pct)}>{t.pct.toFixed(1)}%</span></p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-blue-500/50" /> Cumulative Revenue</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-t-2 border-dashed border-rose-500/40" /> Investment Target</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-emerald-500/60" /> Above Target</span>
          </div>
        </div>
      )}

      {/* Timeline Table */}
      {timeline.length > 0 && (
        <div className={`${glass} p-5`}>
          <h2 className="text-sm font-semibold text-white mb-3">Daily Revenue Timeline</h2>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-xs min-w-[500px]">
              <thead className="sticky top-0 bg-zinc-900">
                <tr className="border-b border-zinc-700 text-zinc-500 uppercase tracking-wide">
                  <th className="text-left py-2 pr-3">Date</th>
                  <th className="text-right py-2 pr-3">Daily Revenue</th>
                  <th className="text-right py-2 pr-3">Cumulative</th>
                  <th className="text-right py-2 pr-3">Recovery %</th>
                  <th className="text-right py-2">Zinc (kg)</th>
                </tr>
              </thead>
              <tbody>
                {[...timeline].reverse().map((t, i) => (
                  <tr key={i} className="border-t border-zinc-800/30">
                    <td className="py-2 pr-3 text-zinc-300">{fmtDate(t.date)}</td>
                    <td className="py-2 pr-3 text-right font-mono text-emerald-400">{fmt(t.dailyRevenue)}</td>
                    <td className="py-2 pr-3 text-right font-mono text-white">{fmt(t.cumulative)}</td>
                    <td className={`py-2 pr-3 text-right font-mono ${textColor(t.pct)}`}>{t.pct.toFixed(1)}%</td>
                    <td className="py-2 text-right font-mono text-zinc-400">{t.zinc.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {timeline.length === 0 && (
        <div className={`${glass} p-12 text-center`}>
          <TrendingUp className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">No production data yet. ROI tracking will begin once operations start.</p>
        </div>
      )}
    </div>
  );
}
