import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Wrench, Pencil, FileText } from 'lucide-react';
import RecordPaymentForm from './RecordPaymentForm';
import StageStatusButton from './StageStatusButton';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  partial: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [orderRes, stagesRes, paymentsRes] = await Promise.all([
    supabaseAdmin.from('orders').select('*').eq('id', id).single(),
    supabaseAdmin.from('order_payment_stages').select('*').eq('order_id', id).order('stage_number'),
    supabaseAdmin.from('order_payments').select('*').eq('order_id', id).order('payment_date', { ascending: false }),
  ]);

  if (orderRes.error || !orderRes.data) notFound();

  const order = orderRes.data;
  const stages = stagesRes.data ?? [];
  const payments = paymentsRes.data ?? [];

  const totalReceived = payments.reduce((s, p) => s + (p.amount_received ?? 0), 0);
  const totalTds = payments.reduce((s, p) => s + (p.tds_deducted ?? 0), 0);
  const totalNet = payments.reduce((s, p) => s + (p.net_received ?? 0), 0);
  const pending = (order.total_value_incl_gst ?? 0) - totalReceived;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/accounts/orders"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-3">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Orders
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-amber-400 font-mono">{order.order_no}</h1>
            <div className="flex items-center gap-1.5">
              {order.order_type === 'service'
                ? <Wrench className="h-4 w-4 text-sky-400" />
                : <ShoppingBag className="h-4 w-4 text-violet-400" />}
              <span className={`text-xs capitalize font-medium ${order.order_type === 'service' ? 'text-sky-400' : 'text-violet-400'}`}>
                {order.order_type}
              </span>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLE[order.status] ?? STATUS_STYLE.active}`}>
              {order.status}
            </span>
          </div>
          <p className="mt-1 text-base font-semibold text-white">{order.client_name}</p>
          {order.client_gstin && <p className="text-xs text-zinc-500 font-mono">GSTIN: {order.client_gstin}</p>}
          {order.client_pan && <p className="text-xs text-zinc-500 font-mono">PAN: {order.client_pan}</p>}
        </div>
        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/accounts/orders/${id}/invoice`}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-amber-500 hover:text-amber-400 transition-colors">
              <FileText className="h-3.5 w-3.5" /> Generate Invoice
            </Link>
            <Link href={`/dashboard/accounts/orders/${id}/edit`}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-amber-600 hover:text-amber-400 transition-colors">
              <Pencil className="h-3.5 w-3.5" /> Edit Order
            </Link>
          </div>
          <div className="text-right">
          <p className="text-xs text-zinc-500">Order Date</p>
          <p className="text-sm font-medium text-zinc-300">{fmtDate(order.order_date)}</p>
          {order.entry_date !== order.order_date && (
            <>
              <p className="text-xs text-zinc-600 mt-1">Entered</p>
              <p className="text-xs text-zinc-500">{fmtDate(order.entry_date)}</p>
            </>
          )}
          </div>
        </div>
      </div>

      {order.description && (
        <p className="text-sm text-zinc-400 leading-relaxed">{order.description}</p>
      )}

      {/* Financial summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total (incl GST)', value: order.total_value_incl_gst, color: 'text-white' },
          { label: 'Base Value', value: order.base_value, color: 'text-zinc-300' },
          { label: 'Received (Gross)', value: totalReceived, color: 'text-emerald-400' },
          { label: 'TDS Deducted', value: totalTds, color: 'text-sky-400' },
          { label: 'Pending', value: pending, color: pending > 0 ? 'text-rose-400' : 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`${glass} p-4`}>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className={`text-lg font-black mt-1 ${color}`}>{fmt(value ?? 0)}</p>
          </div>
        ))}
      </div>

      {/* GST & TDS details */}
      <div className={`${glass} p-5`}>
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Tax & TDS Details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-zinc-500">GST Rate</p>
            <p className="text-zinc-200 font-medium">{order.gst_rate}%</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">CGST</p>
            <p className="text-zinc-200 font-medium">{fmt(order.cgst_amount ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">SGST</p>
            <p className="text-zinc-200 font-medium">{fmt(order.sgst_amount ?? 0)}</p>
          </div>
          {(order.igst_amount ?? 0) > 0 && (
            <div>
              <p className="text-xs text-zinc-500">IGST</p>
              <p className="text-zinc-200 font-medium">{fmt(order.igst_amount)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-zinc-500">TDS Applicable</p>
            <p className={`font-medium ${order.tds_applicable ? 'text-amber-400' : 'text-zinc-500'}`}>
              {order.tds_applicable ? `Yes — ${order.tds_rate}%` : 'No'}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Total TDS Deducted</p>
            <p className="text-sky-400 font-medium">{fmt(order.tds_deducted_total ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Net Received (Bank)</p>
            <p className="text-emerald-400 font-medium">{fmt(totalNet)}</p>
          </div>
        </div>
      </div>

      {/* Payment stages */}
      <div className={glass}>
        <div className="px-6 py-4 border-b border-zinc-800/60">
          <h2 className="text-sm font-semibold text-zinc-300">Payment Stages</h2>
        </div>
        {!stages.length ? (
          <p className="p-6 text-sm text-zinc-600">No payment stages defined.</p>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {/* Column headers */}
            <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_100px_80px] gap-4 px-6 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
              <span>Stage</span><span className="text-right">Base Due</span>
              <span className="text-right">GST</span><span className="text-right">TDS</span>
              <span className="text-right">Net Receivable</span><span className="text-center">Status</span><span></span>
            </div>

            {stages.map(s => (
              <div key={s.id}
                className="flex flex-col lg:grid lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_100px_80px] gap-2 lg:gap-4 px-6 py-4 items-start lg:items-center">
                <div>
                  <p className="text-sm font-medium text-zinc-200">{s.stage_name}</p>
                  {s.trigger_condition && (
                    <p className="text-xs text-zinc-500 mt-0.5">{s.trigger_condition}</p>
                  )}
                  {s.percentage && (
                    <p className="text-xs text-zinc-600 mt-0.5">{s.percentage}% of base</p>
                  )}
                  {s.due_date && (
                    <p className="text-xs text-zinc-600">Due: {fmtDate(s.due_date)}</p>
                  )}
                </div>
                <p className="text-sm text-right text-zinc-300">{fmt(s.amount_due)}</p>
                <p className="text-sm text-right text-zinc-300">{fmt(s.gst_on_stage ?? 0)}</p>
                <div className="text-right">
                  <p className="text-sm text-sky-400">{fmt(s.tds_amount ?? 0)}</p>
                  {s.tds_rate > 0 && <p className="text-[10px] text-zinc-600">{s.tds_rate}%</p>}
                </div>
                <p className="text-sm font-semibold text-right text-emerald-400">{fmt(s.net_receivable ?? 0)}</p>
                <div className="flex justify-center">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLE[s.status] ?? STATUS_STYLE.pending}`}>
                    {s.status}
                  </span>
                </div>
                <div>
                  <StageStatusButton stageId={s.id} orderId={id} currentStatus={s.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment history */}
      <div className={glass}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
          <h2 className="text-sm font-semibold text-zinc-300">Payment History</h2>
          <span className="text-xs text-zinc-600">{payments.length} records</span>
        </div>
        {!payments.length ? (
          <p className="p-6 text-sm text-zinc-600">No payments recorded yet.</p>
        ) : (
          <>
            <div className="hidden lg:grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-600 border-b border-zinc-800/60">
              <span>Date</span><span className="text-right">Gross Received</span>
              <span className="text-right">TDS</span><span className="text-right">Net to Bank</span>
              <span>Mode</span><span>Ref / Notes</span>
            </div>
            <div className="divide-y divide-zinc-800/60">
              {payments.map(p => (
                <div key={p.id}
                  className="flex flex-col lg:grid lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr] gap-2 lg:gap-4 px-6 py-4 text-sm items-start lg:items-center">
                  <p className="text-zinc-300">{fmtDate(p.payment_date)}</p>
                  <p className="text-right text-white font-semibold">{fmt(p.amount_received)}</p>
                  <p className="text-right text-sky-400">{fmt(p.tds_deducted ?? 0)}</p>
                  <p className="text-right text-emerald-400 font-semibold">{fmt(p.net_received ?? 0)}</p>
                  <p className="text-zinc-500">{p.payment_mode ?? '—'}</p>
                  <div className="min-w-0">
                    {p.reference_no && <p className="text-zinc-400 font-mono text-xs truncate">{p.reference_no}</p>}
                    {p.notes && <p className="text-zinc-600 text-xs truncate">{p.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Record payment */}
      {order.status !== 'completed' && order.status !== 'cancelled' && (
        <div className={glass}>
          <div className="px-6 py-4 border-b border-zinc-800/60">
            <h2 className="text-sm font-semibold text-zinc-300">Record Payment</h2>
          </div>
          <div className="p-6">
            <RecordPaymentForm orderId={id} stages={stages} defaultTdsRate={order.tds_rate ?? 0} />
          </div>
        </div>
      )}

      {order.notes && (
        <div className={`${glass} p-5`}>
          <p className="text-xs text-zinc-500 mb-2">Notes</p>
          <p className="text-sm text-zinc-400 leading-relaxed">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
