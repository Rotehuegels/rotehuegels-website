'use client';
import { FileText } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function QuotePrintButton() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  return (
    <button
      onClick={() => router.push(`/dashboard/accounts/quotes/${id}/preview`)}
      className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 transition-colors"
    >
      <FileText className="h-3.5 w-3.5" /> Preview / PDF
    </button>
  );
}
