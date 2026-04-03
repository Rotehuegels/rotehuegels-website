import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, RefreshCw } from 'lucide-react';
import QuoteActions from './QuoteActions';

export const dynamic = 'force-dynamic';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_COLORS: Record<string, string> = {
  draft:     'bg-zinc-800 text-zinc-400',
  sent:      'bg-blue-500/10 text-blue-400',
  accepted:  'bg-green-500/10 text-green-400',
  rejected:  'bg-red-500/10 text-red-400',
  expired:   'bg-orange-500/10 text-orange-400',
  converted: 'bg-amber-500/10 text-amber-400',
};

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: quote, error } = await supabaseAdmin
    .from('quotes')
    .select('*, customers(*)')
    .eq('id', id)
    .single();

  if (error || !quote) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customer = quote.customers as any;
  const items = (quote.items ?? []) as Array<{
    sku_id: string; name: string; item_type: string;
    hsn_code?: string; sac_code?: string; unit: string;
    quantity: number; mrp: number; unit_price: number;
    discount_pct: number; taxable_amount: number;
    gst_rate: number; gst_amount: number; total: number;
  }>;

  const isIntra = customer?.state_code === '33' || customer?.state?.toLowerCase().includes('tamil');

  // If converted, get the order + proforma
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
    <div className="p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/dashboard/accounts/quotes" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-3 transition-colors">
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
        <div className="flex gap-2">
          <Link href={`/dashboard/accounts/quotes/${id}/preview`}
            target="_blank"
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors">
            <Eye className="h-3.5 w-3.5" /> Preview
          </Link>
          <QuoteActions quoteId={id} currentStatus={quote.status} />
        </div>
      </div>

      {/* Converted notice */}
      {convertedOrder && (
        <div className="rounded-xl border border-amber-600/30 bg-amber-500/5 p-4 flex items-center justify-between">
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
            <Link href={`/dashboard/accounts/orders/${convertedOrder.id}`}
              className="text-xs text-amber-400 hover:underline">Order →</Link>
            {proformaInvoice && (
              <Link href={`/dashboard/accounts/quotes/${id}/proforma`} target="_blank"
                className="text-xs text-amber-400 hover:underline">Proforma →</Link>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Customer</h2>
          <div>
            <p className="text-white font-medium">{customer?.name}</p>
            <p className="text-xs text-zinc-500">{customer?.customer_id}</p>
            {customer?.gstin && <p className="font-mono text-xs text-zinc-400 mt-1">{customer.gstin}</p>}
            {customer?.state && (
              <p className="text-xs text-zinc-500 mt-1">{customer.state} · {isIntra ? 'Intra-state' : 'Inter-state'}</p>
            )}
          </div>
          <Link href={`/dashboard/accounts/customers/${customer?.id}`}
            className="text-xs text-amber-400 hover:underline">View customer →</Link>
        </div>

        {/* Summary */}
        <div className="md:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Amount Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span className="font-mono">{fmt(quote.subtotal)}</span>
            </div>
            {Number(quote.discount_amount) > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Discount</span>
                <span className="font-mono">− {fmt(quote.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-400">
              <span>Taxable Value</span>
              <span className="font-mono">{fmt(quote.taxable_value)}</span>
            </div>
            {isIntra ? (
              <>
                <div className="flex justify-between text-zinc-500 text-xs">
                  <span>CGST</span><span className="font-mono">{fmt(quote.cgst_amount)}</span>
                </div>
                <div className="flex justify-between text-zinc-500 text-xs">
                  <span>SGST</span><span className="font-mono">{fmt(quote.sgst_amount)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-zinc-500 text-xs">
                <span>IGST</span><span className="font-mono">{fmt(quote.igst_amount)}</span>
              </div>
            )}
            <div className="border-t border-zinc-700 pt-2 flex justify-between text-white font-bold text-base">
              <span>Grand Total</span>
              <span className="font-mono text-amber-400">{fmt(quote.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line items table */}
      <div className="rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/60">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Line Items</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/40">
              <th className="px-5 py-3 text-left text-xs text-zinc-500">#</th>
              <th className="px-5 py-3 text-left text-xs text-zinc-500">Item</th>
              <th className="px-5 py-3 text-left text-xs text-zinc-500">HSN/SAC</th>
              <th className="px-5 py-3 text-right text-xs text-zinc-500">Qty</th>
              <th className="px-5 py-3 text-right text-xs text-zinc-500">Rate</th>
              <th className="px-5 py-3 text-right text-xs text-zinc-500">Disc%</th>
              <th className="px-5 py-3 text-right text-xs text-zinc-500">Taxable</th>
              <th className="px-5 py-3 text-right text-xs text-zinc-500">GST</th>
              <th className="px-5 py-3 text-right text-xs text-zinc-500">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-zinc-800/20">
                <td className="px-5 py-3 text-zinc-600 text-xs">{i + 1}</td>
                <td className="px-5 py-3">
                  <div className="text-white">{item.name}</div>
                  <div className="text-xs text-zinc-500">{item.sku_id} · {item.unit}</div>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-zinc-400">
                  {item.hsn_code || item.sac_code || '—'}
                </td>
                <td className="px-5 py-3 text-right text-zinc-300 font-mono text-xs">
                  {item.quantity} {item.unit}
                </td>
                <td className="px-5 py-3 text-right font-mono text-xs text-zinc-300">
                  {fmt(item.unit_price)}
                </td>
                <td className="px-5 py-3 text-right text-xs text-zinc-500">
                  {item.discount_pct > 0 ? `${item.discount_pct}%` : '—'}
                </td>
                <td className="px-5 py-3 text-right font-mono text-xs text-zinc-300">
                  {fmt(item.taxable_amount)}
                </td>
                <td className="px-5 py-3 text-right text-xs text-zinc-500">
                  {item.gst_rate}% · {fmt(item.gst_amount)}
                </td>
                <td className="px-5 py-3 text-right font-mono text-sm font-semibold text-white">
                  {fmt(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes & Terms */}
      {(quote.notes || quote.terms) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quote.notes && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Notes</p>
              <p className="text-sm text-zinc-300">{quote.notes}</p>
            </div>
          )}
          {quote.terms && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Terms</p>
              <p className="text-sm text-zinc-300">{quote.terms}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
