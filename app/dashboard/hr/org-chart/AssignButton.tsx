'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, X, Loader2 } from 'lucide-react';

type Employee = {
  id: string;
  full_name: string;
  email: string | null;
  department: string | null;
};

export default function AssignButton({
  positionId, currentEmployeeId, employees,
}: {
  positionId: string;
  currentEmployeeId: string | null;
  employees: Employee[];
}) {
  const router = useRouter();
  const [open, setOpen]     = useState(false);
  const [picked, setPicked] = useState<string>(currentEmployeeId ?? '');
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState('');
  const [filter, setFilter] = useState('');

  async function save(employee_id: string | null) {
    setBusy(true); setErr('');
    const res = await fetch(`/api/positions/${positionId}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : JSON.stringify(json.error)); return; }
    setOpen(false);
    router.refresh();
  }

  const matches = filter
    ? employees.filter((e) => (e.full_name + ' ' + (e.email ?? '') + ' ' + (e.department ?? '')).toLowerCase().includes(filter.toLowerCase()))
    : employees;

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-md border border-zinc-700 hover:border-zinc-500 px-2 py-0.5 text-[10px] text-zinc-400 hover:text-white">
        <UserPlus className="h-3 w-3" />
        {currentEmployeeId ? 'Change' : 'Assign'}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Assign employee to {positionId}</h3>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              autoFocus
              placeholder="Search by name, email, department…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 mb-3"
            />

            <div className="max-h-72 overflow-y-auto rounded-lg border border-zinc-800 divide-y divide-zinc-800/60">
              {matches.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-zinc-600">
                  {employees.length === 0
                    ? 'No active employees yet. Add some via /d/hr/employees first.'
                    : 'No matches.'}
                </p>
              )}
              {matches.map((e) => (
                <button key={e.id} onClick={() => setPicked(e.id)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${picked === e.id ? 'bg-rose-500/10' : 'hover:bg-zinc-900'}`}>
                  <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-400 shrink-0">
                    {e.full_name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{e.full_name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{e.email ?? '—'}{e.department ? ' · ' + e.department : ''}</p>
                  </div>
                  {picked === e.id && <span className="text-rose-400 text-xs">✓</span>}
                </button>
              ))}
            </div>

            {err && <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{err}</div>}

            <div className="mt-4 flex gap-2 justify-end">
              {currentEmployeeId && (
                <button onClick={() => save(null)} disabled={busy}
                  className="rounded-lg border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 text-xs text-zinc-400 disabled:opacity-50">
                  Vacate
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-500">
                Cancel
              </button>
              <button onClick={() => save(picked || null)} disabled={busy || !picked}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                {busy && <Loader2 className="h-3 w-3 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
