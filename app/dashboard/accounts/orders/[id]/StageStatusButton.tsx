'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  stageId: string;
  orderId: string;
  currentStatus: string;
}

const NEXT_STATUS: Record<string, string> = {
  pending: 'partial',
  partial: 'paid',
  paid: 'pending',
};

const LABEL: Record<string, string> = {
  pending: 'Mark Partial',
  partial: 'Mark Paid',
  paid: 'Reset',
};

const COLOR: Record<string, string> = {
  pending: 'border-amber-700 text-amber-400 hover:bg-amber-500/10',
  partial: 'border-emerald-700 text-emerald-400 hover:bg-emerald-500/10',
  paid: 'border-zinc-700 text-zinc-500 hover:bg-zinc-800/60',
};

export default function StageStatusButton({ stageId, orderId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch(`/api/accounts/orders/${orderId}/stages?stageId=${stageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: NEXT_STATUS[currentStatus] ?? 'pending' }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${COLOR[currentStatus] ?? COLOR.pending}`}
    >
      {loading ? '…' : LABEL[currentStatus] ?? 'Update'}
    </button>
  );
}
