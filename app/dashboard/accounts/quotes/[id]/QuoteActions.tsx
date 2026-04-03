'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Check, X, RefreshCw } from 'lucide-react';

interface Props {
  quoteId: string;
  currentStatus: string;
}

export default function QuoteActions({ quoteId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');

  async function updateStatus(status: string) {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/accounts/quotes/${quoteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? 'Failed.');
    }
    setLoading(false);
    router.refresh();
  }

  async function convertToOrder() {
    if (!confirm('Convert this quote to an Order + Proforma Invoice?')) return;
    setConverting(true);
    setError('');
    const res = await fetch(`/api/accounts/quotes/${quoteId}/convert`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Conversion failed.'); setConverting(false); return; }
    router.refresh();
  }

  const isConverted = currentStatus === 'converted';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {error && <span className="text-xs text-red-400">{error}</span>}

      {!isConverted && currentStatus !== 'rejected' && (
        <>
          {currentStatus === 'draft' && (
            <button onClick={() => updateStatus('sent')} disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600/80 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors">
              <Send className="h-3.5 w-3.5" /> Mark Sent
            </button>
          )}
          {(currentStatus === 'sent' || currentStatus === 'draft') && (
            <>
              <button onClick={() => updateStatus('accepted')} disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-green-600/80 px-3 py-2 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors">
                <Check className="h-3.5 w-3.5" /> Accept
              </button>
              <button onClick={() => updateStatus('rejected')} disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-red-600/20 border border-red-600/40 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-600/30 disabled:opacity-50 transition-colors">
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </>
          )}
          {currentStatus === 'accepted' && (
            <button onClick={convertToOrder} disabled={converting}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors">
              <RefreshCw className={`h-3.5 w-3.5 ${converting ? 'animate-spin' : ''}`} />
              {converting ? 'Converting…' : 'Convert to Order + Proforma'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
