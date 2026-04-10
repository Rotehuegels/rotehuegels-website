'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function TriggerCrawl() {
  const [loading, setLoading] = useState<'supplier' | 'customer' | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function trigger(type: 'supplier' | 'customer') {
    setLoading(type);
    setResult(null);
    try {
      const res = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.error) {
        setResult(`Error: ${data.error}`);
      } else {
        setResult(`Found ${data.resultsCount} new ${type} leads`);
        // Reload to show new data
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      setResult('Failed to trigger crawl');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className="text-sm text-zinc-400">{result}</span>
      )}
      <button
        onClick={() => trigger('supplier')}
        disabled={loading !== null}
        className="flex items-center gap-2 rounded-xl bg-orange-500/20 px-4 py-2 text-sm font-medium text-orange-400 hover:bg-orange-500/30 transition-colors disabled:opacity-50"
      >
        {loading === 'supplier' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        Find Suppliers
      </button>
      <button
        onClick={() => trigger('customer')}
        disabled={loading !== null}
        className="flex items-center gap-2 rounded-xl bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-400 hover:bg-sky-500/30 transition-colors disabled:opacity-50"
      >
        {loading === 'customer' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        Find Customers
      </button>
    </div>
  );
}
