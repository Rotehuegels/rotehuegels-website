import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { MONTH_NAMES } from '@/lib/payroll';
import { IndianRupee, Plus, CheckCircle2, Clock, Banknote } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmtCompact = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 }).format(n);
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const STATUS_STYLE = {
  draft:     { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',   label: 'Draft',     icon: Clock },
  processed: { cls: 'bg-sky-500/10 text-sky-400 border-sky-500/20',         label: 'Processed', icon: CheckCircle2 },
  paid:      { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Paid',  icon: Banknote },
};

export default async function PayrollPage() {
  const [{ data: runsRaw }, { data: employees }] = await Promise.all([
    supabaseAdmin.from('payroll_runs').select('*').order('year', { ascending: false }).order('month', { ascending: false }),
    supabaseAdmin.from('employees').select('id').ilike('status', 'active'),
  ]);

  const runs = runsRaw ?? [];
  const activeCount = employees?.length ?? 0;
  const latestRun = runs[0];

  const totalPaidOut = runs
    .filter((r) => r.status === 'paid')
    .reduce((s, r) => s + (r.total_net ?? 0), 0);

  return (
    <div className="p-5 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payroll</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{activeCount} active employees · {runs.length} runs</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/d/payroll/setup"
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
            Salary Setup
          </Link>
          <Link href="/d/payroll/new"
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 transition-colors">
            <Plus className="h-4 w-4" /> Run Payroll
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={`${glass} p-4`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Active Employees</p>
          <p className="mt-2 text-2xl font-bold text-white">{activeCount}</p>
          <p className="mt-0.5 text-xs text-zinc-600">on payroll</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Last Month Net</p>
          <p className="mt-2 text-xl font-bold text-emerald-400">
            {latestRun ? fmtCompact(latestRun.total_net) : '—'}
          </p>
          <p className="mt-0.5 text-xs text-zinc-600">
            {latestRun ? `${MONTH_NAMES[latestRun.month]} ${latestRun.year}` : 'No runs yet'}
          </p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Employer Cost</p>
          <p className="mt-2 text-xl font-bold text-rose-400">
            {latestRun ? fmtCompact(latestRun.total_employer_cost) : '—'}
          </p>
          <p className="mt-0.5 text-xs text-zinc-600">incl. PF + ESI (employer)</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Total Paid Out</p>
          <p className="mt-2 text-xl font-bold text-indigo-400">{fmtCompact(totalPaidOut)}</p>
          <p className="mt-0.5 text-xs text-zinc-600">across {runs.filter(r => r.status === 'paid').length} paid runs</p>
        </div>
      </div>

      {/* Runs list */}
      <div className={glass}>
        <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-3">
          <IndianRupee className="h-4 w-4 text-indigo-400" />
          <h2 className="font-semibold text-white text-sm">Payroll Runs</h2>
        </div>

        {runs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-500 text-sm">No payroll runs yet.</p>
            <Link href="/d/payroll/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors">
              <Plus className="h-4 w-4" /> Run First Payroll
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Period</th>
                  <th className="px-4 py-3 text-right">Employees</th>
                  <th className="px-4 py-3 text-right">Gross</th>
                  <th className="px-4 py-3 text-right">Deductions</th>
                  <th className="px-4 py-3 text-right">Net Pay</th>
                  <th className="px-4 py-3 text-right">Employer Cost</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {runs.map((run) => {
                  const st = STATUS_STYLE[run.status as keyof typeof STATUS_STYLE] ?? STATUS_STYLE.draft;
                  const Icon = st.icon;
                  return (
                    <tr key={run.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-white">{MONTH_NAMES[run.month]} {run.year}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {run.processed_at
                            ? `Processed ${new Date(run.processed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                            : 'Draft'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-300">—</td>
                      <td className="px-4 py-3 text-right text-zinc-300 font-mono">{fmt(run.total_gross)}</td>
                      <td className="px-4 py-3 text-right text-rose-400 font-mono">{fmt(run.total_deductions)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-400 font-mono">{fmt(run.total_net)}</td>
                      <td className="px-4 py-3 text-right text-zinc-400 font-mono">{fmt(run.total_employer_cost)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${st.cls}`}>
                          <Icon className="h-3 w-3" />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/d/payroll/${run.id}`}
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
