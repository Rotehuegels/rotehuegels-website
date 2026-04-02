'use client';

import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const INTERVAL_MS = 60_000; // 60 seconds

export default function RefreshButton() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const refresh = useCallback(() => {
    setSpinning(true);
    router.refresh();
    setLastUpdated(new Date());
    setSecondsAgo(0);
    setTimeout(() => setSpinning(false), 1000);
  }, [router]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(refresh, INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  // Tick seconds counter
  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  return (
    <button
      onClick={refresh}
      className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
    >
      <RefreshCw className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`} />
      <span>
        {spinning ? 'Updating…' : `Updated ${secondsAgo}s ago`}
      </span>
    </button>
  );
}
