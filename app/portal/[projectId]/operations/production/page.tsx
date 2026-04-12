/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect, notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';
import Link from 'next/link';
import { Factory, ArrowLeft } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtKg = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(n);

export default async function ProductionLogPage({ params }: { params: Promise<{ projectId: string }> }) {
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

  // Fetch production data
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(
    `${baseUrl}/api/portal/projects/${projectId}/operations/production?limit=90`,
    { cache: 'no-store', headers: { 'x-portal-customer': portalUser.customerId } },
  );

  const entries: any[] = res.ok ? await res.json() : [];

  // Compute summary
  const totalEntries = entries.length;
  const totalZinc = entries.reduce((s: number, e: any) => s + (e.zinc_out_kg ?? 0), 0);
  const totalDross = entries.reduce((s: number, e: any) => s + (e.dross_in_kg ?? 0), 0);
  const avgRecovery = totalDross > 0 ? (totalZinc / totalDross) * 100 : 0;
  const totalRevenue = entries.reduce((s: number, e: any) => s + (e.revenue ?? 0), 0);

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
          <Factory className="h-5 w-5 text-rose-400" />
          <h1 className="text-xl font-bold text-white">Production Log</h1>
        </div>
        <p className="text-sm text-zinc-500 mt-0.5">{project.name}</p>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className={`${glass} p-4`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Entries</p>
          <p className="text-lg font-bold text-white mt-1">{totalEntries}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Total Zinc</p>
          <p className="text-lg font-bold text-emerald-400 mt-1">{fmtKg(totalZinc)} kg</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Total Dross</p>
          <p className="text-lg font-bold text-white mt-1">{fmtKg(totalDross)} kg</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Avg Recovery</p>
          <p className="text-lg font-bold text-white mt-1">{avgRecovery.toFixed(1)}%</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Total Revenue</p>
          <p className="text-lg font-bold text-emerald-400 mt-1">{fmt(totalRevenue)}</p>
        </div>
      </div>

      {/* Full Table */}
      {entries.length === 0 ? (
        <div className={`${glass} p-12 text-center`}>
          <Factory className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">No production entries recorded yet.</p>
        </div>
      ) : (
        <div className={`${glass} p-5`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wide">
                  <th className="text-left py-2 pr-4">Date</th>
                  <th className="text-right py-2 pr-4">Dross In (kg)</th>
                  <th className="text-right py-2 pr-4">Zinc Out (kg)</th>
                  <th className="text-right py-2 pr-4">Recovery (%)</th>
                  <th className="text-right py-2 pr-4">Power (kWh)</th>
                  <th className="text-right py-2 pr-4">kWh/kg</th>
                  <th className="text-right py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e: any, i: number) => {
                  const kwhPerKg = e.zinc_out_kg > 0 ? (e.power_kwh ?? 0) / e.zinc_out_kg : 0;
                  return (
                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2.5 pr-4 text-zinc-300">{fmtDate(e.date)}</td>
                      <td className="py-2.5 pr-4 text-right text-zinc-400">{fmtKg(e.dross_in_kg)}</td>
                      <td className="py-2.5 pr-4 text-right text-emerald-400 font-medium">{fmtKg(e.zinc_out_kg)}</td>
                      <td className="py-2.5 pr-4 text-right text-zinc-300">{(e.recovery_pct ?? 0).toFixed(1)}%</td>
                      <td className="py-2.5 pr-4 text-right text-zinc-400">{fmtKg(e.power_kwh ?? 0)}</td>
                      <td className="py-2.5 pr-4 text-right text-zinc-500">{kwhPerKg.toFixed(2)}</td>
                      <td className="py-2.5 text-right text-emerald-400 font-medium">{fmt(e.revenue ?? 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-700 font-semibold">
                  <td className="py-3 pr-4 text-zinc-400">Total</td>
                  <td className="py-3 pr-4 text-right text-zinc-300">{fmtKg(totalDross)}</td>
                  <td className="py-3 pr-4 text-right text-emerald-400">{fmtKg(totalZinc)}</td>
                  <td className="py-3 pr-4 text-right text-zinc-300">{avgRecovery.toFixed(1)}%</td>
                  <td className="py-3 pr-4 text-right text-zinc-400">
                    {fmtKg(entries.reduce((s: number, e: any) => s + (e.power_kwh ?? 0), 0))}
                  </td>
                  <td className="py-3 pr-4 text-right text-zinc-500">—</td>
                  <td className="py-3 text-right text-emerald-400">{fmt(totalRevenue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
