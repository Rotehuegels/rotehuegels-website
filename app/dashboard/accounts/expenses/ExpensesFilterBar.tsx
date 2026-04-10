'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Search, Download } from 'lucide-react';

const input = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';

const TYPES = ['all', 'salary', 'purchase', 'tds_paid', 'advance_tax', 'gst_paid', 'other'] as const;
const TYPE_LABELS: Record<string, string> = {
  all: 'All Types',
  salary: 'Salary',
  purchase: 'Purchase',
  tds_paid: 'TDS Paid',
  advance_tax: 'Advance Tax',
  gst_paid: 'GST Paid',
  other: 'Other',
};

export default function ExpensesFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const type = searchParams.get('type') ?? 'all';

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/dashboard/accounts/expenses?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
        <input
          type="text"
          placeholder="Search by description, vendor..."
          defaultValue={q}
          onKeyDown={e => { if (e.key === 'Enter') update('q', (e.target as HTMLInputElement).value); }}
          onBlur={e => update('q', e.target.value)}
          className={`${input} pl-10`}
        />
      </div>
      <select
        value={type}
        onChange={e => update('type', e.target.value)}
        className={`${input} w-auto min-w-[150px]`}
      >
        {TYPES.map(t => (
          <option key={t} value={t}>{TYPE_LABELS[t]}</option>
        ))}
      </select>
      <a
        href="/api/accounts/expenses/export"
        className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-600 transition-colors whitespace-nowrap"
      >
        <Download className="h-4 w-4" /> CSV
      </a>
    </div>
  );
}
