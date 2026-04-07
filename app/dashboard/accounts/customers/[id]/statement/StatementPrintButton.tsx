'use client';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function StatementPrintButton({ customerId, fy }: { customerId: string; fy?: string }) {
  const fyParam = fy && fy !== 'all' ? `?fy=${fy}` : '';
  return (
    <Link
      href={`/dashboard/accounts/customers/${customerId}/statement/preview${fyParam}`}
      className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 transition-colors"
    >
      <FileText className="h-3.5 w-3.5" /> Preview / PDF
    </Link>
  );
}
