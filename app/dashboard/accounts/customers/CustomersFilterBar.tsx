'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Search } from 'lucide-react';

const input = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors';

export default function CustomersFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';

  const update = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    params.delete('page');
    router.push(`/dashboard/accounts/customers?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
      <input
        type="text"
        placeholder="Search by name, customer ID, GSTIN, email..."
        defaultValue={q}
        onKeyDown={e => { if (e.key === 'Enter') update((e.target as HTMLInputElement).value); }}
        onBlur={e => update(e.target.value)}
        className={`${input} pl-10 max-w-md`}
      />
    </div>
  );
}
