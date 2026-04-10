'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import { Search } from 'lucide-react';

const ENTITY_TYPES = [
  { value: '', label: 'All Entities' },
  { value: 'order', label: 'Order' },
  { value: 'quote', label: 'Quote' },
  { value: 'customer', label: 'Customer' },
  { value: 'expense', label: 'Expense' },
  { value: 'employee', label: 'Employee' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'purchase_order', label: 'Purchase Order' },
];

const ACTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'status_change', label: 'Status Change' },
  { value: 'login', label: 'Login' },
  { value: 'export', label: 'Export' },
];

const selectCls =
  'rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none';

export default function AuditFilters({
  currentEntityType,
  currentAction,
  currentSearch,
}: {
  currentEntityType: string;
  currentAction: string;
  currentSearch: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch);

  const navigate = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(overrides)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      router.push(`/dashboard/audit?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={currentEntityType}
        onChange={(e) => navigate({ entity_type: e.target.value })}
        className={selectCls}
      >
        {ENTITY_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      <select
        value={currentAction}
        onChange={(e) => navigate({ action: e.target.value })}
        className={selectCls}
      >
        {ACTIONS.map((a) => (
          <option key={a.value} value={a.value}>{a.label}</option>
        ))}
      </select>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ q: search });
        }}
        className="flex items-center gap-2"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search entity label..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-800 pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none w-56"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Search
        </button>
      </form>
    </div>
  );
}
