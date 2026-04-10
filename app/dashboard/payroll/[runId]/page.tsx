import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MONTH_NAMES } from '@/lib/payroll';
import { ChevronLeft, Users, IndianRupee, TrendingDown, Building2, Pencil, Download } from 'lucide-react';
import RunEntries from './RunEntries';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 }).format(n);

const STATUS_BADGE = {
  draft:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
  processed: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  paid:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;

  const [{ data: run }, { data: entriesRaw }, { data: empsRaw }] = await Promise.all([
    supabaseAdmin.from('payroll_runs').select('*').eq('id', runId).single(),
    supabaseAdmin.from('payroll_entries').select('*').eq('run_id', runId).order('created_at'),
    supabaseAdmin.from('employees').select('id, role, department, rex_members(full_name, bank_account, bank_ifsc)').eq('status', 'active'),
  ]);

  if (!run) notFound();

  const entries   = entriesRaw ?? [];
  // Supabase infers rex_members as array; normalize to object (it's a many-to-one join)
  const employees = (empsRaw ?? []).map((e) => ({
    ...e,
    rex_members: Array.isArray(e.rex_members) ? (e.rex_members[0] ?? null) : e.rex_members,
  }));

  const totalGross     = entries.reduce((s, e) => s + (e.gross_pay        ?? 0), 0);
  const totalDed       = entries.reduce((s, e) => s + (e.total_deductions ?? 0), 0);
  const totalNet       = entries.reduce((s, e) => s + (e.net_pay          ?? 0), 0);
  const totalEmpCost   = entries.reduce((s, e) => s + (e.gross_pay ?? 0) + (e.epf_employer ?? 0) + (e.esi_employer ?? 0), 0);

  return (
    <div className="p-5 md:p-8 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/payroll" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">
                {MONTH_NAMES[run.month]} {run.year}
              </h1>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[run.status as keyof typeof STATUS_BADGE] ?? STATUS_BADGE.draft}`}>
                {run.status}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-zinc-500">
              {entries.length} employees ·
              {run.processed_at
                ? ` Processed ${new Date(run.processed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : ' Draft — not yet processed'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {run.status !== 'paid' && (
            <Link
              href={`/dashboard/payroll/${runId}/edit`}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
          )}
          <a
            href={`/api/payroll/${runId}/export`}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </a>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Gross Payroll', value: totalGross,   icon: Users,        color: 'text-white' },
          { label: 'Deductions',    value: totalDed,     icon: TrendingDown, color: 'text-rose-400' },
          { label: 'Net Pay',       value: totalNet,     icon: IndianRupee,  color: 'text-emerald-400' },
          { label: 'Employer Cost', value: totalEmpCost, icon: Building2,    color: 'text-indigo-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`${glass} p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-zinc-500" />
              <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
            </div>
            <p className={`text-xl font-bold ${color}`}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* Deductions breakdown */}
      <div className={`${glass} p-4`}>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Deductions Breakdown (all employees)</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {[
            { label: 'EPF (Emp)',  value: entries.reduce((s, e) => s + (e.epf_employee ?? 0), 0) },
            { label: 'ESI (Emp)',  value: entries.reduce((s, e) => s + (e.esi_employee ?? 0), 0) },
            { label: 'Prof. Tax',  value: entries.reduce((s, e) => s + (e.professional_tax ?? 0), 0) },
            { label: 'TDS',        value: entries.reduce((s, e) => s + (e.tds ?? 0), 0) },
            { label: 'Advances',   value: entries.reduce((s, e) => s + (e.advance_recovery ?? 0), 0) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-zinc-800/40 px-3 py-2">
              <p className="text-zinc-500">{label}</p>
              <p className="font-semibold text-zinc-200 mt-0.5">{fmt(value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Entries table */}
      <div className={glass}>
        <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-3">
          <h2 className="font-semibold text-white text-sm">Payslip Entries</h2>
          {run.status === 'draft' && (
            <span className="text-xs text-zinc-500">Click Edit to adjust LOP, bonus, TDS or advances per employee</span>
          )}
        </div>
        <div className="p-4">
          <RunEntries
            runId={runId}
            month={run.month}
            year={run.year}
            status={run.status}
            entries={entries}
            employees={employees}
          />
        </div>
      </div>
    </div>
  );
}
