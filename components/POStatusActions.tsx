'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

type Action = 'send' | 'acknowledge' | 'short_close' | 'cancel';

interface Props {
  poId: string;
  currentStatus: string;
  /** True if at least one GRN has been posted against this PO. Cancel is forbidden in that case. */
  hasGrn: boolean;
  onChanged?: () => void;
}

const ACTION_LABEL: Record<Action, string> = {
  send: 'Send to Supplier',
  acknowledge: 'Mark Acknowledged',
  short_close: 'Short Close',
  cancel: 'Cancel PO',
};

export default function POStatusActions({ poId, currentStatus, hasGrn, onChanged }: Props) {
  const router = useRouter();
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Once a PO has reached a terminal state, no further transitions are offered.
  if (['received', 'closed', 'cancelled'].includes(currentStatus)) return null;

  const canSend         = currentStatus === 'draft';
  const canAcknowledge  = currentStatus === 'sent';
  const canShortClose   = ['sent', 'acknowledged', 'partial'].includes(currentStatus);
  const canCancel       = ['draft', 'sent', 'acknowledged'].includes(currentStatus) && !hasGrn;

  async function submit() {
    if (!action) return;
    setSubmitting(true);
    setError('');

    const body: Record<string, unknown> =
      action === 'send'         ? { status: 'sent' }
    : action === 'acknowledge'  ? { status: 'acknowledged', supplier_ref: reference.trim() || null }
    : action === 'short_close'  ? { status: 'closed', closure_type: 'short', closure_reason: reason.trim() }
    : action === 'cancel'       ? { status: 'cancelled', cancellation_reason: reason.trim() }
    : {};

    try {
      const res = await fetch(`/api/accounts/purchase-orders/${poId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === 'string' ? data.error : 'Update failed.');
      }
      setAction(null);
      setReason('');
      setReference('');
      onChanged?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setSubmitting(false);
    }
  }

  const reasonRequired = action === 'short_close' || action === 'cancel';

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {canSend && (
          <button
            onClick={() => setAction('send')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-300 hover:bg-blue-500/20 hover:text-white transition-colors"
          >
            <Send className="h-3.5 w-3.5" /> Send to Supplier
          </button>
        )}
        {canAcknowledge && (
          <button
            onClick={() => setAction('acknowledge')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-300 hover:bg-sky-500/20 hover:text-white transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Acknowledged
          </button>
        )}
        {canShortClose && (
          <button
            onClick={() => setAction('short_close')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/20 hover:text-white transition-colors"
          >
            <AlertTriangle className="h-3.5 w-3.5" /> Short Close
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => setAction('cancel')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20 hover:text-white transition-colors"
          >
            <XCircle className="h-3.5 w-3.5" /> Cancel
          </button>
        )}
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
            <h3 className="text-lg font-semibold text-white">{ACTION_LABEL[action]}</h3>
            <p className="mt-1 text-sm text-zinc-400">
              {action === 'send' && 'This will email the PO to the supplier and move the status to Sent. Make sure approval (if applicable) has been completed.'}
              {action === 'acknowledge' && 'Record that the supplier has acknowledged this PO. Optionally capture their reference number.'}
              {action === 'short_close' && 'Close this PO with a shortfall. The remaining balance will not be expected. Stock already received stays in inventory.'}
              {action === 'cancel' && 'Withdraw this PO. This is only allowed when no goods have been received yet.'}
            </p>

            {action === 'acknowledge' && (
              <>
                <label className="block mt-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Supplier reference (optional)
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Supplier's order ref / acknowledgment no."
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                  autoFocus
                />
              </>
            )}

            {reasonRequired && (
              <>
                <label className="block mt-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  {action === 'short_close' ? 'Reason for short close' : 'Reason for cancellation'} <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder={
                    action === 'short_close'
                      ? 'e.g. Supplier exited the contract; balance qty no longer required'
                      : 'e.g. Project scope changed; PO no longer needed'
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                  autoFocus
                />
              </>
            )}

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
                disabled={submitting || (reasonRequired && !reason.trim())}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm {ACTION_LABEL[action]}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
