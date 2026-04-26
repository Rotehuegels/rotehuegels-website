'use client';

import useSWR from 'swr';
import { useMemo } from 'react';

type Quote = {
  label: string;
  price: number | null;   // metals: USD/t ; gold: USD/oz
  change?: number | null;
  ok: boolean;
  error?: string;
};
type ApiResponse = { data: Quote[] };

const fetcher = (url: string) => fetch(url).then(r => r.json() as Promise<ApiResponse>);

export default function TickerBar() {
  const { data, error, isLoading } = useSWR('/api/market', fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  });

  const all: Quote[] = useMemo(() => {
    if (isLoading && !data?.data?.length) return [{ label: 'Loading…', price: null, ok: true }];
    if (error) return [{ label: 'Market feed', price: null, ok: false, error: 'Fetch error' }];
    return data?.data ?? [];
  }, [data, error, isLoading]);

  // Helper to pick items whose label contains any keyword (case-insensitive), in the given order.
  const pickByOrder = (order: string[]): Quote[] => {
    const lc = (s: string) => s.toLowerCase();
    const pool = [...all];
    const out: Quote[] = [];
    for (const key of order) {
      for (let i = 0; i < pool.length; i++) {
        if (lc(pool[i].label).includes(lc(key))) {
          out.push(pool[i]);
          pool.splice(i, 1);
          i--;
        }
      }
    }
    return out;
  };

  // Desired groupings (order within each group matters).
  // Top row — precious metals (USD/oz) + Cu / Al (USD/t)
  const topOrder = [
    'gold (usd/oz)',
    'silver (usd/oz)',
    'platinum (usd/oz)',
    'palladium (usd/oz)',
    'lme copper (cash)',
    'lme copper (3m)',
    'aluminium (cash)',
    'aluminium (3m)',
    'nasaac alloy (cash)',
  ];
  // Bottom row — base / battery metals (USD/t)
  const bottomOrder = [
    'zinc (cash)', 'zinc (3m)',
    'nickel (cash)', 'nickel (3m)',
    'lead (cash)', 'lead (3m)',
    'tin (cash)', 'tin (3m)',
    'cobalt (cash)',
  ];

  // Build rows
  const rowTop = pickByOrder(topOrder);
  const rowBottom = pickByOrder(bottomOrder);

  // Fallbacks: if something is missing, place remaining items sensibly
  const pickedLabels = new Set([...rowTop, ...rowBottom].map(q => q.label));
  const leftovers = all.filter(q => !pickedLabels.has(q.label));
  if (leftovers.length) {
    // Put leftovers at the end of the bottom row so nothing is lost
    rowBottom.push(...leftovers);
  }

  // Duplicate each row for seamless marquee loops
  const loopTop = useMemo(() => [...rowTop, ...rowTop], [rowTop]);
  const loopBottom = useMemo(() => [...rowBottom, ...rowBottom], [rowBottom]);

  // Trim "(USD/oz)" / "(Cash)" / "(3M)" off the visible label — context comes from the unit suffix.
  const shortLabel = (s: string) =>
    s.replace(/\s*\(USD\/oz\)\s*/i, '')
     .replace(/\s*\(cash\)\s*/i, ' · cash')
     .replace(/\s*\(3m\)\s*/i, ' · 3M');

  const unitFor = (label: string) =>
    /usd\/oz/i.test(label) ? '$/oz' : '$/t';

  const Pill = ({ q, k }: { q: Quote; k: string }) => (
    <span
      key={k}
      className={[
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md',
        q.ok ? 'bg-zinc-800/80 text-zinc-100' : 'bg-zinc-900 text-zinc-400 border border-zinc-700',
      ].join(' ')}
      title={q.ok ? q.label : (q.error || q.label)}
    >
      <span className="font-medium">{shortLabel(q.label)}</span>
      {q.price !== null ? (
        <span className="tabular-nums">
          {q.price.toLocaleString()}
          <span className="ml-1 text-[9px] opacity-50">{unitFor(q.label)}</span>
        </span>
      ) : (
        <span className="opacity-70">N/A</span>
      )}
      {typeof q.change === 'number' && (
        <span className={`tabular-nums ${q.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {q.change >= 0 ? '+' : ''}
          {q.change.toFixed(2)}
        </span>
      )}
      {!q.ok && <span className="opacity-70">(offline)</span>}
    </span>
  );

  return (
    <div className="w-full border-b border-zinc-800/50 bg-black/20 backdrop-blur supports-[backdrop-filter]:bg-black/15 text-[11px] leading-none text-zinc-200">
      {/* Row 1: right -> left — precious metals + Cu + Al */}
      <div className="overflow-hidden">
        <div
          className="flex gap-3 whitespace-nowrap animate-[ticker-rtl_22s_linear_infinite] hover:[animation-play-state:paused] px-3 py-1.5"
          aria-live="polite"
          role="status"
        >
          {loopTop.map((q, i) => <Pill q={q} k={`${q.label}-top-${i}`} key={`${q.label}-top-${i}`} />)}
        </div>
      </div>

      {/* Row 2: left -> right — Zn / Ni / Pb / Sn (+ Co) */}
      <div className="overflow-hidden border-t border-zinc-800/50">
        <div
          className="flex gap-3 whitespace-nowrap animate-[ticker-ltr_22s_linear_infinite] hover:[animation-play-state:paused] px-3 py-1.5"
          aria-live="polite"
          role="status"
        >
          {loopBottom.map((q, i) => <Pill q={q} k={`${q.label}-bot-${i}`} key={`${q.label}-bot-${i}`} />)}
        </div>
      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes ticker-rtl {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes ticker-ltr {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          :global([class*="animate-[ticker"]) { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
