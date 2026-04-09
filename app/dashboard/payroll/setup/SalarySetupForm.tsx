'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Check, X, Loader2 } from 'lucide-react';

interface Employee {
  id: string; role: string; department: string | null;
  basic_salary: number | null; allowance: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rex_members: any;
}
interface Structure {
  employee_id: string; basic: number; hra: number;
  special_allowance: number; other_allowance: number;
  epf_enabled: boolean; esi_enabled: boolean; pt_enabled: boolean;
}

interface Props { employees: Employee[]; structures: Structure[]; }

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function SalarySetupForm({ employees, structures }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const structMap = Object.fromEntries(structures.map((s) => [s.employee_id, s]));

  const [draft, setDraft] = useState<Record<string, string | boolean>>({});

  function startEdit(emp: Employee) {
    const s = structMap[emp.id];
    setEditId(emp.id);
    setDraft({
      basic:            String(s?.basic            ?? emp.basic_salary ?? 0),
      hra:              String(s?.hra              ?? Math.round((emp.basic_salary ?? 0) * 0.4)),
      special_allowance:String(s?.special_allowance?? emp.allowance ?? 0),
      other_allowance:  String(s?.other_allowance  ?? 0),
      epf_enabled:      s?.epf_enabled ?? false,
      esi_enabled:      s?.esi_enabled ?? false,
      pt_enabled:       s?.pt_enabled  ?? true,
    });
  }

  async function save(empId: string) {
    setSaving(true);
    setError('');
    const res = await fetch('/api/payroll/salary-structures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id:       empId,
        basic:             parseFloat(String(draft.basic)) || 0,
        hra:               parseFloat(String(draft.hra)) || 0,
        special_allowance: parseFloat(String(draft.special_allowance)) || 0,
        other_allowance:   parseFloat(String(draft.other_allowance)) || 0,
        epf_enabled:       draft.epf_enabled,
        esi_enabled:       draft.esi_enabled,
        pt_enabled:        draft.pt_enabled,
      }),
    });
    setSaving(false);
    if (!res.ok) { const j = await res.json(); setError(j.error ?? 'Save failed'); return; }
    setEditId(null);
    startTransition(() => router.refresh());
  }

  const gross = (empId: string) => {
    if (editId === empId) {
      return ['basic','hra','special_allowance','other_allowance']
        .reduce((s, k) => s + (parseFloat(String(draft[k])) || 0), 0);
    }
    const s = structMap[empId];
    if (s) return s.basic + s.hra + s.special_allowance + s.other_allowance;
    const emp = employees.find(e => e.id === empId);
    return (emp?.basic_salary ?? 0) + (emp?.allowance ?? 0);
  };

  return (
    <div className="space-y-4">
      {error && <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2 text-sm text-rose-400">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider">
              <th className="px-4 py-2 text-left">Employee</th>
              <th className="px-3 py-2 text-right">Basic</th>
              <th className="px-3 py-2 text-right">HRA</th>
              <th className="px-3 py-2 text-right">Special Allow</th>
              <th className="px-3 py-2 text-right">Other Allow</th>
              <th className="px-3 py-2 text-right">Gross CTC</th>
              <th className="px-3 py-2 text-center">EPF</th>
              <th className="px-3 py-2 text-center">ESI</th>
              <th className="px-3 py-2 text-center">PT</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {employees.map((emp) => {
              const s       = structMap[emp.id];
              const editing = editId === emp.id;
              const hasSetup = !!s;

              return (
                <tr key={emp.id} className={`transition-colors ${editing ? 'bg-zinc-800/40' : 'hover:bg-zinc-800/20'}`}>
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-white">{emp.rex_members?.full_name ?? '—'}</p>
                    <p className="text-zinc-500 truncate max-w-[120px]">{emp.role}</p>
                    {!hasSetup && <span className="text-amber-400 text-xs">⚠ Not configured</span>}
                  </td>

                  {(['basic','hra','special_allowance','other_allowance'] as const).map((field) => {
                    const val = editing
                      ? String(draft[field])
                      : String(s?.[field] ?? (field === 'basic' ? emp.basic_salary ?? 0 : field === 'special_allowance' ? emp.allowance ?? 0 : 0));
                    return (
                      <td key={field} className="px-3 py-2.5 text-right">
                        {editing ? (
                          <input type="number" min="0" step="100"
                            value={String(draft[field])}
                            onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
                            className="w-20 rounded bg-zinc-700 px-1.5 py-1 text-right text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : <span className="text-zinc-300 font-mono">{fmt(parseFloat(val) || 0)}</span>}
                      </td>
                    );
                  })}

                  <td className="px-3 py-2.5 text-right font-semibold text-white font-mono">{fmt(gross(emp.id))}</td>

                  {(['epf_enabled','esi_enabled','pt_enabled'] as const).map((flag) => {
                    const val = editing ? Boolean(draft[flag]) : (s?.[flag] ?? (flag === 'pt_enabled'));
                    return (
                      <td key={flag} className="px-3 py-2.5 text-center">
                        {editing ? (
                          <input type="checkbox" checked={Boolean(draft[flag])}
                            onChange={(e) => setDraft({ ...draft, [flag]: e.target.checked })}
                            className="accent-indigo-500 h-4 w-4 cursor-pointer"
                          />
                        ) : (
                          <span className={val ? 'text-emerald-400' : 'text-zinc-700'}>
                            {val ? '✓' : '—'}
                          </span>
                        )}
                      </td>
                    );
                  })}

                  <td className="px-4 py-2.5 text-center">
                    {editing ? (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => save(emp.id)} disabled={saving}
                          className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-1 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50">
                          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                        </button>
                        <button onClick={() => setEditId(null)}
                          className="flex items-center gap-1 rounded-lg bg-zinc-700/50 px-2 py-1 text-zinc-400 hover:bg-zinc-700 transition-colors">
                          <X className="h-3 w-3" /> Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(emp)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-700 hover:text-white transition-colors mx-auto">
                        <Pencil className="h-3 w-3" /> {hasSetup ? 'Edit' : 'Setup'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
