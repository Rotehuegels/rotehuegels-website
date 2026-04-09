'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

interface Props {
  orderId: string;
}

export default function MarkCompleteButton({ orderId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm('Mark this order as completed?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl border border-emerald-700 bg-emerald-900/30 px-4 py-2 text-sm font-medium text-emerald-400 hover:border-emerald-500 hover:bg-emerald-900/50 disabled:opacity-50 transition-colors"
    >
      <CheckCircle className="h-3.5 w-3.5" />
      {loading ? 'Saving…' : 'Mark Complete'}
    </button>
  );
}
