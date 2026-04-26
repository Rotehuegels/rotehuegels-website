import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Receipt, AlertTriangle, CheckCircle2 } from 'lucide-react';
import InvoiceActions from './InvoiceActions';

export const dynamic = 'force-dynamic';

const MATCH_COLOR: Record<string, string> = {
  pending:        'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  matched:        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  price_variance: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  qty_variance:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  over_billed:    'bg-rose-500/10 text-rose-400 border-rose-500/20',
  under_billed:   'bg-sky-500/10 text-sky-400 border-sky-500/20',
  unmatched:      'bg-rose-500/10 text-rose-400 border-rose-500/20',
  overridden:     'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

const PAY_COLOR: Record<string, string> = {
  unpaid:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  partial: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  paid:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  on_hold: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const blocked = (s: string) => ['unmatched','over_billed','price_variance','qty_variance','pending'].includes(s);

export default async function PurchaseInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { id } = await params;
  const [{ data: inv }, { data: items }] = await Promise.all([
    supabaseAdmin
      .from('purchase_invoices')
      .select('*, suppliers(legal_name, vendor_code, gstin), purchase_orders(po_no, total_amount)')
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('purchase_invoice_items')
      .select('*, po_items(sl_no, quantity, unit_price)')
      .eq('invoice_id', id)
      .order('created_at'),
  ]);

  if (!inv) notFound();

  return (
    <div className="p-4 md:p-8 space-y-6">
      <Link href="/d/purchase-invoices" className="text-sm text-zinc-500 hover:text-zinc-300">← Back to Purchase Invoices</Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Receipt className="h-6 w-6 text-rose-400" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white font-mono">{inv.invoice_no}</h1>
            <p className="text-xs text-zinc-500">
              {inv.suppliers?.legal_name ?? '—'} · {fmtDate(inv.invoice_date)}
              {inv.purchase_orders?.po_no && (
                <> · against PO <span className="font-mono text-zinc-400">{inv.purchase_orders.po_no}</span></>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${MATCH_COLOR[inv.match_status] ?? MATCH_COLOR.pending}`}>
            {blocked(inv.match_status) ? <AlertTriangle className="h-3 w-3" /> : inv.match_status === 'matched' ? <CheckCircle2 className="h-3 w-3" /> : null}
            {inv.match_status.replace('_', ' ')}
          </span>
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium capitalize ${PAY_COLOR[inv.payment_status] ?? PAY_COLOR.unpaid}`}>
            {inv.payment_status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Action bar */}
      <InvoiceActions
        invoiceId={inv.id}
        matchStatus={inv.match_status}
        paymentStatus={inv.payment_status}
      />

      {/* Why blocked? */}
      {blocked(inv.match_status) && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
          <p className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Payment is on hold.</p>
          <p className="mt-1 text-xs text-rose-200/80">
            One or more lines failed the 3-way match. Either fix the PO / GRN / invoice to align, or click <strong>Override</strong> above with a written reason.
          </p>
        </div>
      )}
      {inv.match_notes && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-4 text-sm text-violet-200">
          <p className="text-[10px] uppercase tracking-wider text-violet-300 mb-1">Override / Hold note</p>
          <p>{inv.match_notes}</p>
        </div>
      )}

      {/* Header details */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300">Supplier &amp; dates</h2>
          <Field label="Supplier" value={
            <>
              {inv.suppliers?.legal_name}
              {inv.suppliers?.vendor_code && <span className="text-zinc-500 ml-1.5">({inv.suppliers.vendor_code})</span>}
            </>
          } />
          {inv.suppliers?.gstin && <Field label="GSTIN" value={inv.suppliers.gstin} />}
          <Field label="Invoice date"  value={fmtDate(inv.invoice_date)} />
          <Field label="Received"      value={fmtDate(inv.received_date)} />
          <Field label="Due"           value={fmtDate(inv.due_date)} />
          {inv.approved_by_email && (
            <>
              <Field label="Approved by" value={inv.approved_by_email} />
              <Field label="Approved on" value={fmtDate(inv.approved_at)} />
            </>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300">Amounts</h2>
          <Row label="Subtotal"      value={`₹ ${fmt(Number(inv.subtotal))}`} />
          <Row label="Taxable value" value={`₹ ${fmt(Number(inv.taxable_value))}`} />
          {Number(inv.igst_amount) > 0 && <Row label="IGST" value={`₹ ${fmt(Number(inv.igst_amount))}`} />}
          {Number(inv.cgst_amount) > 0 && <Row label="CGST" value={`₹ ${fmt(Number(inv.cgst_amount))}`} />}
          {Number(inv.sgst_amount) > 0 && <Row label="SGST" value={`₹ ${fmt(Number(inv.sgst_amount))}`} />}
          <div className="pt-2 border-t border-zinc-800">
            <Row label="Total" value={`₹ ${fmt(Number(inv.total_amount))}`} bold />
          </div>
          {inv.purchase_orders?.total_amount && (
            <p className="text-[11px] text-zinc-500 pt-1">
              PO total was <span className="tabular-nums">₹ {fmt(Number(inv.purchase_orders.total_amount))}</span>
            </p>
          )}
        </div>
      </div>

      {/* Line items with variance */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">#</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Description</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Qty</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">GRN qty</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Unit ₹</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">PO unit ₹</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Δ Price</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Δ Qty</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Match</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((it, idx) => {
              const dPrice = it.variance_price_pct;
              const dQty   = it.variance_qty_pct;
              return (
                <tr key={it.id} className="border-b border-zinc-800/60">
                  <td className="px-5 py-3 text-xs text-zinc-500">{idx + 1}</td>
                  <td className="px-5 py-3 text-zinc-200">{it.description}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{fmt(Number(it.quantity))}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-zinc-400">{fmt(Number(it.matched_grn_qty ?? 0))}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{fmt(Number(it.unit_price))}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-zinc-500">{it.po_items ? fmt(Number(it.po_items.unit_price)) : '—'}</td>
                  <td className={`px-5 py-3 text-right tabular-nums text-xs ${dPrice == null ? 'text-zinc-600' : Math.abs(Number(dPrice)) > 0.001 ? (Number(dPrice) > 0 ? 'text-rose-400' : 'text-emerald-400') : 'text-zinc-500'}`}>
                    {dPrice == null ? '—' : (Number(dPrice) > 0 ? '+' : '') + Number(dPrice).toFixed(2) + '%'}
                  </td>
                  <td className={`px-5 py-3 text-right tabular-nums text-xs ${dQty == null ? 'text-zinc-600' : Math.abs(Number(dQty)) > 0.001 ? (Number(dQty) > 0 ? 'text-rose-400' : 'text-emerald-400') : 'text-zinc-500'}`}>
                    {dQty == null ? '—' : (Number(dQty) > 0 ? '+' : '') + Number(dQty).toFixed(2) + '%'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] capitalize ${MATCH_COLOR[it.match_status] ?? MATCH_COLOR.pending}`}>
                      {it.match_status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              );
            })}
            {!items?.length && (
              <tr><td colSpan={9} className="px-5 py-8 text-center text-sm text-zinc-500">No line items.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm text-zinc-200">{value}</p>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className={`tabular-nums ${bold ? 'font-bold text-white' : 'text-zinc-200'}`}>{value}</span>
    </div>
  );
}
