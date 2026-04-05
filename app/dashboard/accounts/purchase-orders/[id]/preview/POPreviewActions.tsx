'use client';
import { Printer, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function POPreviewActions({ poId, poNo }: { poId: string; poNo: string }) {
  const router = useRouter();
  return (
    <div className="print:hidden flex items-center justify-between px-6 py-3 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/dashboard/accounts/purchase-orders/${poId}`)}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to PO
        </button>
        <span className="text-zinc-700">|</span>
        <span className="text-xs text-zinc-500">Purchase Order Preview</span>
        <span className="font-mono text-sm text-amber-400 font-bold">{poNo}</span>
      </div>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors"
      >
        <Printer className="h-4 w-4" /> Print / Save PDF
      </button>
    </div>
  );
}
