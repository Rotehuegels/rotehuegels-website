'use client';

import { useRouter } from 'next/navigation';
import { Printer } from 'lucide-react';

const FY_OPTIONS = [
  { value: '2025-26', label: 'FY 2025-26 (Apr 2025 – Mar 2026)' },
  { value: '2024-25', label: 'FY 2024-25 (Apr 2024 – Mar 2025)' },
  { value: '2023-24', label: 'FY 2023-24 (Apr 2023 – Mar 2024)' },
];

export default function FYSelector({ current }: { current: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        value={current}
        onChange={e => router.push(`/dashboard/accounts/gst?fy=${e.target.value}`)}
        className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors"
      >
        {FY_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-amber-600 hover:text-amber-400 transition-colors print:hidden"
      >
        <Printer className="h-4 w-4" /> Print / Save PDF
      </button>
    </div>
  );
}
