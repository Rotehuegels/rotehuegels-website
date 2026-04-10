'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Search } from 'lucide-react';

const input = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';

const STATUSES = ['all', 'active', 'inactive', 'terminated', 'completed'] as const;
const STATUS_LABELS: Record<string, string> = {
  all: 'All Statuses',
  active: 'Active',
  inactive: 'Inactive',
  terminated: 'Terminated',
  completed: 'Completed',
};

const TYPES = ['all', 'full_time', 'rex_network', 'board_member'] as const;
const TYPE_LABELS: Record<string, string> = {
  all: 'All Types',
  full_time: 'Full-time',
  rex_network: 'REX Network',
  board_member: 'Board Member',
};

export default function EmployeesFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? 'all';
  const type = searchParams.get('type') ?? 'all';

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/hr/employees?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
        <input
          type="text"
          placeholder="Search by name, engagement ID, department..."
          defaultValue={q}
          onKeyDown={e => { if (e.key === 'Enter') update('q', (e.target as HTMLInputElement).value); }}
          onBlur={e => update('q', e.target.value)}
          className={`${input} pl-10`}
        />
      </div>
      <select
        value={status}
        onChange={e => update('status', e.target.value)}
        className={`${input} w-auto min-w-[150px]`}
      >
        {STATUSES.map(s => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>
      <select
        value={type}
        onChange={e => update('type', e.target.value)}
        className={`${input} w-auto min-w-[150px]`}
      >
        {TYPES.map(t => (
          <option key={t} value={t}>{TYPE_LABELS[t]}</option>
        ))}
      </select>
    </div>
  );
}
