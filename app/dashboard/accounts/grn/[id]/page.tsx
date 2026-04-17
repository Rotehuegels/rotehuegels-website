import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardCheck, ArrowLeft, Building2, Truck, MapPin,
  FileText, Calendar, User, CheckCircle2, Clock, AlertCircle, XCircle, PackageCheck,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const STATUS_CONFIG: Record<string, { cls: string; icon: React.ElementType; label: string }> = {
  pending:   { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock, label: 'Pending Inspection' },
  inspected: { cls: 'bg-sky-500/10 text-sky-400 border-sky-500/20', icon: PackageCheck, label: 'Inspected' },
  accepted:  { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2, label: 'Accepted' },
  rejected:  { cls: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle, label: 'Rejected' },
  partial:   { cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: AlertCircle, label: 'Partial' },
};

export default async function GRNDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: grn, error } = await supabaseAdmin
    .from('goods_receipt_notes')
    .select('*, suppliers(legal_name, trade_name, gstin, address, state), purchase_orders(po_no, po_date, total_amount, supplier_ref, linked_order_id)')
    .eq('id', id)
    .single();

  if (error || !grn) return notFound();

  const { data: items } = await supabaseAdmin
    .from('grn_items')
    .select('*')
    .eq('grn_id', id)
    .order('created_at', { ascending: true });

  const supplier = grn.suppliers as {
    legal_name: string; trade_name: string; gstin: string; address: string; state: string;
  } | null;
  const po = grn.purchase_orders as {
    po_no: string; po_date: string; total_amount: number; supplier_ref: string; linked_order_id: string | null;
  } | null;

  const cfg = STATUS_CONFIG[grn.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  const totalOrdered = (items ?? []).reduce((s, it) => s + Number(it.ordered_qty ?? 0), 0);
  const totalReceived = (items ?? []).reduce((s, it) => s + Number(it.received_qty ?? 0), 0);
  const totalAccepted = (items ?? []).reduce((s, it) => s + Number(it.accepted_qty ?? 0), 0);
  const totalRejected = (items ?? []).reduce((s, it) => s + Number(it.rejected_qty ?? 0), 0);
  const totalValue = (items ?? []).reduce((s, it) => s + Number(it.accepted_qty ?? 0) * Number(it.unit_price ?? 0), 0);

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <Link href="/d/grn" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mb-2">
            <ArrowLeft className="h-3 w-3" /> All GRNs
          </Link>
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-6 w-6 text-emerald-400" />
            <div>
              <h1 className="text-2xl font-bold text-white font-mono">{grn.grn_no}</h1>
              <p className="mt-0.5 text-sm text-zinc-500">Goods Receipt Note · received {fmtDate(grn.receipt_date)}</p>
            </div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${cfg.cls}`}>
          <StatusIcon className="h-3.5 w-3.5" /> {cfg.label}
        </span>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Ordered', value: totalOrdered, color: 'text-zinc-300' },
          { label: 'Received', value: totalReceived, color: 'text-sky-400' },
          { label: 'Accepted', value: totalAccepted, color: 'text-emerald-400' },
          { label: 'Rejected', value: totalRejected, color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`${glass} p-4`}>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Two-column: metadata + supplier/PO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: receipt metadata */}
        <div className={`${glass} p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
            <FileText className="h-4 w-4 text-emerald-400" /> Receipt Details
          </h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-36 shrink-0 flex items-center gap-1"><Calendar className="h-3 w-3" />Receipt Date</dt>
              <dd className="text-zinc-200">{fmtDate(grn.receipt_date)}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-36 shrink-0 flex items-center gap-1"><User className="h-3 w-3" />Received By</dt>
              <dd className="text-zinc-200">{grn.received_by ?? '-'}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-36 shrink-0 flex items-center gap-1"><MapPin className="h-3 w-3" />Warehouse</dt>
              <dd className="text-zinc-200">{grn.warehouse_location ?? '-'}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-36 shrink-0 flex items-center gap-1"><Truck className="h-3 w-3" />Transporter</dt>
              <dd className="text-zinc-200">{grn.transporter ?? '-'}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-36 shrink-0">Vehicle No</dt>
              <dd className="text-zinc-200 font-mono">{grn.vehicle_no ?? '-'}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-36 shrink-0">Supplier DN Ref</dt>
              <dd className="text-zinc-200 font-mono">{grn.delivery_note_no ?? '-'}</dd>
            </div>
          </dl>
        </div>

        {/* Right: supplier + PO */}
        <div className={`${glass} p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
            <Building2 className="h-4 w-4 text-sky-400" /> Supplier & PO
          </h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-32 shrink-0">Supplier</dt>
              <dd className="text-zinc-200">{supplier?.legal_name ?? '-'}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-32 shrink-0">GSTIN</dt>
              <dd className="text-zinc-200 font-mono">{supplier?.gstin ?? '-'}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-32 shrink-0">State</dt>
              <dd className="text-zinc-200">{supplier?.state ?? '-'}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-32 shrink-0">Purchase Order</dt>
              <dd>
                {po ? (
                  <Link href={`/d/purchase-orders/${grn.po_id}`} className="text-rose-400 hover:text-rose-300 font-mono">
                    {po.po_no}
                  </Link>
                ) : '-'}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-32 shrink-0">PO Date</dt>
              <dd className="text-zinc-200">{fmtDate(po?.po_date ?? null)}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-32 shrink-0">PO Value</dt>
              <dd className="text-zinc-200">{po?.total_amount != null ? fmt(Number(po.total_amount)) : '-'}</dd>
            </div>
            {po?.linked_order_id && (
              <div className="flex gap-3">
                <dt className="text-zinc-500 w-32 shrink-0">Linked Sale</dt>
                <dd>
                  <Link href={`/d/orders/${po.linked_order_id}`} className="text-emerald-400 hover:text-emerald-300">
                    View customer order →
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Items table */}
      <div className={glass}>
        <div className="px-5 py-3 border-b border-zinc-800/60 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Items Received</h2>
          <span className="text-xs text-zinc-500">{(items ?? []).length} line{(items ?? []).length !== 1 ? 's' : ''} · value {fmt(totalValue)}</span>
        </div>
        {(items ?? []).length === 0 ? (
          <div className="p-10 text-center text-zinc-500 text-sm">No items on this GRN.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800/60">
                  <th className="px-5 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium">HSN</th>
                  <th className="px-3 py-2 font-medium text-right">Ordered</th>
                  <th className="px-3 py-2 font-medium text-right">Received</th>
                  <th className="px-3 py-2 font-medium text-right">Accepted</th>
                  <th className="px-3 py-2 font-medium text-right">Rate</th>
                  <th className="px-3 py-2 font-medium text-right">Value</th>
                  <th className="px-5 py-2 font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {(items ?? []).map(it => {
                  const v = Number(it.accepted_qty ?? 0) * Number(it.unit_price ?? 0);
                  return (
                    <tr key={it.id} className="hover:bg-zinc-800/20">
                      <td className="px-5 py-3 text-zinc-200 max-w-md">{it.description}</td>
                      <td className="px-3 py-3 font-mono text-xs text-zinc-400">{it.hsn_code ?? '-'}</td>
                      <td className="px-3 py-3 text-right text-zinc-300">{Number(it.ordered_qty ?? 0)} {it.unit ?? ''}</td>
                      <td className="px-3 py-3 text-right text-sky-400">{Number(it.received_qty ?? 0)}</td>
                      <td className="px-3 py-3 text-right text-emerald-400">{Number(it.accepted_qty ?? 0)}</td>
                      <td className="px-3 py-3 text-right text-zinc-300">{fmt(Number(it.unit_price ?? 0))}</td>
                      <td className="px-3 py-3 text-right text-zinc-200 font-medium">{fmt(v)}</td>
                      <td className="px-5 py-3 text-xs text-zinc-500 max-w-xs">{it.remarks ?? '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspection + notes */}
      {(grn.inspection_notes || grn.notes) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {grn.inspection_notes && (
            <div className={`${glass} p-5`}>
              <h3 className="text-sm font-semibold text-white mb-2">Inspection Notes</h3>
              <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">{grn.inspection_notes}</p>
            </div>
          )}
          {grn.notes && (
            <div className={`${glass} p-5`}>
              <h3 className="text-sm font-semibold text-white mb-2">General Notes</h3>
              <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">{grn.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
