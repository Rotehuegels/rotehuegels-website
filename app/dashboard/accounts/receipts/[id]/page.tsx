import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Receipt as ReceiptIcon, Building2, Calendar, Hash, Banknote,
  ReceiptText, AlertCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_COLOR: Record<string, string> = {
  draft:     'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  issued:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: receipt, error } = await supabaseAdmin
    .from('payment_receipts')
    .select('*, orders(id, order_no, client_name), order_payments(payment_date, amount_received)')
    .eq('id', id)
    .single();

  if (error || !receipt) notFound();

  const order = receipt.orders as { id: string; order_no: string; client_name: string } | null;
  const payment = receipt.order_payments as { payment_date: string; amount_received: number } | null;

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-[1800px]">
      <div>
        <Link href="/d/receipts"
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-3 transition-colors">
          <ArrowLeft className="h-3 w-3" /> Payment Receipts
        </Link>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <ReceiptIcon className="h-6 w-6 text-emerald-400" />
            <div>
              <h1 className="text-2xl font-bold text-white font-mono">{receipt.receipt_no}</h1>
              <p className="mt-1 text-sm text-zinc-500">Issued {fmtDate(receipt.receipt_date)}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${STATUS_COLOR[receipt.status] ?? STATUS_COLOR.issued}`}>
            {receipt.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`${glass} p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
            <Building2 className="h-4 w-4 text-violet-400" /> Received from
          </h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-32 shrink-0">Name</dt>
              <dd className="text-zinc-200">{receipt.received_from}</dd>
            </div>
            {receipt.party_gstin && (
              <div className="flex gap-3">
                <dt className="text-zinc-500 w-32 shrink-0 flex items-center gap-1"><Hash className="h-3 w-3" /> GSTIN</dt>
                <dd className="text-zinc-200 font-mono">{receipt.party_gstin}</dd>
              </div>
            )}
            {order && (
              <div className="flex gap-3">
                <dt className="text-zinc-500 w-32 shrink-0 flex items-center gap-1"><ReceiptText className="h-3 w-3" /> Linked order</dt>
                <dd>
                  <Link href={`/d/orders/${order.id}`} className="text-rose-400 hover:text-rose-300 font-mono">
                    {order.order_no}
                  </Link>
                  {order.client_name && <span className="text-zinc-500"> · {order.client_name}</span>}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className={`${glass} p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
            <Banknote className="h-4 w-4 text-emerald-400" /> Payment details
          </h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-32 shrink-0 flex items-center gap-1"><Calendar className="h-3 w-3" /> Receipt date</dt>
              <dd className="text-zinc-200">{fmtDate(receipt.receipt_date)}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-32 shrink-0">Mode</dt>
              <dd className="text-zinc-200">{receipt.payment_mode ?? '—'}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-32 shrink-0">Reference</dt>
              <dd className="text-zinc-200 font-mono">{receipt.reference_no ?? '—'}</dd>
            </div>
            {receipt.bank_name && (
              <div className="flex gap-3">
                <dt className="text-zinc-500 w-32 shrink-0">Bank</dt>
                <dd className="text-zinc-200">{receipt.bank_name}</dd>
              </div>
            )}
            {payment && (
              <div className="flex gap-3">
                <dt className="text-zinc-500 w-32 shrink-0">Source payment</dt>
                <dd className="text-zinc-300">
                  {fmtDate(payment.payment_date)} · {fmt(Number(payment.amount_received))}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className={`${glass} p-5 flex items-center justify-between`}>
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Amount received</span>
        <span className="text-2xl font-bold text-emerald-400">{fmt(Number(receipt.amount ?? 0))}</span>
      </div>

      {receipt.notes && (
        <div className={`${glass} p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
            <AlertCircle className="h-4 w-4 text-zinc-400" /> Notes
          </h2>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{receipt.notes}</p>
        </div>
      )}
    </div>
  );
}
