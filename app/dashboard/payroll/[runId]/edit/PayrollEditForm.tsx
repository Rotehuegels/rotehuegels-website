'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { computePayroll } from '@/lib/payroll';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

interface Entry {
  id: string;
  employee_id: string;
  basic: number;
  hra: number;
  special_allowance: number;
  other_allowance: number;
  bonus: number;
  working_days: number;
  days_present: number;
  lop_days: number;
  gross_pay: number;
  epf_employee: number;
  esi_employee: number;
  professional_tax: number;
  tds: number;
  advance_recovery: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  employees: any;
}

interface Props {
  runId: string;
  month: number;
  entries: Entry[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

type EditableField = 'basic' | 'hra' | 'special_allowance' | 'other_allowance' | 'bonus' | 'lop_days' | 'tds' | 'advance_recovery' | 'other_deductions';
const EDITABLE_FIELDS: { key: EditableField; label: string }[] = [
  { key: 'basic', label: 'Basic' },
  { key: 'hra', label: 'HRA' },
  { key: 'special_allowance', label: 'Spl Allow' },
  { key: 'other_allowance', label: 'Other' },
  { key: 'bonus', label: 'Bonus' },
  { key: 'lop_days', label: 'LOP' },
  { key: 'tds', label: 'TDS' },
  { key: 'advance_recovery', label: 'Adv Rec' },
  { key: 'other_deductions', label: 'Other Ded' },
];

type DraftRow = Record<EditableField, number>;

function buildDraft(entry: Entry): DraftRow {
  return {
    basic: entry.basic ?? 0,
    hra: entry.hra ?? 0,
    special_allowance: entry.special_allowance ?? 0,
    other_allowance: entry.other_allowance ?? 0,
    bonus: entry.bonus ?? 0,
    lop_days: entry.lop_days ?? 0,
    tds: entry.tds ?? 0,
    advance_recovery: entry.advance_recovery ?? 0,
    other_deductions: entry.other_deductions ?? 0,
  };
}

function computePreview(draft: DraftRow, month: number) {
  return computePayroll({
    ...draft,
    working_days: 26,
    days_present: 26 - draft.lop_days,
    epf_enabled: true,
    esi_enabled: false,
    pt_enabled: true,
    month,
  });
}

export default function PayrollEditForm({ runId, month, entries }: Props) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>(() => {
    const m: Record<string, DraftRow> = {};
    for (const e of entries) m[e.id] = buildDraft(e);
    return m;
  });
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [savingAll, setSavingAll] = useState(false);
  const [error, setError] = useState('');

  const updateField = useCallback((entryId: string, field: EditableField, value: number) => {
    setDrafts((prev) => ({
      ...prev,
      [entryId]: { ...prev[entryId], [field]: value },
    }));
    setDirty((prev) => new Set(prev).add(entryId));
  }, []);

  async function saveEntry(entryId: string) {
    const draft = drafts[entryId];
    if (!draft) return true;
    setSaving((prev) => new Set(prev).add(entryId));
    setError('');

    const res = await fetch(`/api/payroll/runs/${runId}/entries/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });

    setSaving((prev) => {
      const n = new Set(prev);
      n.delete(entryId);
      return n;
    });

    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? 'Save failed');
      return false;
    }

    setDirty((prev) => {
      const n = new Set(prev);
      n.delete(entryId);
      return n;
    });
    return true;
  }

  async function saveAll() {
    setSavingAll(true);
    setError('');
    const dirtyIds = [...dirty];
    let allOk = true;
    for (const id of dirtyIds) {
      const ok = await saveEntry(id);
      if (!ok) { allOk = false; break; }
    }
    setSavingAll(false);
    if (allOk) router.refresh();
  }

  // Compute live previews
  const previews: Record<string, ReturnType<typeof computePreview>> = {};
  for (const e of entries) {
    previews[e.id] = computePreview(drafts[e.id], month);
  }

  const totalGross = Object.values(previews).reduce((s, p) => s + p.gross_pay, 0);
  const totalDed = Object.values(previews).reduce((s, p) => s + p.total_deductions, 0);
  const totalNet = Object.values(previews).reduce((s, p) => s + p.net_pay, 0);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2 text-sm text-rose-400">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-zinc-500">Gross: <span className="text-white font-semibold font-mono">{fmt(totalGross)}</span></span>
          <span className="text-zinc-500">Deductions: <span className="text-rose-400 font-semibold font-mono">{fmt(totalDed)}</span></span>
          <span className="text-zinc-500">Net: <span className="text-emerald-400 font-semibold font-mono">{fmt(totalNet)}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/d/payroll/${runId}`}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </a>
          {dirty.size > 0 && (
            <button
              onClick={saveAll}
              disabled={savingAll}
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50 transition-colors"
            >
              {savingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save All ({dirty.size})
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Employee</th>
              {EDITABLE_FIELDS.map((f) => (
                <th key={f.key} className="px-2 py-3 text-right">{f.label}</th>
              ))}
              <th className="px-3 py-3 text-right">Gross</th>
              <th className="px-3 py-3 text-right">Ded</th>
              <th className="px-3 py-3 text-right">Net</th>
              <th className="px-3 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {entries.map((entry) => {
              const emp = entry.employees as { full_name: string; role: string } | null;
              const draft = drafts[entry.id];
              const preview = previews[entry.id];
              const isDirty = dirty.has(entry.id);
              const isSaving = saving.has(entry.id);

              return (
                <tr key={entry.id} className={`transition-colors ${isDirty ? 'bg-amber-500/5' : 'hover:bg-zinc-800/20'}`}>
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-white">{emp?.full_name ?? '—'}</p>
                    <p className="text-zinc-500">{emp?.role ?? ''}</p>
                  </td>
                  {EDITABLE_FIELDS.map((f) => (
                    <td key={f.key} className="px-2 py-2.5 text-right">
                      <input
                        type="number"
                        min="0"
                        step={f.key === 'lop_days' ? 0.5 : 100}
                        value={draft[f.key]}
                        onChange={(e) => updateField(entry.id, f.key, parseFloat(e.target.value) || 0)}
                        className="w-[5.5rem] rounded bg-zinc-800 border border-zinc-700 px-1.5 py-1 text-right text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-right text-white font-mono font-semibold">{fmt(preview.gross_pay)}</td>
                  <td className="px-3 py-2.5 text-right text-rose-400 font-mono">{fmt(preview.total_deductions)}</td>
                  <td className="px-3 py-2.5 text-right text-emerald-400 font-mono font-semibold">{fmt(preview.net_pay)}</td>
                  <td className="px-3 py-2.5 text-center">
                    {isDirty && (
                      <button
                        onClick={() => saveEntry(entry.id)}
                        disabled={isSaving}
                        className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-1 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 mx-auto text-xs"
                      >
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Save
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
