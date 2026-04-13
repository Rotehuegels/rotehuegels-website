'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Phone, MessageSquare } from 'lucide-react';

export default function LeadActions({
  id,
  table,
  currentStatus,
}: {
  id: string;
  table: 'supplier_leads' | 'customer_leads' | 'trading_leads';
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  async function updateStatus(status: string) {
    setLoading(true);
    try {
      await fetch(`/api/crawl/leads/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, table, notes: notes || undefined }),
      });
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm p-6 space-y-4">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Actions</h2>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes (optional)..."
        rows={2}
        className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
      />

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => updateStatus('approved')}
          disabled={loading || currentStatus === 'approved'}
          className="flex items-center gap-2 rounded-xl bg-emerald-500/20 px-5 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          Approve
        </button>
        <button
          onClick={() => updateStatus('rejected')}
          disabled={loading || currentStatus === 'rejected'}
          className="flex items-center gap-2 rounded-xl bg-red-500/20 px-5 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          Reject
        </button>
        <button
          onClick={() => updateStatus('contacted')}
          disabled={loading || currentStatus === 'contacted'}
          className="flex items-center gap-2 rounded-xl bg-purple-500/20 px-5 py-2.5 text-sm font-medium text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
        >
          <Phone className="h-4 w-4" />
          Mark Contacted
        </button>
        {(table === 'customer_leads' || table === 'trading_leads') && (
          <button
            onClick={() => updateStatus('qualified')}
            disabled={loading || currentStatus === 'qualified'}
            className="flex items-center gap-2 rounded-xl bg-sky-500/20 px-5 py-2.5 text-sm font-medium text-sky-400 hover:bg-sky-500/30 transition-colors disabled:opacity-50"
          >
            <MessageSquare className="h-4 w-4" />
            Qualify
          </button>
        )}
      </div>
    </div>
  );
}
