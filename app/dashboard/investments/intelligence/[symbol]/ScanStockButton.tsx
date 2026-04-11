'use client';

import { useState } from 'react';
import { Radar, Loader2, CheckCircle } from 'lucide-react';

export default function ScanStockButton({ symbol }: { symbol: string }) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ signals: number } | null>(null);
  const [error, setError] = useState('');

  async function scan() {
    if (scanning) return;
    setScanning(true);
    setError('');

    try {
      const res = await fetch('/api/investments/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Scan failed');
      setResult({ signals: data.totalSignals });
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  }

  if (result) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
        <CheckCircle className="h-3.5 w-3.5" /> {result.signals} signals found. Refreshing...
      </span>
    );
  }

  return (
    <div>
      <button onClick={scan} disabled={scanning}
        className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-amber-500 hover:text-amber-400 disabled:opacity-50 transition-colors">
        {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radar className="h-3.5 w-3.5" />}
        {scanning ? 'Scanning...' : 'AI Scan'}
      </button>
      {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}
