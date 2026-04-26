import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import IndentActions from './IndentActions';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  draft:     'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  approved:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected:  'bg-red-500/10 text-red-400 border-red-500/20',
  converted: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  cancelled: 'bg-zinc-700/30 text-zinc-500 border-zinc-700/50',
};

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);

export default async function IndentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { id } = await params;
  const [{ data: indent }, { data: items }] = await Promise.all([
    supabaseAdmin
      .from('indents')
      .select('*, suppliers(legal_name, vendor_code), purchase_orders(po_no)')
      .eq('id', id)
      .single(),
    supabaseAdmin.from('indent_items').select('*').eq('indent_id', id).order('created_at'),
  ]);

  if (!indent) notFound();

  const totalEst = (items ?? []).reduce((s, it) => s + Number(it.estimated_total ?? 0), 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <Link href="/d/indents" className="text-sm text-zinc-500 hover:text-zinc-300">← Back to Indents</Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-rose-400" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white font-mono">{indent.indent_no}</h1>
            <p className="text-xs text-zinc-500">
              Requested by {indent.requested_by_email ?? 'unknown'} · {fmtDate(indent.created_at)}
              {indent.source === 'auto_low_stock' ? ' · auto-generated from low stock' : ''}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium capitalize ${STATUS_COLOR[indent.status] ?? STATUS_COLOR.draft}`}>
          {indent.status}
        </span>
      </div>

      {/* Action bar */}
      <IndentActions indentId={indent.id} status={indent.status} hasSupplier={!!indent.preferred_supplier_id} />

      {/* Header details */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300">Details</h2>
          <Field label="Department"     value={indent.department ?? '—'} />
          <Field label="Required by"    value={fmtDate(indent.required_by)} />
          <Field label="Priority"       value={indent.priority} />
          <Field label="Preferred supplier" value={
            indent.suppliers
              ? `${indent.suppliers.legal_name}${indent.suppliers.vendor_code ? ' (' + indent.suppliers.vendor_code + ')' : ''}`
              : 'Not set'
          } />
          {indent.justification && <Field label="Justification" value={indent.justification} />}
          {indent.notes && <Field label="Notes" value={indent.notes} />}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300">Approval & status</h2>
          {indent.approved_at && (
            <>
              <Field label="Approved by"  value={indent.approved_by_email ?? '—'} />
              <Field label="Approved on"  value={fmtDate(indent.approved_at)} />
            </>
          )}
          {indent.rejected_reason && <Field label="Rejection reason" value={indent.rejected_reason} />}
          {indent.purchase_orders && (
            <Field label="Converted to PO" value={
              <Link href="/d/purchase-orders" className="font-mono text-rose-400 hover:text-rose-300">
                {indent.purchase_orders.po_no}
              </Link>
            } />
          )}
          {!indent.approved_at && !indent.rejected_reason && !indent.purchase_orders && (
            <p className="text-xs text-zinc-600">No actions taken yet.</p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">#</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Item</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Qty</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">UoM</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Est. unit ₹</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Est. total</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((it, idx) => (
              <tr key={it.id} className="border-b border-zinc-800/60">
                <td className="px-5 py-3 text-xs text-zinc-500">{idx + 1}</td>
                <td className="px-5 py-3">
                  <div className="font-medium text-zinc-200">{it.item_name}</div>
                  {it.description && <div className="text-xs text-zinc-500 mt-0.5">{it.description}</div>}
                  {it.item_code && <div className="text-[10px] text-zinc-600 mt-0.5 font-mono">{it.item_code}</div>}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">{fmtINR(Number(it.qty))}</td>
                <td className="px-5 py-3 text-zinc-400">{it.uom ?? '—'}</td>
                <td className="px-5 py-3 text-right tabular-nums text-zinc-400">{it.estimated_unit_cost != null ? fmtINR(Number(it.estimated_unit_cost)) : '—'}</td>
                <td className="px-5 py-3 text-right tabular-nums">{fmtINR(Number(it.estimated_total ?? 0))}</td>
              </tr>
            ))}
            {!items?.length && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-zinc-500">No items</td></tr>
            )}
          </tbody>
          {(items?.length ?? 0) > 0 && (
            <tfoot>
              <tr className="bg-zinc-900/40">
                <td colSpan={5} className="px-5 py-3 text-right text-xs uppercase tracking-wider text-zinc-500">Estimated total</td>
                <td className="px-5 py-3 text-right font-semibold text-zinc-200 tabular-nums">₹ {fmtINR(totalEst)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm text-zinc-200 capitalize">{value}</p>
    </div>
  );
}
