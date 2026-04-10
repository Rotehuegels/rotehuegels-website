'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileDown, Download } from 'lucide-react';

const FY_OPTIONS = [
  { value: '2026-27', label: 'FY 2026-27 (Apr 2026 – Mar 2027)' },
  { value: '2025-26', label: 'FY 2025-26 (Apr 2025 – Mar 2026)' },
];

export default function FYSelector({ current }: { current: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        value={current}
        onChange={e => router.push(`/dashboard/accounts/pl?fy=${e.target.value}`)}
        className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors"
      >
        {FY_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <Link
        href={`/dashboard/accounts/pl/preview?fy=${current}`}
        className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-amber-600 hover:text-amber-400 transition-colors print:hidden"
      >
        <FileDown className="h-4 w-4" /> Print / Save PDF
      </Link>
      <a
        href={`/api/accounts/pl/export?fy=${current}`}
        className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-600 transition-colors print:hidden"
      >
        <Download className="h-4 w-4" /> CSV
      </a>
    </div>
  );
}
