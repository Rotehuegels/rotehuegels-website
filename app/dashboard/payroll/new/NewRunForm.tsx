'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MONTH_NAMES } from '@/lib/payroll';
import { Loader2 } from 'lucide-react';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const YEARS  = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
const MONTHS = MONTH_NAMES.slice(1).map((name, i) => ({ value: i + 1, name }));

export default function NewRunForm({ activeCount }: { activeCount: number }) {
  const router = useRouter();
  const [month, setMonth]   = useState(currentMonth);
  const [year,  setYear]    = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/payroll/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, year }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (res.status === 409 && json.runId) {
        router.push(`/dashboard/payroll/${json.runId}`);
        return;
      }
      setError(json.error ?? 'Failed to create run.');
      return;
    }

    router.push(`/dashboard/payroll/${json.runId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-1.5">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-1.5">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-4 text-sm text-zinc-400">
        <p>This will create a draft payroll run for <span className="text-white font-medium">{MONTH_NAMES[month]} {year}</span> and auto-populate entries for all <span className="text-white font-medium">{activeCount} active employees</span> using their configured salary structures.</p>
        <p className="mt-2 text-xs text-zinc-500">You can edit LOP days, bonus, TDS and advance deductions before processing.</p>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Creating…' : 'Create Payroll Run'}
        </button>
        <a href="/dashboard/payroll" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}
