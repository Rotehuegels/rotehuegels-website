'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Sparkles, Building2, Users, Handshake } from 'lucide-react';

type LeadType = 'supplier' | 'customer' | 'trading';

interface DiscoveryResult {
  type: string;
  query: string;
  providers_used: string[];
  providers_succeeded: string[];
  discovered: number;
  saved: number;
  duplicates: number;
  error?: string;
}

export default function TriggerCrawl() {
  const [loading, setLoading] = useState<LeadType | 'auto' | null>(null);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRan, setAutoRan] = useState(false);

  const discover = useCallback(async (type?: LeadType) => {
    const key = type ?? 'auto';
    setLoading(key);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/leads/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(type ? { type } : {}),
      });
      const data: DiscoveryResult = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        if (data.saved > 0) setTimeout(() => window.location.reload(), 2500);
      }
    } catch {
      setError('Discovery failed — check API keys');
    } finally {
      setLoading(null);
    }
  }, []);

  // Auto-discover on first load (once per browser session)
  useEffect(() => {
    const lastRun = sessionStorage.getItem('lead_discovery_ran');
    if (!lastRun && !autoRan) {
      setAutoRan(true);
      sessionStorage.setItem('lead_discovery_ran', Date.now().toString());
      discover();
    }
  }, [autoRan, discover]);

  const buttons: { type: LeadType; label: string; icon: typeof Building2; color: string }[] = [
    { type: 'supplier', label: 'Suppliers', icon: Building2, color: 'orange' },
    { type: 'customer', label: 'Customers', icon: Users, color: 'sky' },
    { type: 'trading', label: 'Trading', icon: Handshake, color: 'emerald' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        {buttons.map(({ type, label, icon: Icon, color }) => (
          <button
            key={type}
            onClick={() => discover(type)}
            disabled={loading !== null}
            className={`flex items-center gap-2 rounded-xl bg-${color}-500/20 px-4 py-2 text-sm font-medium text-${color}-400 hover:bg-${color}-500/30 transition-colors disabled:opacity-50`}
          >
            {loading === type
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Icon className="h-4 w-4" />}
            Find {label}
          </button>
        ))}
      </div>

      {/* Status line */}
      {loading === 'auto' && (
        <p className="text-xs text-zinc-500 flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          Auto-discovering leads from all AI providers...
        </p>
      )}

      {loading && loading !== 'auto' && (
        <p className="text-xs text-zinc-500 flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          Querying all AI providers for {loading} leads...
        </p>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {result && !error && (
        <p className="text-xs text-zinc-400 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span>
            <strong className="text-white">{result.saved}</strong> new {result.type} leads saved
            {result.duplicates > 0 && <span className="text-zinc-500"> ({result.duplicates} duplicates skipped)</span>}
            {result.providers_succeeded.length > 0 && (
              <span className="text-zinc-600"> via {result.providers_succeeded.join(', ')}</span>
            )}
          </span>
        </p>
      )}
    </div>
  );
}
