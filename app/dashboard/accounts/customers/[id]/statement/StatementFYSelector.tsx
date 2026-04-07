'use client';

import { useRouter } from 'next/navigation';

const FY_OPTIONS = [
  { value: 'all',     label: 'All Years' },
  { value: '2026-27', label: 'FY 2026-27' },
  { value: '2025-26', label: 'FY 2025-26' },
];

export default function StatementFYSelector({ customerId, current }: { customerId: string; current: string }) {
  const router = useRouter();

  return (
    <select
      value={current}
      onChange={e => router.push(`/dashboard/accounts/customers/${customerId}/statement?fy=${e.target.value}`)}
      className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors"
    >
      {FY_OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
