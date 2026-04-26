'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ShieldCheck, Pause, Loader2, Wallet, Coins } from 'lucide-react';

const blockedStatuses = ['unmatched','over_billed','price_variance','qty_variance','pending'];

export default function InvoiceActions({
  invoiceId, matchStatus, paymentStatus,
}: {
  invoiceId: string;
  matchStatus: string;
  paymentStatus: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr]   = useState('');

  const isBlocked = blockedStatuses.includes(matchStatus);

  async function patch(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action); setErr('');
    const res = await fetch(`/api/accounts/purchase-invoices/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    });
    const json = await res.json();
    setBusy(null);
    if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : JSON.stringify(json.error)); return; }
    router.refresh();
  }

  async function override() {
    const reason = window.prompt('Reason for overriding the variance (required):');
    if (!reason) return;
    await patch('override', { match_notes: reason });
  }

  async function hold() {
    const reason = window.prompt('Reason for holding payment (optional):') || '';
    await patch('hold', { match_notes: reason });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {paymentStatus !== 'paid' && (
          <>
            <Btn icon={CheckCircle2} label="Approve" busy={busy === 'approve'} onClick={() => patch('approve')}
              tone="emerald" disabled={isBlocked && matchStatus !== 'overridden'}
              hint={isBlocked && matchStatus !== 'overridden' ? 'Match must pass or be overridden first' : undefined} />
            {isBlocked && (
              <Btn icon={ShieldCheck} label="Override variance" busy={busy === 'override'} onClick={override} tone="violet" />
            )}
            {paymentStatus !== 'on_hold' && (
              <Btn icon={Pause} label="Hold" busy={busy === 'hold'} onClick={hold} tone="amber" />
            )}
            {(paymentStatus === 'unpaid' || paymentStatus === 'partial' || paymentStatus === 'on_hold') && (
              <>
                <Btn icon={Coins}  label="Mark partial" busy={busy === 'mark_partial'} onClick={() => patch('mark_partial')} tone="sky" />
                <Btn icon={Wallet} label="Mark paid"    busy={busy === 'mark_paid'}    onClick={() => patch('mark_paid')}    tone="emerald" />
              </>
            )}
          </>
        )}
        {paymentStatus === 'paid' && <p className="text-xs text-zinc-500 italic px-2 py-2">Invoice paid — no further actions.</p>}
      </div>
      {err && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{err}</div>}
    </div>
  );
}

function Btn({
  icon: Icon, label, busy, onClick, tone, disabled, hint,
}: {
  icon: React.ElementType;
  label: string;
  busy: boolean;
  onClick: () => void;
  tone: 'emerald' | 'violet' | 'amber' | 'sky' | 'zinc';
  disabled?: boolean;
  hint?: string;
}) {
  const palette: Record<string, string> = {
    emerald: 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20',
    violet:  'border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20',
    amber:   'border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20',
    sky:     'border border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20',
    zinc:    'border border-zinc-700 hover:border-zinc-500 text-zinc-300',
  };
  return (
    <button onClick={onClick} disabled={busy || disabled} title={hint}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${palette[tone]}`}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}
