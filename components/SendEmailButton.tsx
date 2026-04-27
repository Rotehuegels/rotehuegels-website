'use client';

import { useState } from 'react';
import { Mail, Loader2, Check, AlertCircle } from 'lucide-react';

interface SendEmailButtonProps {
  type: 'order_confirmation' | 'payment_receipt' | 'payment_reminder' | 'quote_email' | 'po_confirmation';
  entityId: string;
  label: string;
  /** Optional: confirm before sending */
  confirmMessage?: string;
  /** Optional: send invoice for only this payment stage */
  stage?: number;
  /** Optional: send cumulative invoice for stages 1..upto */
  upto?: number;
  /** Optional: override base style for compact inline use */
  compact?: boolean;
}

export default function SendEmailButton({ type, entityId, label, confirmMessage, stage, upto, compact }: SendEmailButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleClick() {
    if (confirmMessage && !confirm(confirmMessage)) return;

    setState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, entityId, stage, upto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to send email');
      setState('success');
      setTimeout(() => setState('idle'), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send');
      setState('error');
      setTimeout(() => setState('idle'), 5000);
    }
  }

  const base = compact
    ? 'inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-medium transition-colors disabled:opacity-50'
    : 'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50';

  if (state === 'success') {
    return (
      <button disabled className={`${base} border-emerald-500/30 bg-emerald-500/10 text-emerald-400`}>
        <Check className={compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} /> Sent
      </button>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col items-start gap-1">
        <button disabled className={`${base} border-red-500/30 bg-red-500/10 text-red-400`}>
          <AlertCircle className={compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} /> Failed
        </button>
        {errorMsg && <span className="text-[11px] text-red-400 max-w-[240px] truncate">{errorMsg}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className={`${base} border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:border-amber-500 hover:text-amber-400`}
    >
      {state === 'loading' ? (
        <Loader2 className={`${compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} animate-spin`} />
      ) : (
        <Mail className={compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} />
      )}
      {state === 'loading' ? 'Sending...' : label}
    </button>
  );
}
