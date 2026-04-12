'use client';

import { useRouter } from 'next/navigation';
import { Download } from 'lucide-react';

const FY_OPTIONS = [
  { value: '2026-27', label: 'FY 2026-27' },
  { value: '2025-26', label: 'FY 2025-26' },
];

export default function FYSelector({ current }: { current: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <select
        value={current}
        onChange={e => router.push(`/d/pl?fy=${e.target.value}`)}
        className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition-colors"
      >
        {FY_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <a
        href={`/api/accounts/pl/export?fy=${current}`}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-600 transition-colors"
      >
        <Download className="h-3.5 w-3.5" /> CSV
      </a>
    </div>
  );
}
