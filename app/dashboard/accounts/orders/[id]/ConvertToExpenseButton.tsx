'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, Loader2 } from 'lucide-react';

export default function ConvertToExpenseButton({ orderId, orderNo }: { orderId: string; orderNo: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (!confirm(`Convert ${orderNo} to an expense entry and permanently delete the order?\n\nThis will:\n• Create an expense record with the order data\n• Delete the order, payments, and stages\n• Free up the order number ${orderNo}\n\nThis cannot be undone.`)) return;

    setLoading(true);
    const res = await fetch(`/api/accounts/orders/${orderId}/convert-to-expense`, { method: 'POST' });
    const data = await res.json();

    if (res.ok) {
      alert(`${orderNo} converted to expense and deleted.\nOrder number is now free for reuse.`);
      router.push('/d/orders');
    } else {
      alert(`Error: ${data.error}`);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleConvert}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRightLeft className="h-3.5 w-3.5" />}
      Convert to Expense &amp; Delete
    </button>
  );
}
