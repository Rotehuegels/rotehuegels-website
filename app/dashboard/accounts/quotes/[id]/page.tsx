import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import QuoteActions from './QuoteActions';
import SendEmailButton from '@/components/SendEmailButton';
import PDFDocumentViewer from '@/components/PDFDocumentViewer';
import DeleteButton from '@/components/DeleteButton';

export const dynamic = 'force-dynamic';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-800 text-zinc-400',
  sent: 'bg-blue-500/10 text-blue-400',
  accepted: 'bg-green-500/10 text-green-400',
  rejected: 'bg-red-500/10 text-red-400',
  expired: 'bg-orange-500/10 text-orange-400',
  converted: 'bg-amber-500/10 text-amber-400',
};

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: quote, error } = await supabaseAdmin
    .from('quotes')
    .select('quote_no, quote_date, valid_until, status, total_amount, taxable_value, converted_order_id, items')
    .eq('id', id)
    .single();

  if (error || !quote) notFound();

  const items = (quote.items ?? []) as Array<{ name: string }>;

  let convertedOrder = null;
  let proformaInvoice = null;
  if (quote.converted_order_id) {
    const [orderRes, piRes] = await Promise.all([
      supabaseAdmin.from('orders').select('id, order_no').eq('id', quote.converted_order_id).single(),
      supabaseAdmin.from('proforma_invoices').select('id, pi_no').eq('quote_id', id).single(),
    ]);
    convertedOrder = orderRes.data;
    proformaInvoice = piRes.data;
  }

  return (
    <div className="p-4 print:p-0">
      {/* Top bar */}
      <div className="flex items-start justify-between mb-4 no-print">
        <div>
          <Link href="/d/quotes"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-3 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Quotations
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-amber-400 font-bold">{quote.quote_no}</span>
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[quote.status] ?? ''}`}>
              {quote.status}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {fmtDate(quote.quote_date)}
            {quote.valid_until && ` · Valid until ${fmtDate(quote.valid_until)}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <SendEmailButton type="quote_email" entityId={id} label="Email Quote"
            confirmMessage="Send this quotation to the customer via email?" />
          <QuoteActions
            quoteId={id}
            currentStatus={quote.status}
            totalAmount={quote.total_amount}
            taxableValue={quote.taxable_value}
            defaultDesc={items.map(i => i.name).join('; ')}
          />
          {!convertedOrder && quote.status !== 'accepted' && quote.status !== 'converted' && (
            <DeleteButton
              entityName="quote"
              entityLabel={quote.quote_no}
              deleteUrl={`/api/accounts/quotes/${id}`}
              redirectUrl="/d/quotes"
            />
          )}
        </div>
      </div>

      {/* Converted notice */}
      {convertedOrder && (
        <div className="no-print rounded-xl border border-amber-600/30 bg-amber-500/5 p-4 flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-amber-400">Converted to Order</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Order: <span className="text-amber-300 font-mono">{convertedOrder.order_no}</span>
              {proformaInvoice && (
                <> · Proforma: <span className="text-amber-300 font-mono">{proformaInvoice.pi_no}</span></>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/d/orders/${convertedOrder.id}`}
              className="text-xs text-amber-400 hover:underline">Order &rarr;</Link>
            {proformaInvoice && (
              <Link href={`/d/quotes/${id}/proforma`} target="_blank"
                className="text-xs text-amber-400 hover:underline">Proforma &rarr;</Link>
            )}
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      <PDFDocumentViewer
        pdfUrl={`/api/accounts/quotes/${id}/pdf`}
        filename={`Quote-${quote.quote_no}`}
      />
    </div>
  );
}
