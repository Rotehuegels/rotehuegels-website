'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, PackageCheck, AlertCircle, Loader2 } from 'lucide-react';

type Action = 'inspected' | 'accepted' | 'rejected' | 'partial';

interface Props {
  grnId: string;
  currentStatus: string;
  /** Sum of accepted_qty across all lines — used to suggest accept vs partial */
  totalAccepted: number;
  /** Sum of ordered_qty across all lines */
  totalOrdered: number;
  /** Sum of rejected_qty across all lines */
  totalRejected: number;
}

const ACTION_LABELS: Record<Action, string> = {
  inspected: 'Mark Inspected',
  accepted: 'Accept',
  rejected: 'Reject',
  partial: 'Mark Partial',
};

export default function GRNStatusActions({
  grnId,
  currentStatus,
  totalAccepted,
  totalOrdered,
  totalRejected,
}: Props) {
  const router = useRouter();
  const [action, setAction] = useState<Action | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (currentStatus === 'accepted' || currentStatus === 'rejected' || currentStatus === 'partial') {
    return null;
  }

  // If the inspector wants to "Accept" but the lines indicate a shortfall or
  // any rejections, route them to "Partial" so the badge tells the truth.
  const acceptIsPartial = totalRejected > 0 || totalAccepted < totalOrdered;
  const primaryAccept: Action = acceptIsPartial ? 'partial' : 'accepted';

  async function submit() {
    if (!action) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/accounts/grn/${grnId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          status: action,
          inspection_notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === 'string' ? data.error : 'Update failed.');
      }
      setAction(null);
      setNotes('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {currentStatus === 'pending' && (
          <button
            onClick={() => setAction('inspected')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-500/20 hover:text-white transition-colors"
          >
            <PackageCheck className="h-3.5 w-3.5" /> Mark Inspected
          </button>
        )}
        <button
          onClick={() => setAction(primaryAccept)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition-colors"
        >
          {acceptIsPartial ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          {acceptIsPartial ? 'Accept (Partial)' : 'Accept'}
        </button>
        <button
          onClick={() => setAction('rejected')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 hover:text-white transition-colors"
        >
          <XCircle className="h-3.5 w-3.5" /> Reject
        </button>
      </div>

      {action && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !submitting && setAction(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">{ACTION_LABELS[action]}</h3>
            <p className="mt-1 text-sm text-zinc-400">
              {action === 'inspected' && 'Confirm that you have physically inspected the goods.'}
              {action === 'accepted' && 'Mark this GRN as accepted. Stock has already been received against the line items.'}
              {action === 'partial' && `Accept with discrepancy: ${totalAccepted} of ${totalOrdered} accepted, ${totalRejected} rejected.`}
              {action === 'rejected' && 'Reject this GRN. The line-item stock receipts already posted will need a separate reversal.'}
            </p>

            <label className="block mt-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Inspection notes {action !== 'rejected' && '(optional)'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder={
                action === 'rejected'
                  ? 'Why is this GRN being rejected?'
                  : 'Anything noteworthy about the inspection…'
              }
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
              autoFocus
            />

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setAction(null)}
                disabled={submitting}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting || (action === 'rejected' && !notes.trim())}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm {ACTION_LABELS[action]}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
