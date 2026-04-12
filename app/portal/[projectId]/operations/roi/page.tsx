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
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function recoveryColor(pct: number): string {
  if (pct >= 50) return 'text-emerald-400';
  if (pct >= 25) return 'text-amber-400';
  return 'text-red-400';
}

function recoveryBarColor(pct: number): string {
  if (pct >= 50) return 'bg-emerald-500';
  if (pct >= 25) return 'bg-amber-500';
  return 'bg-red-500';
}

export default async function ROITrackerPage({ params }: { params: Promise<{ projectId: string }> }) {
  const portalUser = await getPortalUser();
  if (!portalUser) redirect('/login?next=/portal');

  const { projectId } = await params;

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .eq('customer_id', portalUser.customerId)
    .single();

  if (!project) notFound();

  // Fetch ROI data
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(
    `${baseUrl}/api/portal/projects/${projectId}/operations/roi`,
    { cache: 'no-store', headers: { 'x-portal-customer': portalUser.customerId } },
  );

  if (!res.ok) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className={`${glass} p-12 text-center`}>
          <TrendingUp className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">Unable to load ROI data.</p>
        </div>
      </div>
    );
  }

  const data: any = await res.json();
  const {
    investment = 0,
    totalRevenue = 0,
    recoveryPct = 0,
    remaining = 0,
    avgDailyRevenue = 0,
    daysToBreakeven = null,
    estimatedBreakeven = null,
    timeline = [],
  } = data;

  const clampedPct = Math.min(recoveryPct, 100);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Back + Header */}
      <div>
        <Link
          href={`/portal/${projectId}/operations`}
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mb-3"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Operations
        </Link>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-rose-400" />
          <h1 className="text-xl font-bold text-white">Investment Recovery Tracker</h1>
        </div>
        <p className="text-sm text-zinc-500 mt-0.5">{project.name}</p>
      </div>

      {/* Big Progress Bar */}
      <div className={`${glass} p-6`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-zinc-400">Recovery Progress</span>
          <span className={`text-2xl font-bold ${recoveryColor(recoveryPct)}`}>
            {recoveryPct.toFixed(1)}%
          </span>
        </div>
        <div className="h-5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full ${recoveryBarColor(recoveryPct)} transition-all duration-700`}
            style={{ width: `${clampedPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-zinc-600">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-400" />
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Investment Amount</p>
          </div>
          <p className="text-lg font-bold text-white">{fmt(investment)}</p>
        </div>
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Revenue Collected</p>
          </div>
          <p className={`text-lg font-bold ${recoveryColor(recoveryPct)}`}>{fmt(totalRevenue)}</p>
        </div>
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Remaining</p>
          </div>
          <p className={`text-lg font-bold ${remaining > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {fmt(Math.max(remaining, 0))}
          </p>
        </div>
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-zinc-400" />
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Avg Daily Revenue</p>
          </div>
          <p className="text-lg font-bold text-white">{fmt(avgDailyRevenue)}</p>
        </div>
      </div>

      {/* Estimated Breakeven */}
      {(estimatedBreakeven || daysToBreakeven) && (
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-rose-400" />
            <h2 className="text-sm font-semibold text-white">Estimated Breakeven</h2>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            {estimatedBreakeven && (
              <div>
                <p className="text-xs text-zinc-500">Date</p>
                <p className="text-white font-medium">{fmtDate(estimatedBreakeven)}</p>
              </div>
            )}
            {daysToBreakeven !== null && (
              <div>
                <p className="text-xs text-zinc-500">Days Remaining</p>
                <p className={`font-medium ${daysToBreakeven <= 30 ? 'text-emerald-400' : 'text-white'}`}>
                  {daysToBreakeven > 0 ? `${daysToBreakeven} days` : 'Breakeven reached!'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline Table */}
      {timeline.length > 0 && (
        <div className={`${glass} p-5`}>
          <h2 className="text-sm font-semibold text-white mb-4">Recovery Timeline</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wide">
                  <th className="text-left py-2 pr-4">Date</th>
                  <th className="text-right py-2 pr-4">Daily Revenue</th>
                  <th className="text-right py-2 pr-4">Cumulative Revenue</th>
                  <th className="text-right py-2">Recovery %</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((t: any, i: number) => (
                  <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2.5 pr-4 text-zinc-300">{fmtDate(t.date)}</td>
                    <td className="py-2.5 pr-4 text-right text-zinc-400">{fmt(t.dailyRevenue ?? 0)}</td>
                    <td className="py-2.5 pr-4 text-right text-emerald-400 font-medium">{fmt(t.cumulativeRevenue ?? 0)}</td>
                    <td className={`py-2.5 text-right font-medium ${recoveryColor(t.recoveryPct ?? 0)}`}>
                      {(t.recoveryPct ?? 0).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state if no timeline */}
      {timeline.length === 0 && (
        <div className={`${glass} p-12 text-center`}>
          <TrendingUp className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">No recovery timeline data available yet.</p>
          <p className="text-xs text-zinc-600 mt-1">Timeline will populate as daily production generates revenue.</p>
        </div>
      )}
    </div>
  );
}
