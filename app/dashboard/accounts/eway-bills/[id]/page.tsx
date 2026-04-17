import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  FileCheck, ArrowLeft, Building2, Truck, MapPin,
  FileText, Calendar, Package, CheckCircle2, Clock, AlertCircle, XCircle, AlertTriangle,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const fmtDateTime = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

function hoursUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return (new Date(iso).getTime() - Date.now()) / 3_600_000;
}

const STATUS_CONFIG: Record<string, { cls: string; icon: React.ElementType; label: string }> = {
  draft:     { cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Clock, label: 'Draft' },
  generated: { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2, label: 'Generated' },
  cancelled: { cls: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle, label: 'Cancelled' },
  expired:   { cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: AlertCircle, label: 'Expired' },
};

export default async function EWBDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: ewb, error } = await supabaseAdmin
    .from('eway_bills')
    .select('*, orders(order_no, client_name, client_gstin, total_value_incl_gst)')
    .eq('id', id)
    .single();

  if (error || !ewb) return notFound();

  const order = ewb.orders as { order_no: string; client_name: string; client_gstin: string; total_value_incl_gst: number } | null;

  const cfg = STATUS_CONFIG[ewb.status] ?? STATUS_CONFIG.draft;
  const StatusIcon = cfg.icon;

  const partBFiled = Boolean(ewb.vehicle_no);
  const hoursLeft = hoursUntil(ewb.valid_upto);
  const isExpired = ewb.status === 'generated' && partBFiled && hoursLeft !== null && hoursLeft < 0;
  const expiringSoon = ewb.status === 'generated' && partBFiled && hoursLeft !== null && hoursLeft >= 0 && hoursLeft < 6;

  const displayStatus = ewb.status === 'generated' && !partBFiled
    ? { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock, label: 'Part A only — Part B pending' }
    : isExpired
      ? { cls: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle, label: 'Expired' }
      : ewb.status === 'generated' && partBFiled
        ? { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2, label: 'Valid (Part A + B)' }
        : cfg;
  const DisplayIcon = displayStatus.icon;

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <Link href="/d/eway-bills" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mb-2">
            <ArrowLeft className="h-3 w-3" /> All E-Way Bills
          </Link>
          <div className="flex items-center gap-3">
            <FileCheck className="h-6 w-6 text-rose-400" />
            <div>
              <h1 className="text-2xl font-bold text-white font-mono">{ewb.eway_bill_no ?? 'DRAFT'}</h1>
              <p className="mt-0.5 text-sm text-zinc-500">E-Way Bill · {ewb.doc_type} {ewb.doc_no} · {fmtDate(ewb.doc_date)}</p>
            </div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${displayStatus.cls}`}>
          <DisplayIcon className="h-3.5 w-3.5" /> {displayStatus.label}
        </span>
      </div>

      {/* Expiry banner */}
      {(expiringSoon || isExpired) && (
        <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${isExpired ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">
              {isExpired ? 'This EWB has expired.' : `Expires in ~${Math.round(hoursLeft!)} hours.`}
            </p>
            <p className="text-xs mt-0.5 opacity-80">
              {isExpired
                ? 'The goods cannot move on this document. Either extend validity on the portal or regenerate for the remaining movement.'
                : 'Consider extending validity on ewaybillgst.gov.in if the consignment is still in transit.'}
            </p>
          </div>
        </div>
      )}

      {/* Part A / Part B status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`${glass} p-5`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">Part A (Document + Parties + Items)</h3>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
              <CheckCircle2 className="h-3 w-3" /> Filed
            </span>
          </div>
          <p className="text-xs text-zinc-500">Generated {fmtDateTime(ewb.generated_at)}</p>
        </div>
        <div className={`${glass} p-5`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">Part B (Vehicle + Transport)</h3>
            {partBFiled ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                <CheckCircle2 className="h-3 w-3" /> Filed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
                <Clock className="h-3 w-3" /> Pending
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500">
            {partBFiled
              ? `Vehicle ${ewb.vehicle_no}${ewb.transporter_name ? ' · ' + ewb.transporter_name : ''}`
              : 'Goods cannot legally move until Part B is entered on the portal'}
          </p>
        </div>
      </div>

      {/* Two-column metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Document + Value */}
        <div className={`${glass} p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
            <FileText className="h-4 w-4 text-rose-400" /> Document & Value
          </h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-40 shrink-0">Document Type</dt>
              <dd className="text-zinc-200">{ewb.doc_type ?? '-'}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-40 shrink-0">Document No.</dt>
              <dd className="text-zinc-200 font-mono">{ewb.doc_no ?? '-'}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-40 shrink-0">Document Date</dt>
              <dd className="text-zinc-200">{fmtDate(ewb.doc_date)}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-40 shrink-0">Transaction</dt>
              <dd className="text-zinc-200">{ewb.supply_type} / {ewb.sub_supply_type}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-40 shrink-0">Taxable Value</dt>
              <dd className="text-zinc-200">{fmt(Number(ewb.taxable_value ?? 0))}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-40 shrink-0">CGST / SGST</dt>
              <dd className="text-zinc-200">{fmt(Number(ewb.cgst_amount ?? 0))} · {fmt(Number(ewb.sgst_amount ?? 0))}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-40 shrink-0">IGST / Cess</dt>
              <dd className="text-zinc-200">{fmt(Number(ewb.igst_amount ?? 0))} · {fmt(Number(ewb.cess_amount ?? 0))}</dd>
            </div>
            <div className="flex gap-3 pt-2 border-t border-zinc-800/60">
              <dt className="text-zinc-400 w-40 shrink-0 font-medium">Total Invoice Value</dt>
              <dd className="text-white font-bold">{fmt(Number(ewb.total_value ?? 0))}</dd>
            </div>
            {order && (
              <div className="flex gap-3 pt-2 border-t border-zinc-800/60">
                <dt className="text-zinc-500 w-40 shrink-0">Linked Order</dt>
                <dd>
                  <Link href={`/d/orders/${ewb.order_id}`} className="text-emerald-400 hover:text-emerald-300 font-mono">
                    {order.order_no} →
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Right: Transport + Validity */}
        <div className={`${glass} p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
            <Truck className="h-4 w-4 text-sky-400" /> Transport
          </h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-36 shrink-0">Mode</dt>
              <dd className="text-zinc-200">{ewb.transport_mode ?? '-'}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-36 shrink-0">Vehicle No.</dt>
              <dd className="text-zinc-200 font-mono">
                {ewb.vehicle_no ?? (
                  <span className="text-amber-400 font-normal">Pending Part B</span>
                )}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-36 shrink-0">Vehicle Type</dt>
              <dd className="text-zinc-200">{ewb.vehicle_type ?? '-'}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-36 shrink-0">Transporter</dt>
              <dd className="text-zinc-200">{ewb.transporter_name ?? '-'}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-36 shrink-0">Transporter ID</dt>
              <dd className="text-zinc-200 font-mono text-xs">{ewb.transporter_id ?? '-'}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-36 shrink-0">Distance (km)</dt>
              <dd className="text-zinc-200">{ewb.distance_km ?? '-'}</dd>
            </div>
            <div className="flex gap-3 pt-2 border-t border-zinc-800/60">
              <dt className="text-zinc-500 w-36 shrink-0 flex items-center gap-1"><Calendar className="h-3 w-3" />Generated</dt>
              <dd className="text-zinc-200">{fmtDateTime(ewb.generated_at)}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-36 shrink-0">Valid Upto</dt>
              <dd className={isExpired ? 'text-red-400' : expiringSoon ? 'text-amber-400' : 'text-zinc-200'}>
                {partBFiled ? fmtDateTime(ewb.valid_upto) : <span className="italic text-zinc-600">Starts after Part B</span>}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* From / To */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`${glass} p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
            <Building2 className="h-4 w-4 text-emerald-400" /> From
          </h2>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-zinc-500 text-xs">GSTIN</dt><dd className="text-zinc-200 font-mono">{ewb.from_gstin ?? '-'}</dd></div>
            <div><dt className="text-zinc-500 text-xs">Name</dt><dd className="text-zinc-200">{ewb.from_name ?? '-'}</dd></div>
            <div><dt className="text-zinc-500 text-xs">Dispatch From</dt>
              <dd className="text-zinc-200 flex items-start gap-1">
                <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-zinc-500" />
                <span>{[ewb.from_address, ewb.from_place, ewb.from_pincode].filter(Boolean).join(', ')}</span>
              </dd>
            </div>
          </dl>
        </div>
        <div className={`${glass} p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
            <Building2 className="h-4 w-4 text-rose-400" /> To
          </h2>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-zinc-500 text-xs">GSTIN</dt><dd className="text-zinc-200 font-mono">{ewb.to_gstin ?? '-'}</dd></div>
            <div><dt className="text-zinc-500 text-xs">Name</dt><dd className="text-zinc-200">{ewb.to_name ?? '-'}</dd></div>
            <div><dt className="text-zinc-500 text-xs">Ship To</dt>
              <dd className="text-zinc-200 flex items-start gap-1">
                <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-zinc-500" />
                <span>{[ewb.to_address, ewb.to_place, ewb.to_pincode].filter(Boolean).join(', ')}</span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Item details */}
      <div className={`${glass} p-5`}>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
          <Package className="h-4 w-4 text-amber-400" /> Item Details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><p className="text-[11px] text-zinc-500">HSN</p><p className="font-mono text-zinc-200">{ewb.hsn_code ?? '-'}</p></div>
          <div><p className="text-[11px] text-zinc-500">Quantity</p><p className="text-zinc-200">{ewb.quantity ?? '-'} {ewb.unit ?? ''}</p></div>
          <div><p className="text-[11px] text-zinc-500">Taxable</p><p className="text-zinc-200">{fmt(Number(ewb.taxable_value ?? 0))}</p></div>
          <div><p className="text-[11px] text-zinc-500">Total</p><p className="text-zinc-200 font-bold">{fmt(Number(ewb.total_value ?? 0))}</p></div>
        </div>
        {ewb.description && (
          <div className="mt-3 pt-3 border-t border-zinc-800/60">
            <p className="text-[11px] text-zinc-500 mb-1">Description</p>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{ewb.description}</p>
          </div>
        )}
      </div>

      {/* Notes */}
      {ewb.notes && (
        <div className={`${glass} p-5`}>
          <h3 className="text-sm font-semibold text-white mb-2">Notes</h3>
          <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">{ewb.notes}</p>
        </div>
      )}

      {/* Cancellation info */}
      {ewb.status === 'cancelled' && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <h3 className="text-sm font-semibold text-red-300 mb-1">Cancelled</h3>
          <p className="text-xs text-red-200/80">On {fmtDateTime(ewb.cancelled_at)} — {ewb.cancel_reason ?? 'no reason recorded'}</p>
        </div>
      )}
    </div>
  );
}
