'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Search } from 'lucide-react';

const input = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';

const STATUSES = ['all', 'Active', 'Cancelled', 'Not Registered'] as const;

export default function SuppliersFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? 'all';

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/accounts/suppliers?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
        <input
          type="text"
          placeholder="Search by name, GSTIN, vendor code..."
          defaultValue={q}
          onKeyDown={e => { if (e.key === 'Enter') update('q', (e.target as HTMLInputElement).value); }}
          onBlur={e => update('q', e.target.value)}
          className={`${input} pl-10`}
        />
      </div>
      <select
        value={status}
        onChange={e => update('status', e.target.value)}
        className={`${input} w-auto min-w-[160px]`}
      >
        {STATUSES.map(s => (
          <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>
        ))}
      </select>
    </div>
  );
}
