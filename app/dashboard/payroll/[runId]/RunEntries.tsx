'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Check, X, Loader2 } from 'lucide-react';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

interface Employee { id: string; role: string; department: string | null; rex_members: { full_name: string; bank_account: string | null; bank_ifsc: string | null } | null; }
interface Entry {
  id: string; employee_id: string; basic: number; hra: number;
  special_allowance: number; other_allowance: number; bonus: number;
  working_days: number; days_present: number; lop_days: number;
  gross_pay: number; lop_deduction: number;
  epf_employee: number; esi_employee: number; professional_tax: number;
  tds: number; advance_recovery: number; other_deductions: number;
  total_deductions: number; net_pay: number; payment_status: string;
}

interface Props {
  runId: string;
  month: number;
  year: number;
  status: string;
  entries: Entry[];
  employees: Employee[];
}

function num(v: string) { return isNaN(parseFloat(v)) ? 0 : parseFloat(v); }

export default function RunEntries({ runId, month, year, status, entries, employees }: Props) {
  const router     = useRouter();
  const [pending, startTransition] = useTransition();
  const [editId, setEditId]     = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [processing, setProc]   = useState(false);
  const [error, setError]       = useState('');

  // Edit state per entry
  const [draft, setDraft] = useState<Record<string, string>>({});

  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));

  function startEdit(entry: Entry) {
    setEditId(entry.id);
    setDraft({
      bonus:            String(entry.bonus),
      lop_days:         String(entry.lop_days),
      days_present:     String(entry.days_present),
      working_days:     String(entry.working_days),
      tds:              String(entry.tds),
      advance_recovery: String(entry.advance_recovery),
      other_deductions: String(entry.other_deductions),
    });
  }

  async function saveEdit(entryId: string) {
    setSaving(true);
    setError('');
    const res = await fetch(`/api/payroll/runs/${runId}/entries/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bonus:            num(draft.bonus),
        lop_days:         num(draft.lop_days),
        days_present:     num(draft.days_present),
        working_days:     num(draft.working_days),
        tds:              num(draft.tds),
        advance_recovery: num(draft.advance_recovery),
        other_deductions: num(draft.other_deductions),
      }),
    });
    setSaving(false);
    if (!res.ok) { const j = await res.json(); setError(j.error ?? 'Save failed'); return; }
    setEditId(null);
    startTransition(() => router.refresh());
  }

  async function processRun() {
    if (!confirm('Process this payroll run? Entries will be locked.')) return;
    setProc(true);
    setError('');
    const res = await fetch(`/api/payroll/runs/${runId}/process`, { method: 'POST' });
    setProc(false);
    if (!res.ok) { const j = await res.json(); setError(j.error ?? 'Failed'); return; }
    startTransition(() => router.refresh());
  }

  async function markPaid() {
    if (!confirm('Mark this payroll as paid?')) return;
    setProc(true);
    const res = await fetch(`/api/payroll/runs/${runId}/process`, { method: 'PUT' });
    setProc(false);
    if (!res.ok) { const j = await res.json(); setError(j.error ?? 'Failed'); return; }
    startTransition(() => router.refresh());
  }

  const isDraft = status === 'draft';

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2 text-sm text-rose-400">{error}</div>
      )}

      {/* Action bar */}
      {isDraft && (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={processRun}
            disabled={processing || pending}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Process Payroll
          </button>
        </div>
      )}
      {status === 'processed' && (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={markPaid}
            disabled={processing || pending}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Mark as Paid
          </button>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider">
              <th className="px-4 py-2 text-left">Employee</th>
              <th className="px-3 py-2 text-right">Days</th>
              <th className="px-3 py-2 text-right">LOP</th>
              <th className="px-3 py-2 text-right">Basic</th>
              <th className="px-3 py-2 text-right">HRA</th>
              <th className="px-3 py-2 text-right">Spec. Allow</th>
              <th className="px-3 py-2 text-right">Bonus</th>
              <th className="px-3 py-2 text-right">Gross</th>
              <th className="px-3 py-2 text-right">Deductions</th>
              <th className="px-3 py-2 text-right">Net Pay</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {entries.map((entry) => {
              const emp     = empMap[entry.employee_id];
              const editing = editId === entry.id;
              return (
                <tr key={entry.id} className={`transition-colors ${editing ? 'bg-zinc-800/40' : 'hover:bg-zinc-800/20'}`}>
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-white">{emp?.rex_members?.full_name ?? '—'}</p>
                    <p className="text-zinc-500 truncate max-w-[140px]">{emp?.role}</p>
                  </td>

                  {/* Days present */}
                  <td className="px-3 py-2.5 text-right">
                    {editing ? (
                      <input type="number" min="0" max="31" step="0.5"
                        value={draft.days_present}
                        onChange={(e) => setDraft({ ...draft, days_present: e.target.value })}
                        className="w-12 rounded bg-zinc-700 px-1.5 py-1 text-right text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    ) : <span className="text-zinc-300">{entry.days_present}/{entry.working_days}</span>}
                  </td>

                  {/* LOP days */}
                  <td className="px-3 py-2.5 text-right">
                    {editing ? (
                      <input type="number" min="0" max="31" step="0.5"
                        value={draft.lop_days}
                        onChange={(e) => setDraft({ ...draft, lop_days: e.target.value })}
                        className="w-12 rounded bg-zinc-700 px-1.5 py-1 text-right text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    ) : (
                      <span className={entry.lop_days > 0 ? 'text-rose-400' : 'text-zinc-600'}>
                        {entry.lop_days > 0 ? entry.lop_days : '—'}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2.5 text-right text-zinc-300 font-mono">{fmt(entry.basic)}</td>
                  <td className="px-3 py-2.5 text-right text-zinc-400 font-mono">{fmt(entry.hra)}</td>
                  <td className="px-3 py-2.5 text-right text-zinc-400 font-mono">{fmt(entry.special_allowance)}</td>

                  {/* Bonus */}
                  <td className="px-3 py-2.5 text-right">
                    {editing ? (
                      <input type="number" min="0" step="100"
                        value={draft.bonus}
                        onChange={(e) => setDraft({ ...draft, bonus: e.target.value })}
                        className="w-20 rounded bg-zinc-700 px-1.5 py-1 text-right text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    ) : (
                      <span className={entry.bonus > 0 ? 'text-sky-400 font-mono' : 'text-zinc-600'}>
                        {entry.bonus > 0 ? fmt(entry.bonus) : '—'}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2.5 text-right font-semibold text-white font-mono">{fmt(entry.gross_pay)}</td>

                  {/* Deductions — show breakdown on hover via title */}
                  <td className="px-3 py-2.5 text-right" title={
                    `EPF: ${fmt(entry.epf_employee)}\nESI: ${fmt(entry.esi_employee)}\nPT: ${fmt(entry.professional_tax)}\nTDS: ${fmt(entry.tds)}\nAdv: ${fmt(entry.advance_recovery)}\nOther: ${fmt(entry.other_deductions)}`
                  }>
                    {editing ? (
                      <div className="flex flex-col gap-1 items-end">
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-500">TDS</span>
                          <input type="number" min="0" step="100"
                            value={draft.tds}
                            onChange={(e) => setDraft({ ...draft, tds: e.target.value })}
                            className="w-20 rounded bg-zinc-700 px-1.5 py-1 text-right text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-500">Adv</span>
                          <input type="number" min="0" step="100"
                            value={draft.advance_recovery}
                            onChange={(e) => setDraft({ ...draft, advance_recovery: e.target.value })}
                            className="w-20 rounded bg-zinc-700 px-1.5 py-1 text-right text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-rose-400 font-mono cursor-help">{fmt(entry.total_deductions)}</span>
                    )}
                  </td>

                  <td className="px-3 py-2.5 text-right font-bold text-emerald-400 font-mono">{fmt(entry.net_pay)}</td>

                  {/* Actions */}
                  <td className="px-4 py-2.5 text-center">
                    {isDraft ? (
                      editing ? (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => saveEdit(entry.id)} disabled={saving}
                            className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-1 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50">
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                            Save
                          </button>
                          <button onClick={() => setEditId(null)}
                            className="flex items-center gap-1 rounded-lg bg-zinc-700/50 px-2 py-1 text-zinc-400 hover:bg-zinc-700 transition-colors">
                            <X className="h-3 w-3" /> Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(entry)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-700 hover:text-white transition-colors mx-auto">
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                      )
                    ) : (
                      <Link href={`/d/payroll/${runId}/${entry.employee_id}/payslip`}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors">
                        Payslip
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {entries.map((entry) => {
          const emp = empMap[entry.employee_id];
          return (
            <div key={entry.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white">{emp?.rex_members?.full_name ?? '—'}</p>
                  <p className="text-xs text-zinc-500">{emp?.role}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  entry.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700 text-zinc-400'
                }`}>
                  {entry.payment_status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><p className="text-zinc-500">Gross</p><p className="text-white font-mono">{fmt(entry.gross_pay)}</p></div>
                <div><p className="text-zinc-500">Deductions</p><p className="text-rose-400 font-mono">{fmt(entry.total_deductions)}</p></div>
                <div><p className="text-zinc-500">Net Pay</p><p className="text-emerald-400 font-mono font-bold">{fmt(entry.net_pay)}</p></div>
              </div>
              {status !== 'draft' && (
                <Link href={`/d/payroll/${runId}/${entry.employee_id}/payslip`}
                  className="block text-center rounded-lg border border-indigo-500/30 py-1.5 text-xs text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                  View Payslip →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
