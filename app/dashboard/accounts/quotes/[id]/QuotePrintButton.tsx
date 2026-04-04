'use client';
import { Printer } from 'lucide-react';

export default function QuotePrintButton({ id }: { id: string }) {
  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0;left:-9999px;top:-9999px';
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 500);
    };
    iframe.src = `/dashboard/accounts/quotes/${id}/preview`;
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 transition-colors"
    >
      <Printer className="h-3.5 w-3.5" /> Print / PDF
    </button>
  );
}
