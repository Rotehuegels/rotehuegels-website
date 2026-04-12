'use client';
import { Printer, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InvoiceActions({ orderId }: { orderId: string }) {
  const router = useRouter();
  return (
    <div className="print:hidden flex items-center gap-2">
      <button
        onClick={() => router.push(`/d/orders/${orderId}`)}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Order
      </button>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors ml-2"
      >
        <Printer className="h-4 w-4" /> Print / Save PDF
      </button>
    </div>
  );
}
