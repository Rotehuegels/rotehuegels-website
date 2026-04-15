import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PDFDocumentViewer from '@/components/PDFDocumentViewer';

export const dynamic = 'force-dynamic';

export default async function POPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: po, error } = await supabaseAdmin
    .from('purchase_orders')
    .select('po_no')
    .eq('id', id)
    .single();

  if (error || !po) notFound();

  return (
    <div className="p-4 print:p-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 no-print">
        <div className="flex items-center gap-3">
          <Link href={`/d/purchase-orders/${id}`}
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            &larr; Back to PO
          </Link>
          <span className="text-zinc-700">|</span>
          <span className="text-xs text-zinc-500">Purchase Order</span>
          <span className="font-mono text-sm text-amber-400 font-bold">{po.po_no}</span>
        </div>
      </div>

      {/* PDF Viewer */}
      <PDFDocumentViewer
        pdfUrl={`/api/accounts/purchase-orders/${id}/pdf`}
        filename={`PO-${po.po_no}`}
      />
    </div>
  );
}
