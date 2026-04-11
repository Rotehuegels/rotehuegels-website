'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function PriceRefresher({ lastUpdated }: { lastUpdated: string | null }) {
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Auto-refresh prices on mount (background, non-blocking)
  useEffect(() => {
    const age = lastUpdated ? (Date.now() - new Date(lastUpdated).getTime()) / 1000 : Infinity;
    // Only auto-refresh if prices are older than 5 minutes
    if (age > 300) {
      refreshPrices(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshPrices(silent = false) {
    if (refreshing) return;
    setRefreshing(true);
    if (!silent) setStatus('Fetching latest prices...');

    try {
      const res = await fetch('/api/investments/refresh-prices');
      const data = await res.json();
      if (res.ok) {
        setStatus(`Updated ${data.fetched}/${data.total} prices`);
        // Reload page after 1.5s to show new prices
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setStatus('Failed to refresh');
      }
    } catch {
      if (!silent) setStatus('Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }

  const timeAgo = lastUpdated
    ? (() => {
        const secs = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000);
        if (secs < 60) return `${secs}s ago`;
        if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
        return `${Math.floor(secs / 3600)}h ago`;
      })()
    : 'never';

  return (
    <div className="flex items-center gap-2">
      {status && (
        <span className="text-[10px] text-amber-400 animate-pulse">{status}</span>
      )}
      <button
        onClick={() => refreshPrices(false)}
        disabled={refreshing}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 disabled:opacity-50 transition-colors"
        title="Refresh prices"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Updated {timeAgo}</span>
      </button>
    </div>
  );
}
