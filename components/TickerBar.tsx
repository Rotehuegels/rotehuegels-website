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

  // Desired groupings (order within each group matters)
  const topOrder = [
    'gold',                 // Gold (USD/oz)
    'lme copper (cash)',
    'lme copper (3m)',
    'aluminium (cash)',
    'aluminium (3m)',
  ];
  const bottomOrder = [
    'zinc (cash)', 'zinc (3m)',
    'nickel (cash)', 'nickel (3m)',
    'lead (cash)', 'lead (3m)',
    'tin (cash)', 'tin (3m)',
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

  const Pill = ({ q, k }: { q: Quote; k: string }) => (
    <span
      key={k}
      className={[
        'inline-flex items-center gap-2 px-3 py-1 rounded-xl',
        q.ok ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-900 text-zinc-400 border border-zinc-700',
      ].join(' ')}
      title={q.ok ? q.label : (q.error || q.label)}
    >
      <span className="font-medium">{q.label}</span>
      <span>•</span>
      {q.price !== null ? (
        <span>
          {q.price.toLocaleString()} {q.label.toLowerCase().includes('gold') ? 'USD/oz' : 'USD/t'}
        </span>
      ) : (
        <span className="opacity-70">N/A</span>
      )}
      {typeof q.change === 'number' && (
        <span className={q.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
          {q.change >= 0 ? '+' : ''}
          {q.change.toFixed(2)}
        </span>
      )}
      {!q.ok && <span className="opacity-70">(source offline)</span>}
    </span>
  );

  return (
    <div className="w-full border-b border-zinc-800 bg-black/60 backdrop-blur supports-[backdrop-filter]:bg-black/40">
      {/* Row 1: right -> left (Gold + LME Copper + Aluminium) */}
      <div className="overflow-hidden">
        <div
          className="flex gap-6 whitespace-nowrap animate-[ticker-rtl_36s_linear_infinite] hover:[animation-play-state:paused] px-3 py-2"
          aria-live="polite"
          role="status"
        >
          {loopTop.map((q, i) => <Pill q={q} k={`${q.label}-top-${i}`} key={`${q.label}-top-${i}`} />)}
        </div>
      </div>

      {/* Row 2: left -> right (Zinc + Nickel + Lead + Tin) */}
      <div className="overflow-hidden border-t border-zinc-800/50">
        <div
          className="flex gap-6 whitespace-nowrap animate-[ticker-ltr_36s_linear_infinite] hover:[animation-play-state:paused] px-3 py-2"
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
