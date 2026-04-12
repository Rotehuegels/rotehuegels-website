/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect, notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';
import Link from 'next/link';
import {
  Factory, TrendingUp, Zap, FlaskConical, BarChart3,
  AlertTriangle, ArrowRight, Beaker, DollarSign, Percent,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

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

  // Fetch operations data from API
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/portal/projects/${projectId}/operations`, {
    cache: 'no-store',
    headers: { 'x-portal-customer': portalUser.customerId },
  });

  if (!res.ok) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className={`${glass} p-12 text-center`}>
          <Factory className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">Unable to load operations data.</p>
        </div>
      </div>
    );
  }

  const data: any = await res.json();
  const { contract, production, stats, lab } = data;

  const base = `/portal/${projectId}/operations`;

  if (!contract) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-xl font-bold text-white mb-1">Plant Operations</h1>
        <p className="text-sm text-zinc-500 mb-6">{project.name}</p>
        <div className={`${glass} p-12 text-center`}>
          <Factory className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">No operations contract for this project.</p>
          <p className="text-xs text-zinc-600 mt-1">Contact your account manager to set up plant operations tracking.</p>
        </div>
      </div>
    );
  }

  const recent = (production?.recent ?? []).slice(0, 7);
  const todayEntry = production?.today ?? null;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Factory className="h-5 w-5 text-rose-400" />
          <h1 className="text-xl font-bold text-white">Plant Operations</h1>
        </div>
        <p className="text-sm text-zinc-500">
          Contract: <span className="font-mono text-zinc-400">{contract.code ?? project.project_code}</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-blue-400" />
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Total Zinc Recovered</p>
          </div>
          <p className="text-lg font-bold text-white">{fmtKg(stats?.totalZincKg ?? 0)} kg</p>
        </div>
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Total Revenue</p>
          </div>
          <p className="text-lg font-bold text-emerald-400">{fmt(stats?.totalRevenue ?? 0)}</p>
        </div>
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <Percent className="h-4 w-4 text-amber-400" />
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Avg Recovery Rate</p>
          </div>
          <p className="text-lg font-bold text-white">{(stats?.avgRecoveryPct ?? 0).toFixed(1)}%</p>
        </div>
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-rose-400" />
            <p className="text-xs text-zinc-500 uppercase tracking-wide">ROI Recovery</p>
          </div>
          <p className="text-lg font-bold text-white">{(stats?.roiRecoveryPct ?? 0).toFixed(1)}%</p>
        </div>
      </div>

      {/* Today's Production */}
      {todayEntry && (
        <div className={`${glass} p-5`}>
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            Today&apos;s Production
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-zinc-500">Dross In</p>
              <p className="text-sm font-medium text-white">{fmtKg(todayEntry.dross_in_kg)} kg</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Zinc Out</p>
              <p className="text-sm font-medium text-emerald-400">{fmtKg(todayEntry.zinc_out_kg)} kg</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Recovery</p>
              <p className="text-sm font-medium text-white">{(todayEntry.recovery_pct ?? 0).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Power Used</p>
              <p className="text-sm font-medium text-white">{fmtKg(todayEntry.power_kwh ?? 0)} kWh</p>
            </div>
          </div>
        </div>
      )}

      {/* Last 7 Days Production */}
      {recent.length > 0 && (
        <div className={`${glass} p-5`}>
          <h2 className="text-sm font-semibold text-white mb-4">Last 7 Days Production</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wide">
                  <th className="text-left py-2 pr-4">Date</th>
                  <th className="text-right py-2 pr-4">Dross In (kg)</th>
                  <th className="text-right py-2 pr-4">Zinc Out (kg)</th>
                  <th className="text-right py-2 pr-4">Recovery (%)</th>
                  <th className="text-right py-2">Power (kWh)</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r: any, i: number) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    <td className="py-2.5 pr-4 text-zinc-300">{fmtDate(r.date)}</td>
                    <td className="py-2.5 pr-4 text-right text-zinc-400">{fmtKg(r.dross_in_kg)}</td>
                    <td className="py-2.5 pr-4 text-right text-emerald-400 font-medium">{fmtKg(r.zinc_out_kg)}</td>
                    <td className="py-2.5 pr-4 text-right text-zinc-300">{(r.recovery_pct ?? 0).toFixed(1)}%</td>
                    <td className="py-2.5 text-right text-zinc-400">{fmtKg(r.power_kwh ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lab Quality Alert */}
      {lab && (lab.outOfSpecCount ?? 0) > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-400">Quality Alert</h3>
              <p className="text-xs text-zinc-400 mt-1">
                {lab.outOfSpecCount} sample{lab.outOfSpecCount > 1 ? 's' : ''} with out-of-spec results detected.
                Review the LabREX dashboard for details.
              </p>
              <Link
                href={`${base}/lab`}
                className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 mt-2"
              >
                View LabREX <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className={`${glass} p-5`}>
        <h2 className="text-sm font-semibold text-white mb-3">Operations Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { label: 'Production Log', desc: 'Daily production entries', href: `${base}/production`, icon: Factory },
            { label: 'ROI Tracker',     desc: 'Investment recovery progress', href: `${base}/roi`,        icon: TrendingUp },
            { label: 'LabREX',          desc: 'Quality control & samples',   href: `${base}/lab`,        icon: FlaskConical },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-zinc-800/60 transition-colors group"
            >
              <item.icon className="h-5 w-5 text-zinc-500 group-hover:text-rose-400 transition-colors shrink-0" />
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
