'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { cancelViaTokenAction } from './actions';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function CancelAction({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
        <CheckCircle2 className="h-7 w-7 text-emerald-400 mb-3" />
        <p className="text-base font-semibold mb-2">Booking cancelled.</p>
        <p className="text-sm text-zinc-400 mb-4">A cancellation email with an updated calendar invite has been sent.</p>
        <Link href="/" className="text-sm text-rose-400 hover:text-rose-300 no-underline">Back to Rotehügels →</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await cancelViaTokenAction(token);
            if (!res.ok) { setError(res.error ?? 'Cancel failed.'); return; }
            setDone(true);
          });
        }}
        className="inline-flex items-center gap-2 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Yes, cancel this booking
      </button>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <p className="text-xs text-zinc-500">If this was a mistake, just close this tab — nothing happens until you click cancel above.</p>
    </div>
  );
}
