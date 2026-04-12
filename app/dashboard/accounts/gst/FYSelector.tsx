'use client';

import { useRouter } from 'next/navigation';

const FY_OPTIONS = [
  { value: '2026-27', label: 'FY 2026-27 (Apr 2026 – Mar 2027)' },
  { value: '2025-26', label: 'FY 2025-26 (Apr 2025 – Mar 2026)' },
];

export default function FYSelector({ current }: { current: string }) {
  const router = useRouter();

  return (
    <select
      value={current}
      onChange={e => router.push(`/d/gst?fy=${e.target.value}`)}
      className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors"
    >
      {FY_OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
