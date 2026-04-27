import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, FileText, ArrowDownLeft, ArrowUpRight, Calendar, Building2,
  Hash, ReceiptText, AlertCircle,
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

export default async function CreditDebitNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: note, error } = await supabaseAdmin
    .from('credit_debit_notes')
    .select('*, orders(id, order_no, client_name)')
    .eq('id', id)
    .single();

  if (error || !note) notFound();

  const isCredit = note.note_type === 'credit';
  const TypeIcon = isCredit ? ArrowDownLeft : ArrowUpRight;
  const order = note.orders as { id: string; order_no: string; client_name: string } | null;

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-[1800px]">
      {/* Header */}
      <div>
        <Link href="/d/credit-notes"
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-3 transition-colors">
          <ArrowLeft className="h-3 w-3" /> Credit & Debit Notes
        </Link>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <FileText className={`h-6 w-6 ${isCredit ? 'text-emerald-400' : 'text-amber-400'}`} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white font-mono">{note.note_no}</h1>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                  isCredit ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  <TypeIcon className="h-3 w-3" /> {note.note_type} note
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {fmtDate(note.note_date)}
                {note.original_invoice && (
                  <> · against invoice <span className="font-mono text-zinc-400">{note.original_invoice}</span></>
                )}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${STATUS_COLOR[note.status] ?? STATUS_COLOR.draft}`}>
            {note.status}
          </span>
        </div>
      </div>

      {/* Two-column metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`${glass} p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
            <Building2 className="h-4 w-4 text-violet-400" /> Counterparty
          </h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-32 shrink-0">Name</dt>
              <dd className="text-zinc-200">{note.party_name}</dd>
            </div>
            {note.party_gstin && (
              <div className="flex gap-3">
                <dt className="text-zinc-500 w-32 shrink-0 flex items-center gap-1"><Hash className="h-3 w-3" /> GSTIN</dt>
                <dd className="text-zinc-200 font-mono">{note.party_gstin}</dd>
              </div>
            )}
            {note.party_address && (
              <div className="flex gap-3">
                <dt className="text-zinc-500 w-32 shrink-0">Address</dt>
                <dd className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{note.party_address}</dd>
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
            <Calendar className="h-4 w-4 text-sky-400" /> Reason & Reference
          </h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex gap-3">
              <dt className="text-zinc-500 w-32 shrink-0">Reason</dt>
              <dd className="text-zinc-200">{note.reason}</dd>
            </div>
            {note.original_invoice && (
              <div className="flex gap-3">
                <dt className="text-zinc-500 w-32 shrink-0">Original invoice</dt>
                <dd className="text-zinc-200 font-mono">{note.original_invoice}</dd>
              </div>
            )}
            {note.hsn_code && (
              <div className="flex gap-3">
                <dt className="text-zinc-500 w-32 shrink-0">HSN code</dt>
                <dd className="text-zinc-200 font-mono">{note.hsn_code}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Financial summary */}
      <div className={`${glass} p-5`}>
        <h2 className="text-sm font-semibold text-white mb-4">Financial breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Stat label="Taxable value" value={fmt(Number(note.taxable_value ?? 0))} />
          <Stat label={`GST (${Number(note.gst_rate ?? 0)}%)`}
                value={fmt(Number(note.cgst_amount ?? 0) + Number(note.sgst_amount ?? 0) + Number(note.igst_amount ?? 0))} />
          <Stat label="CGST + SGST"
                value={fmt(Number(note.cgst_amount ?? 0) + Number(note.sgst_amount ?? 0))} muted />
          <Stat label="IGST" value={fmt(Number(note.igst_amount ?? 0))} muted />
        </div>
        <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Total {isCredit ? 'credited' : 'debited'}</span>
          <span className={`text-xl font-bold ${isCredit ? 'text-emerald-400' : 'text-amber-400'}`}>
            {fmt(Number(note.total_value ?? 0))}
          </span>
        </div>
      </div>

      {note.notes && (
        <div className={`${glass} p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
            <AlertCircle className="h-4 w-4 text-zinc-400" /> Notes
          </h2>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{note.notes}</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className={`text-base font-semibold mt-1 ${muted ? 'text-zinc-400' : 'text-zinc-100'}`}>{value}</p>
    </div>
  );
}
