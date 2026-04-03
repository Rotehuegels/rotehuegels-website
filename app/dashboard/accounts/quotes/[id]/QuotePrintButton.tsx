'use client';
import { Printer } from 'lucide-react';

export default function QuotePrintButton({ id }: { id: string }) {
  function handlePrint() {
    const w = window.open(`/dashboard/accounts/quotes/${id}/preview`, '_blank');
    if (w) w.onload = () => w.print();
  }
  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 transition-colors"
    >
      <Printer className="h-3.5 w-3.5" /> Print / PDF
    </button>
  );
}
