'use client';

import useSWR from 'swr';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

type INRQuote = {
  metal: string;
  unit: string;
  price: number | null;
  changeAbs: number | null;
  changePct: number | null;
  direction: 'up' | 'down' | null;
  asOf: string | null;
  source: string;
  ok: boolean;
  error?: string;
};

type ApiResponse = { data: INRQuote[]; fetchedAt: string };

const fetcher = (url: string) => fetch(url).then(r => r.json() as Promise<ApiResponse>);

const formatINR = (n: number) => new Intl.NumberFormat('en-IN').format(n);

export default function MarketINR() {
  const { data, error, isLoading, mutate, isValidating } = useSWR(
    '/api/market-inr',
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: false }
  );

  const quotes = data?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">MCX India · INR prices</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Source: MCX India (via 5paisa public quotes)
            {data?.fetchedAt && (
              <> · fetched {new Date(data.fetchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</>
            )}
          </p>
        </div>
        <button
          onClick={() => mutate()}
          disabled={isValidating}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          title="Refresh now"
        >
          <RefreshCw className={`h-3 w-3 ${isValidating ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-300">
          Failed to load INR feed: {String((error as any)?.message || 'unknown')}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {(isLoading && !quotes.length
          ? Array.from({ length: 7 }).map(() => null)
          : quotes
        ).map((q, i) => (
          <Card key={q?.metal ?? `skel-${i}`} q={q} />
        ))}
      </div>
    </div>
  );
}

function Card({ q }: { q: INRQuote | null }) {
  if (!q) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 animate-pulse">
        <div className="h-3 w-16 bg-zinc-800 rounded mb-2" />
        <div className="h-5 w-24 bg-zinc-800 rounded mb-1.5" />
        <div className="h-2.5 w-20 bg-zinc-800 rounded" />
      </div>
    );
  }

  const dir = q.direction;
  const tone =
    dir === 'up'   ? 'text-emerald-400' :
    dir === 'down' ? 'text-rose-400'    :
                     'text-zinc-400';
  const Icon =
    dir === 'up'   ? TrendingUp   :
    dir === 'down' ? TrendingDown :
                     Minus;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 hover:border-zinc-700 transition-colors">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wider text-zinc-400">{q.metal}</span>
        <span className="text-[9px] text-zinc-500">{q.unit}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[10px] text-zinc-500">₹</span>
        <span className="text-lg font-semibold tabular-nums text-zinc-100">
          {q.price !== null ? formatINR(q.price) : '—'}
        </span>
      </div>
      <div className={`mt-1 flex items-center gap-1 text-[11px] tabular-nums ${tone}`}>
        <Icon className="h-3 w-3" />
        {q.changeAbs !== null && q.changePct !== null ? (
          <span>
            {q.changeAbs >= 0 ? '+' : ''}{q.changeAbs.toFixed(2)}
            <span className="opacity-60 ml-1">({q.changePct >= 0 ? '+' : ''}{q.changePct.toFixed(2)}%)</span>
          </span>
        ) : (
          <span className="opacity-50">no change data</span>
        )}
      </div>
      {q.asOf && (
        <div className="mt-1.5 text-[9px] text-zinc-500 truncate" title={q.asOf}>
          as on {q.asOf}
        </div>
      )}
    </div>
  );
}
