import Link from 'next/link';
import { Printer } from 'lucide-react';

export default function QuotePrintButton({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/accounts/quotes/${id}/preview`}
      className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 transition-colors"
    >
      <Printer className="h-3.5 w-3.5" /> Print / PDF
    </Link>
  );
}
