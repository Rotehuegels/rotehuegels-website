'use client';

import { useState, useTransition } from 'react';
import { Loader2, XCircle } from 'lucide-react';
import { cancelBookingAsHostAction } from './actions';

export default function CancelBookingButton({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (done) return <span className="text-xs text-zinc-500">Cancelled</span>;

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm('Cancel this booking? The visitor will be notified by email.')) return;
        startTransition(async () => {
          const res = await cancelBookingAsHostAction(token);
          if (res.ok) setDone(true);
          else alert(res.error ?? 'Cancel failed');
        });
      }}
      className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
      Cancel
    </button>
  );
}
