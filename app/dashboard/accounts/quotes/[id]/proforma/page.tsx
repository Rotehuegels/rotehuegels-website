import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PDFDocumentViewer from '@/components/PDFDocumentViewer';

export const dynamic = 'force-dynamic';

export default async function ProformaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: pi, error } = await supabaseAdmin
    .from('proforma_invoices')
    .select('pi_no, status')
    .eq('quote_id', id)
    .single();

  if (error || !pi) notFound();

  const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-zinc-800 text-zinc-400',
    sent: 'bg-blue-500/10 text-blue-400',
    paid: 'bg-green-500/10 text-green-400',
  };

  return (
    <div className="p-4 print:p-0">
      <div className="flex items-center justify-between mb-4 no-print">
        <div className="flex items-center gap-3">
          <Link href={`/d/quotes/${id}`} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to Quote
          </Link>
          <span className="text-zinc-700">|</span>
          <span className="text-xs text-zinc-500">Proforma Invoice</span>
          <span className="font-mono text-sm text-amber-400 font-bold">{pi.pi_no}</span>
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[pi.status] ?? ''}`}>
            {pi.status}
          </span>
        </div>
      </div>

      <PDFDocumentViewer
        pdfUrl={`/api/accounts/quotes/${id}/proforma/pdf`}
        filename={`Proforma-${pi.pi_no}`}
      />
    </div>
  );
}
