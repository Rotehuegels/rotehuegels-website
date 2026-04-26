import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Receipt, AlertTriangle, CheckCircle2 } from 'lucide-react';

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

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default async function PurchaseInvoicesPage({
  searchParams,
}: { searchParams: Promise<{ match_status?: string; payment_status?: string }> }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/d/purchase-invoices');

  const sp = await searchParams;

  let q = supabaseAdmin
    .from('purchase_invoices')
    .select(`
      id, invoice_no, invoice_date, due_date, total_amount,
      match_status, payment_status, created_at,
      suppliers(legal_name, vendor_code),
      purchase_orders(po_no)
    `)
    .order('created_at', { ascending: false });

  if (sp.match_status)   q = q.eq('match_status',   sp.match_status);
  if (sp.payment_status) q = q.eq('payment_status', sp.payment_status);

  const { data: invoices } = await q;

  // Counts for filter chips
  const { data: countAll } = await supabaseAdmin.from('purchase_invoices').select('match_status, payment_status');
  const matchCounts: Record<string, number> = { all: 0, matched: 0, price_variance: 0, qty_variance: 0, over_billed: 0, unmatched: 0, overridden: 0, pending: 0 };
  const payCounts: Record<string, number> = { all: 0, unpaid: 0, partial: 0, paid: 0, on_hold: 0 };
  for (const r of countAll ?? []) {
    matchCounts.all++;
    payCounts.all++;
    matchCounts[r.match_status as string] = (matchCounts[r.match_status as string] ?? 0) + 1;
    payCounts[r.payment_status as string] = (payCounts[r.payment_status as string] ?? 0) + 1;
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Receipt className="h-6 w-6 text-rose-400" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Purchase Invoices</h1>
            <p className="text-xs text-zinc-500">Three-way match (PO ↔ GRN ↔ Invoice). Mismatches block payment.</p>
          </div>
        </div>
        <Link href="/d/purchase-invoices/new"
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition-colors">
          <Plus className="h-4 w-4" /> Book Invoice
        </Link>
      </div>

      {/* Match-status filter row */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Match status</p>
        <div className="flex flex-wrap gap-2">
          {(['all', 'matched', 'price_variance', 'qty_variance', 'over_billed', 'unmatched', 'overridden', 'pending'] as const).map((s) => (
            <Link key={s} href={s === 'all' ? '/d/purchase-invoices' : `/d/purchase-invoices?match_status=${s}`}
              className={[
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs capitalize transition-colors',
                sp.match_status === s || (!sp.match_status && s === 'all')
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                  : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-white',
              ].join(' ')}>
              {s.replace('_', ' ')} <span className="text-[10px] opacity-60">({matchCounts[s] ?? 0})</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Invoice</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Supplier</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">PO</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Inv. date</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Amount</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Match</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Payment</th>
            </tr>
          </thead>
          <tbody>
            {(invoices ?? []).map((i) => {
              const blocked = ['unmatched','over_billed','price_variance','qty_variance','pending'].includes(i.match_status);
              const supplier = i.suppliers as { legal_name?: string; vendor_code?: string } | null;
              const po       = i.purchase_orders as { po_no?: string } | null;
              return (
                <tr key={i.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/40">
                  <td className="px-5 py-3 font-mono text-xs">
                    <Link href={`/d/purchase-invoices/${i.id}`} className="text-rose-400 hover:text-rose-300">{i.invoice_no}</Link>
                  </td>
                  <td className="px-5 py-3 text-zinc-300">
                    {supplier?.legal_name ?? '—'}
                    {supplier?.vendor_code && <span className="text-zinc-600 ml-1.5">({supplier.vendor_code})</span>}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-zinc-400">{po?.po_no ?? '—'}</td>
                  <td className="px-5 py-3 text-xs text-zinc-400">{fmtDate(i.invoice_date)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">₹ {fmt(Number(i.total_amount))}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${MATCH_COLOR[i.match_status] ?? MATCH_COLOR.pending}`}>
                      {blocked ? <AlertTriangle className="h-3 w-3" /> : i.match_status === 'matched' ? <CheckCircle2 className="h-3 w-3" /> : null}
                      {i.match_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${PAY_COLOR[i.payment_status] ?? PAY_COLOR.unpaid}`}>
                      {i.payment_status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              );
            })}
            {!invoices?.length && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-zinc-500">No purchase invoices yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
