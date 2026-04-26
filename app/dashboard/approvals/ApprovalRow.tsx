'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Ban, Loader2, ExternalLink } from 'lucide-react';

type ChainStep = {
  level: number;
  approver_email: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  acted_by_email?: string;
  acted_at?: string;
  notes?: string;
};

type Approval = {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_label: string | null;
  requested_by_email: string | null;
  status: string;
  current_level: number;
  total_levels: number;
  approval_chain: ChainStep[];
  amount: number | null;
  created_at: string;
  completed_at: string | null;
};

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  approved:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected:  'bg-rose-500/10 text-rose-400 border-rose-500/20',
  cancelled: 'bg-zinc-700/30 text-zinc-500 border-zinc-700/50',
};

// Where to send the user when they want to view the underlying entity
const ENTITY_LINK: Record<string, (id: string) => string> = {
  purchase_order:    (id) => `/d/purchase-orders`,
  purchase_invoice:  (id) => `/d/purchase-invoices/${id}`,
  indent:            (id) => `/d/indents/${id}`,
  expense:           ()   => `/d/expenses`,
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function ApprovalRow({
  approval, canAct, isMine, canCancel,
}: { approval: Approval; canAct: boolean; isMine: boolean; canCancel: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr]   = useState('');

  async function act(action: 'approve' | 'reject' | 'cancel', notes?: string) {
    setBusy(action); setErr('');
    const res = await fetch(`/api/approvals/${approval.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notes !== undefined ? { action, notes } : { action }),
    });
    const json = await res.json();
    setBusy(null);
    if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : JSON.stringify(json.error)); return; }
    router.refresh();
  }

  async function reject() {
    const reason = window.prompt('Rejection reason (required):');
    if (!reason) return;
    await act('reject', reason);
  }

  async function cancel() {
    if (!window.confirm('Cancel this approval request?')) return;
    await act('cancel');
  }

  const link = ENTITY_LINK[approval.entity_type]?.(approval.entity_id);
  const currentStep = approval.approval_chain.find((s) => s.level === approval.current_level);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-wider text-zinc-500">{approval.entity_type.replace('_', ' ')}</p>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_COLOR[approval.status] ?? STATUS_COLOR.pending}`}>
              {approval.status}
            </span>
            {approval.total_levels > 1 && (
              <span className="text-[10px] text-zinc-500">step {approval.current_level} / {approval.total_levels}</span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-200">{approval.entity_label ?? approval.entity_id}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Requested by {approval.requested_by_email ?? 'unknown'} · {fmtDate(approval.created_at)}
            {approval.amount != null && (
              <> · <span className="tabular-nums">₹ {Number(approval.amount).toLocaleString('en-IN')}</span></>
            )}
          </p>
          {approval.status === 'pending' && currentStep && (
            <p className="mt-1 text-xs text-amber-300">Waiting on {currentStep.approver_email}</p>
          )}
        </div>
        {link && (
          <Link href={link} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white shrink-0">
            <ExternalLink className="h-3 w-3" /> Open
          </Link>
        )}
      </div>

      {/* Chain steps */}
      {approval.approval_chain.length > 1 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
          {approval.approval_chain.map((s, i) => (
            <div key={s.level} className="flex items-center gap-2">
              {i > 0 && <span className="text-zinc-700">→</span>}
              <span className={[
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5',
                s.status === 'approved' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : s.status === 'rejected' ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                : s.level === approval.current_level ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                : 'border-zinc-800 text-zinc-500',
              ].join(' ')}>
                {s.approver_email}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action bar */}
      {(canAct || canCancel) && approval.status === 'pending' && (
        <div className="mt-4 flex flex-wrap gap-2">
          {canAct && (
            <>
              <button onClick={() => act('approve')} disabled={busy !== null}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-1.5 text-xs font-medium text-emerald-300 disabled:opacity-50">
                {busy === 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Approve
              </button>
              <button onClick={reject} disabled={busy !== null}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-1.5 text-xs font-medium text-rose-300 disabled:opacity-50">
                {busy === 'reject' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Reject
              </button>
            </>
          )}
          {canCancel && (
            <button onClick={cancel} disabled={busy !== null}
              title={isMine ? undefined : 'Cancel as admin'}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 hover:border-zinc-500 px-3.5 py-1.5 text-xs text-zinc-400 disabled:opacity-50">
              {busy === 'cancel' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
              {isMine ? 'Cancel request' : 'Cancel (admin)'}
            </button>
          )}
        </div>
      )}

      {err && <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{err}</div>}
    </div>
  );
}
