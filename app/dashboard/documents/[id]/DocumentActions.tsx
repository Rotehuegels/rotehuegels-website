'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const btn = 'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export default function DocumentActions({
  documentId,
  currentStatus,
}: {
  documentId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const act = async (action: string, extra?: Record<string, string>) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, user: 'admin@rotehuegels.com', ...extra }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Action failed');
      }
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap">
        {currentStatus === 'draft' && (
          <button
            onClick={() => act('submit_review')}
            disabled={loading}
            className={`${btn} bg-sky-600 hover:bg-sky-500 text-white`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit for Review
          </button>
        )}

        {currentStatus === 'under_review' && (
          <button
            onClick={() => act('approve')}
            disabled={loading}
            className={`${btn} bg-emerald-600 hover:bg-emerald-500 text-white`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Approve
          </button>
        )}

        {(currentStatus === 'draft' || currentStatus === 'under_review' || currentStatus === 'approved') && (
          <button
            onClick={() => act('obsolete', { reason: 'Marked obsolete by admin' })}
            disabled={loading}
            className={`${btn} border border-rose-500/30 text-rose-400 hover:bg-rose-500/10`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Obsolete
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-rose-400">{error}</p>
      )}
    </div>
  );
}
