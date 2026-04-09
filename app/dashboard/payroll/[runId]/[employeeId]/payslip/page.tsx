import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import { MONTH_NAMES, numToWords } from '@/lib/payroll';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtN = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

export default async function PayslipPage({
  params,
}: {
  params: Promise<{ runId: string; employeeId: string }>;
}) {
  const { runId, employeeId } = await params;

  const [{ data: run }, { data: entry }, { data: emp }] = await Promise.all([
    supabaseAdmin.from('payroll_runs').select('*').eq('id', runId).single(),
    supabaseAdmin.from('payroll_entries').select('*').eq('run_id', runId).eq('employee_id', employeeId).single(),
    supabaseAdmin.from('employees').select('*').eq('id', employeeId).single(),
  ]);

  if (!run || !entry || !emp) notFound();

  const periodLabel = `${MONTH_NAMES[run.month]} ${run.year}`;
  const daysLabel   = `${entry.days_present} / ${entry.working_days} days`;
  const lopLabel    = entry.lop_days > 0 ? `${entry.lop_days} days LOP` : null;

  const earnings = [
    { label: 'Basic Salary',       amount: entry.basic },
    { label: 'House Rent Allowance (HRA)', amount: entry.hra },
    { label: 'Special Allowance',  amount: entry.special_allowance },
    entry.other_allowance > 0 && { label: 'Other Allowance', amount: entry.other_allowance },
    entry.bonus > 0            && { label: 'Bonus / Incentive', amount: entry.bonus },
    entry.lop_deduction > 0    && { label: 'Loss of Pay Deduction', amount: -entry.lop_deduction },
  ].filter(Boolean) as { label: string; amount: number }[];

  const deductions = [
    entry.epf_employee   > 0 && { label: 'Provident Fund (Employee 12%)', amount: entry.epf_employee },
    entry.esi_employee   > 0 && { label: 'ESIC (Employee 0.75%)',          amount: entry.esi_employee },
    entry.professional_tax > 0 && { label: 'Professional Tax',            amount: entry.professional_tax },
    entry.tds            > 0 && { label: 'TDS (Income Tax)',               amount: entry.tds },
    entry.advance_recovery > 0 && { label: 'Advance Recovery',            amount: entry.advance_recovery },
    entry.other_deductions > 0 && { label: 'Other Deductions',            amount: entry.other_deductions },
  ].filter(Boolean) as { label: string; amount: number }[];

  return (
    <div className="min-h-screen bg-white text-black p-0">
      {/* Print button — hidden on print */}
      <div className="print:hidden bg-zinc-900 border-b border-zinc-700 px-6 py-3 flex items-center justify-between">
        <a href={`/dashboard/payroll/${runId}`} className="text-sm text-zinc-400 hover:text-white transition-colors">
          ← Back to Run
        </a>
        <button
          onClick={() => typeof window !== 'undefined' && window.print()}
          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 transition-colors"
        >
          Print / Save PDF
        </button>
      </div>

      {/* Payslip */}
      <div className="max-w-3xl mx-auto p-8 print:p-6 font-sans">

        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-zinc-800 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Rotehügels</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Proprietary Concern · Navi Mumbai</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-zinc-800">SALARY SLIP</p>
            <p className="text-sm text-zinc-500">{periodLabel}</p>
          </div>
        </div>

        {/* Employee details */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm border border-zinc-200 rounded-lg p-4 mb-6">
          {[
            ['Employee ID',    emp.employee_code ?? '—'],
            ['Employee Name',  emp.full_name],
            ['Designation',    emp.role],
            ['Department',     emp.department ?? '—'],
            ['Employee Type',  emp.employment_type?.replace('_', '-')],
            ['Date of Joining', emp.join_date ? new Date(emp.join_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'],
            ['Pay Period',     periodLabel],
            ['Working Days',   daysLabel + (lopLabel ? ` (${lopLabel})` : '')],
            ['Bank',           emp.bank_name ? `${emp.bank_name} — ${emp.bank_account ?? ''}` : '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <span className="text-zinc-500 w-32 shrink-0">{label}:</span>
              <span className="font-medium text-zinc-800">{value}</span>
            </div>
          ))}
        </div>

        {/* Earnings & Deductions */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Earnings */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Earnings</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-100">
                  <th className="text-left px-3 py-1.5 text-xs text-zinc-600">Component</th>
                  <th className="text-right px-3 py-1.5 text-xs text-zinc-600">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {earnings.map((e) => (
                  <tr key={e.label}>
                    <td className="px-3 py-1.5 text-zinc-700">{e.label}</td>
                    <td className={`px-3 py-1.5 text-right font-mono ${e.amount < 0 ? 'text-rose-600' : 'text-zinc-800'}`}>
                      {e.amount < 0 ? `(${fmtN(-e.amount)})` : fmtN(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-zinc-50 font-semibold border-t border-zinc-300">
                  <td className="px-3 py-2 text-zinc-700">Gross Earnings</td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-900">{fmtN(entry.gross_pay)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Deductions</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-100">
                  <th className="text-left px-3 py-1.5 text-xs text-zinc-600">Component</th>
                  <th className="text-right px-3 py-1.5 text-xs text-zinc-600">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {deductions.length === 0 ? (
                  <tr><td className="px-3 py-1.5 text-zinc-400 text-xs" colSpan={2}>No deductions</td></tr>
                ) : deductions.map((d) => (
                  <tr key={d.label}>
                    <td className="px-3 py-1.5 text-zinc-700">{d.label}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-zinc-800">{fmtN(d.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-zinc-50 font-semibold border-t border-zinc-300">
                  <td className="px-3 py-2 text-zinc-700">Total Deductions</td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-900">{fmtN(entry.total_deductions)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Net Pay */}
        <div className="rounded-lg bg-zinc-900 text-white p-4 flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wider">Net Pay</p>
            <p className="text-2xl font-bold mt-0.5">{fmt(entry.net_pay)}</p>
            <p className="text-xs text-zinc-400 mt-0.5 italic">{numToWords(entry.net_pay)}</p>
          </div>
          <div className="text-right text-xs text-zinc-400 space-y-0.5">
            <p>Gross: {fmt(entry.gross_pay)}</p>
            <p>Deductions: {fmt(entry.total_deductions)}</p>
            {entry.epf_employer > 0 && <p className="text-zinc-500">+ Employer PF: {fmt(entry.epf_employer)}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between border-t border-zinc-200 pt-6 mt-4">
          <div className="text-xs text-zinc-400">
            <p>This is a computer-generated payslip.</p>
            <p>No signature required.</p>
          </div>
          <div className="text-right text-xs text-zinc-400">
            <div className="h-10 border-b border-zinc-400 w-40 mb-1" />
            <p>Authorised Signatory</p>
          </div>
        </div>

      </div>
    </div>
  );
}
