'use client';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function QuotePrintButton({ quoteId }: { quoteId: string }) {
  return (
    <Link
      href={`/d/quotes/${quoteId}/preview`}
      className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 transition-colors"
    >
      <FileText className="h-3.5 w-3.5" /> Preview / PDF
    </Link>
  );
}
