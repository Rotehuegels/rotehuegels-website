import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import InvoiceViewer from './InvoiceViewer';

function getFY(dateStr: string) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return m >= 4 ? `${String(y).slice(2)}-${String(y + 1).slice(2)}` : `${String(y - 1).slice(2)}-${String(y).slice(2)}`;
}

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ upto?: string; stage?: string; embed?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('order_no, order_date, invoice_date')
    .eq('id', id)
    .single();

  if (error || !order) notFound();

  const rawDate = order.invoice_date ?? order.order_date;
  const fy = getFY(rawDate);
  const invoiceNo = `RH/${fy}/${order.order_no}`;

  // Build query params for the PDF API
  const pdfParams = new URLSearchParams();
  if (sp.upto) pdfParams.set('upto', sp.upto);
  if (sp.stage) pdfParams.set('stage', sp.stage);
  const qs = pdfParams.toString() ? `?${pdfParams.toString()}` : '';

  const stageLabel = sp.upto ? `Stages 1-${sp.upto}` : sp.stage ? `Stage ${sp.stage}` : null;

  // Embed mode (used by mobile re-invoice preview iframe)
  if (sp.embed === '1') {
    return (
      <iframe
        src={`/api/accounts/orders/${id}/invoice/pdf${qs}`}
        className="w-full h-full"
        title="Invoice"
      />
    );
  }

  return (
    <div className="p-4 print:p-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 no-print">
        <div className="flex items-center gap-3">
          <Link href={`/d/orders/${id}`} className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            &larr; Back to Order
          </Link>
          <span className="text-zinc-700">|</span>
          <span className="text-xs text-zinc-500">Invoice</span>
          <span className="font-mono text-sm text-amber-400 font-bold">{invoiceNo}</span>
          {stageLabel && (
            <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">{stageLabel}</span>
          )}
        </div>
      </div>

      {/* PDF Viewer */}
      <InvoiceViewer
        orderId={id}
        invoiceNo={invoiceNo}
        queryString={qs}
      />
    </div>
  );
}
