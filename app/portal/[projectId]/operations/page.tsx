/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect, notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';
import Link from 'next/link';
import {
  Factory, TrendingUp, Zap, FlaskConical, BarChart3,
  AlertTriangle, ArrowRight, DollarSign, Percent,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

const fmtKg = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(n);

export default async function OperationsDashboardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const portalUser = await getPortalUser();
  if (!portalUser) redirect('/login?next=/portal');

  const { projectId } = await params;

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, name, project_code')
    .eq('id', projectId)
    .eq('customer_id', portalUser.customerId)
    .single();

  if (!project) notFound();

  // Get operations contract
  const { data: contract } = await supabaseAdmin
    .from('operations_contracts')
    .select('*')
    .eq('project_id', projectId)
    .single();

  if (!contract) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-xl font-bold text-white mb-1">Plant Operations</h1>
        <p className="text-sm text-zinc-500 mb-6">{project.name}</p>
        <div className={`${glass} p-12 text-center`}>
          <Factory className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">No operations contract for this project.</p>
        </div>
      </div>
    );
  }

  // Get last 30 days production
  const { data: recentLogs } = await supabaseAdmin
    .from('production_logs')
    .select('*')
    .eq('contract_id', contract.id)
    .order('log_date', { ascending: false })
    .limit(30);

  // All-time stats
  const { data: allLogs } = await supabaseAdmin
    .from('production_logs')
    .select('zinc_recovered_kg, dross_input_kg, revenue, power_kwh')
    .eq('contract_id', contract.id);

  const all = allLogs ?? [];
  const totalZinc = all.reduce((s, l) => s + (l.zinc_recovered_kg ?? 0), 0);
  const totalDross = all.reduce((s, l) => s + (l.dross_input_kg ?? 0), 0);
  const totalRevenue = all.reduce((s, l) => s + (l.revenue ?? 0), 0);
  const avgRecovery = totalDross > 0 ? (totalZinc / totalDross) * 100 : 0;
  const roiPct = contract.investment_amount > 0 ? (totalRevenue / contract.investment_amount) * 100 : 0;

  const recent = (recentLogs ?? []).slice(0, 7);
  const today = new Date().toISOString().split('T')[0];
  const todayEntry = (recentLogs ?? []).find(l => l.log_date === today);

  // Chart data: last 14 days reversed for left-to-right chronological
  const chartData = (recentLogs ?? []).slice(0, 14).reverse();
  const maxZinc = Math.max(...chartData.map(d => d.zinc_recovered_kg ?? 0), 1);
  const maxDross = Math.max(...chartData.map(d => d.dross_input_kg ?? 0), 1);
  const chartMax = Math.max(maxZinc, maxDross);

  // Lab alerts
  const { data: latestSamples } = await supabaseAdmin
    .from('lab_samples')
    .select('lab_results(is_within_spec)')
    .eq('contract_id', contract.id)
    .eq('status', 'completed')
    .order('collected_at', { ascending: false })
    .limit(10);

  const outOfSpec = (latestSamples ?? []).reduce((count, s) => {
    return count + ((s as any).lab_results ?? []).filter((r: any) => !r.is_within_spec).length;
  }, 0);

  const base = `/p/${projectId}/operations`;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Factory className="h-5 w-5 text-rose-400" />
          <h1 className="text-xl font-bold text-white">Plant Operations</h1>
        </div>
        <p className="text-sm text-zinc-500">{project.name} · {contract.contract_code}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`${glass} p-4`}>
          <div className="flex items-center gap-2 mb-1"><BarChart3 className="h-3.5 w-3.5 text-blue-400" /><p className="text-xs text-zinc-500">Total Zinc</p></div>
          <p className="text-lg font-bold text-white">{fmtKg(totalZinc)} kg</p>
        </div>
        <div className={`${glass} p-4`}>
          <div className="flex items-center gap-2 mb-1"><DollarSign className="h-3.5 w-3.5 text-emerald-400" /><p className="text-xs text-zinc-500">Revenue</p></div>
          <p className="text-lg font-bold text-emerald-400">{fmt(totalRevenue)}</p>
        </div>
        <div className={`${glass} p-4`}>
          <div className="flex items-center gap-2 mb-1"><Percent className="h-3.5 w-3.5 text-amber-400" /><p className="text-xs text-zinc-500">Avg Recovery</p></div>
          <p className="text-lg font-bold text-white">{avgRecovery.toFixed(1)}%</p>
        </div>
        <div className={`${glass} p-4`}>
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-3.5 w-3.5 text-rose-400" /><p className="text-xs text-zinc-500">ROI Recovery</p></div>
          <p className={`text-lg font-bold ${roiPct >= 100 ? 'text-emerald-400' : 'text-white'}`}>{roiPct.toFixed(1)}%</p>
        </div>
      </div>

      {/* Production Bar Chart */}
      {chartData.length > 0 && (
        <div className={`${glass} p-5`}>
          <h2 className="text-sm font-semibold text-white mb-4">Production Trend (Last 14 Days)</h2>
          <div className="flex items-end gap-1 h-40">
            {chartData.map((d, i) => {
              const drossH = chartMax > 0 ? ((d.dross_input_kg ?? 0) / chartMax) * 100 : 0;
              const zincH = chartMax > 0 ? ((d.zinc_recovered_kg ?? 0) / chartMax) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                  <div className="w-full flex gap-px" style={{ height: '140px', alignItems: 'flex-end' }}>
                    <div className="flex-1 bg-zinc-700/50 rounded-t transition-all" style={{ height: `${drossH}%` }} title={`Dross: ${fmtKg(d.dross_input_kg)} kg`} />
                    <div className="flex-1 bg-emerald-500/70 rounded-t transition-all" style={{ height: `${zincH}%` }} title={`Zinc: ${fmtKg(d.zinc_recovered_kg)} kg`} />
                  </div>
                  <span className="text-[9px] text-zinc-600 truncate w-full text-center">{fmtDate(d.log_date)}</span>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs whitespace-nowrap shadow-lg">
                    <p className="text-zinc-300">{fmtDate(d.log_date)}</p>
                    <p className="text-zinc-500">Dross: <span className="text-zinc-300">{fmtKg(d.dross_input_kg)} kg</span></p>
                    <p className="text-zinc-500">Zinc: <span className="text-emerald-400">{fmtKg(d.zinc_recovered_kg)} kg</span></p>
                    <p className="text-zinc-500">Recovery: <span className="text-amber-400">{(d.recovery_rate ?? 0).toFixed(1)}%</span></p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-zinc-700/50" /> Dross Input</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-emerald-500/70" /> Zinc Recovered</span>
          </div>
        </div>
      )}

      {/* Today's Production */}
      {todayEntry && (
        <div className={`${glass} p-5`}>
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" /> Today&apos;s Production
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><p className="text-xs text-zinc-500">Dross In</p><p className="text-sm font-medium text-white">{fmtKg(todayEntry.dross_input_kg)} kg</p></div>
            <div><p className="text-xs text-zinc-500">Zinc Out</p><p className="text-sm font-medium text-emerald-400">{fmtKg(todayEntry.zinc_recovered_kg)} kg</p></div>
            <div><p className="text-xs text-zinc-500">Recovery</p><p className="text-sm font-medium text-white">{(todayEntry.recovery_rate ?? 0).toFixed(1)}%</p></div>
            <div><p className="text-xs text-zinc-500">Revenue</p><p className="text-sm font-medium text-emerald-400">{fmt(todayEntry.revenue ?? 0)}</p></div>
          </div>
        </div>
      )}

      {/* ROI Progress Bar */}
      <div className={`${glass} p-5`}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-rose-400" /> Investment Recovery
          </h2>
          <Link href={`${base}/roi`} className="text-xs text-rose-400 hover:text-rose-300">Details →</Link>
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
          <span>Invested: {fmt(contract.investment_amount)}</span>
          <span>Recovered: {fmt(totalRevenue)} ({roiPct.toFixed(1)}%)</span>
        </div>
        <div className="h-4 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${roiPct >= 100 ? 'bg-emerald-500' : roiPct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: `${Math.min(roiPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Lab Quality Alert */}
      {outOfSpec > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-400">Quality Alert</h3>
              <p className="text-xs text-zinc-400 mt-1">{outOfSpec} parameter(s) out of spec in recent samples.</p>
              <Link href={`${base}/lab`} className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 mt-2">
                View LabREX <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Last 7 Days Table */}
      {recent.length > 0 && (
        <div className={`${glass} p-5`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Recent Production</h2>
            <Link href={`${base}/production`} className="text-xs text-rose-400 hover:text-rose-300">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wide">
                  <th className="text-left py-2 pr-3">Date</th>
                  <th className="text-right py-2 pr-3">Dross In</th>
                  <th className="text-right py-2 pr-3">Zinc Out</th>
                  <th className="text-right py-2 pr-3">Recovery</th>
                  <th className="text-right py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((l: any) => (
                  <tr key={l.id} className="border-t border-zinc-800/30">
                    <td className="py-2 pr-3 text-zinc-300">{fmtDate(l.log_date)}</td>
                    <td className="py-2 pr-3 text-right font-mono text-zinc-400">{fmtKg(l.dross_input_kg)} kg</td>
                    <td className="py-2 pr-3 text-right font-mono text-emerald-400">{fmtKg(l.zinc_recovered_kg)} kg</td>
                    <td className="py-2 pr-3 text-right font-mono text-amber-400">{(l.recovery_rate ?? 0).toFixed(1)}%</td>
                    <td className="py-2 text-right font-mono text-emerald-400">{fmt(l.revenue ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className={`${glass} p-5`}>
        <h2 className="text-sm font-semibold text-white mb-3">Operations Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { label: 'Production Log', desc: 'All daily entries', href: `${base}/production`, icon: Factory },
            { label: 'ROI Tracker', desc: 'Investment recovery timeline', href: `${base}/roi`, icon: TrendingUp },
            { label: 'LabREX', desc: 'Quality control & samples', href: `${base}/lab`, icon: FlaskConical },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-zinc-800/60 transition-colors group">
              <item.icon className="h-5 w-5 text-zinc-500 group-hover:text-rose-400 shrink-0" />
              <div>
                <p className="text-sm text-zinc-300 group-hover:text-white font-medium">{item.label}</p>
                <p className="text-xs text-zinc-600">{item.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-400 ml-auto shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
