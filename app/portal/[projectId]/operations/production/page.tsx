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
    .from('projects').select('id, name').eq('id', projectId).eq('customer_id', portalUser.customerId).single();
  if (!project) notFound();

  const { data: contract } = await supabaseAdmin
    .from('operations_contracts').select('id').eq('project_id', projectId).single();

  const entries: any[] = [];
  if (contract) {
    const { data } = await supabaseAdmin
      .from('production_logs')
      .select('log_date, dross_input_kg, zinc_recovered_kg, recovery_rate, power_kwh, power_per_kg, revenue')
      .eq('contract_id', contract.id)
      .order('log_date', { ascending: false })
      .limit(90);
    if (data) entries.push(...data);
  }

  const totalEntries = entries.length;
  const totalZinc = entries.reduce((s, e) => s + (e.zinc_recovered_kg ?? 0), 0);
  const totalDross = entries.reduce((s, e) => s + (e.dross_input_kg ?? 0), 0);
  const avgRecovery = totalDross > 0 ? (totalZinc / totalDross) * 100 : 0;
  const totalRevenue = entries.reduce((s, e) => s + (e.revenue ?? 0), 0);
  const totalPower = entries.reduce((s, e) => s + (e.power_kwh ?? 0), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <Link href={`/p/${projectId}/operations`} className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mb-3">
          <ArrowLeft className="h-3 w-3" /> Back to Operations
        </Link>
        <div className="flex items-center gap-2">
          <Factory className="h-5 w-5 text-rose-400" />
          <h1 className="text-xl font-bold text-white">Production Log</h1>
        </div>
        <p className="text-sm text-zinc-500 mt-0.5">{project.name}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className={`${glass} p-4`}><p className="text-xs text-zinc-500">Entries</p><p className="text-lg font-bold text-white mt-1">{totalEntries}</p></div>
        <div className={`${glass} p-4`}><p className="text-xs text-zinc-500">Total Zinc</p><p className="text-lg font-bold text-emerald-400 mt-1">{fmtKg(totalZinc)} kg</p></div>
        <div className={`${glass} p-4`}><p className="text-xs text-zinc-500">Total Dross</p><p className="text-lg font-bold text-white mt-1">{fmtKg(totalDross)} kg</p></div>
        <div className={`${glass} p-4`}><p className="text-xs text-zinc-500">Avg Recovery</p><p className="text-lg font-bold text-amber-400 mt-1">{avgRecovery.toFixed(1)}%</p></div>
        <div className={`${glass} p-4`}><p className="text-xs text-zinc-500">Total Revenue</p><p className="text-lg font-bold text-emerald-400 mt-1">{fmt(totalRevenue)}</p></div>
      </div>

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
                  <th className="text-left py-2 pr-3">Date</th>
                  <th className="text-right py-2 pr-3">Dross In</th>
                  <th className="text-right py-2 pr-3">Zinc Out</th>
                  <th className="text-right py-2 pr-3">Recovery</th>
                  <th className="text-right py-2 pr-3">Power</th>
                  <th className="text-right py-2 pr-3">kWh/kg</th>
                  <th className="text-right py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={i} className="border-t border-zinc-800/30">
                    <td className="py-2.5 pr-3 text-zinc-300">{fmtDate(e.log_date)}</td>
                    <td className="py-2.5 pr-3 text-right font-mono text-zinc-400">{fmtKg(e.dross_input_kg)} kg</td>
                    <td className="py-2.5 pr-3 text-right font-mono text-emerald-400">{fmtKg(e.zinc_recovered_kg)} kg</td>
                    <td className="py-2.5 pr-3 text-right font-mono text-amber-400">{(e.recovery_rate ?? 0).toFixed(1)}%</td>
                    <td className="py-2.5 pr-3 text-right font-mono text-zinc-400">{fmtKg(e.power_kwh ?? 0)}</td>
                    <td className="py-2.5 pr-3 text-right font-mono text-zinc-500">{(e.power_per_kg ?? 0).toFixed(2)}</td>
                    <td className="py-2.5 text-right font-mono text-emerald-400">{fmt(e.revenue ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-zinc-700 font-semibold">
                  <td className="py-3 pr-3 text-zinc-400">Total</td>
                  <td className="py-3 pr-3 text-right text-zinc-300">{fmtKg(totalDross)} kg</td>
                  <td className="py-3 pr-3 text-right text-emerald-400">{fmtKg(totalZinc)} kg</td>
                  <td className="py-3 pr-3 text-right text-amber-400">{avgRecovery.toFixed(1)}%</td>
                  <td className="py-3 pr-3 text-right text-zinc-400">{fmtKg(totalPower)}</td>
                  <td className="py-3 pr-3 text-right text-zinc-500">—</td>
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
