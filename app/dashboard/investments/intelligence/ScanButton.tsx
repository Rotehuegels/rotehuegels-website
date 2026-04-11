'use client';

import { useState } from 'react';
import { Radar, Loader2, CheckCircle } from 'lucide-react';

export default function ScanButton() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ stocksScanned: number; totalSignals: number } | null>(null);
  const [error, setError] = useState('');

  async function scanAll() {
    if (scanning) return;
    setScanning(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/investments/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Scan failed');
      setResult({ stocksScanned: data.stocksScanned, totalSignals: data.totalSignals });
      // Reload page after 3 seconds to show new signals
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  }

  return (
    <div>
      <button
        onClick={scanAll}
        disabled={scanning}
        className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors"
      >
        {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
        {scanning ? 'Scanning all stocks...' : 'Scan All Stocks'}
      </button>

      {scanning && (
        <p className="text-xs text-amber-400 mt-2 animate-pulse">
          Analyzing 24 stocks with Groq 70B... This takes 2-3 minutes.
        </p>
      )}

      {result && (
        <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400">
          <CheckCircle className="h-3.5 w-3.5" />
          Scanned {result.stocksScanned} stocks, found {result.totalSignals} signals. Refreshing...
        </div>
      )}

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
