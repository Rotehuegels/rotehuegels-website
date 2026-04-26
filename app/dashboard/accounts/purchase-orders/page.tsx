import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, ShoppingCart } from 'lucide-react';
import { Suspense } from 'react';
import POFilterBar from './POFilterBar';
import Pagination from '../Pagination';
import IfCan from '@/components/IfCan';

export const dynamic = 'force-dynamic';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_COLOR: Record<string, string> = {
  draft:        'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  sent:         'bg-blue-500/10 text-blue-400 border-blue-500/20',
  acknowledged: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  partial:      'bg-amber-500/10 text-amber-400 border-amber-500/20',
  received:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed:       'bg-teal-500/10 text-teal-400 border-teal-500/20',
  cancelled:    'bg-red-500/10 text-red-400 border-red-500/20',
};

const PAGE_SIZE = 25;

export default async function PurchaseOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard/accounts/purchase-orders');

  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  const statusFilter = typeof sp.status === 'string' ? sp.status : 'all';
  const page = Math.max(1, parseInt(typeof sp.page === 'string' ? sp.page : '1', 10) || 1);

  // We need to fetch with joins, then filter in-memory for supplier name search
  // because Supabase doesn't support .or() across joined tables easily.
  const { data: allPos } = await supabaseAdmin
    .from('purchase_orders')
    .select(`
      id, po_no, po_date, status, total_amount, supplier_ref, created_at,
      suppliers(legal_name, state),
      orders(order_no, client_name)
    `)
    .order('po_date', { ascending: false });

  let filtered = allPos ?? [];

  // Status filter
  if (statusFilter !== 'all') {
    filtered = filtered.filter(po => po.status === statusFilter);
  }

  // Search filter
  if (q) {
    const lower = q.toLowerCase();
    filtered = filtered.filter(po => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supplier = po.suppliers as any;
      const supplierName = supplier?.legal_name ?? '';
      return (
        (po.po_no ?? '').toLowerCase().includes(lower) ||
        supplierName.toLowerCase().includes(lower)
      );
    });
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const fromIdx = (safePage - 1) * PAGE_SIZE;
  const list = filtered.slice(fromIdx, fromIdx + PAGE_SIZE);

  // Get total paid per PO
  const ids = filtered.map(p => p.id);
  const paidMap: Record<string, number> = {};
  if (ids.length) {
    const { data: pmts } = await supabaseAdmin
      .from('po_payments')
      .select('po_id, amount')
      .in('po_id', ids);
    for (const p of pmts ?? []) {
      paidMap[p.po_id] = (paidMap[p.po_id] ?? 0) + p.amount;
    }
  }

  const totalValue = filtered.reduce((s, p) => s + (p.total_amount ?? 0), 0);
  const totalPaid  = Object.values(paidMap).reduce((s, v) => s + v, 0);

  return (
    <div className="p-6 max-w-[1800px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Purchase Orders</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {total} PO{total !== 1 ? 's' : ''} · Total {fmt(totalValue)} · Paid {fmt(totalPaid)}
          </p>
        </div>
        <IfCan permission="procurement.create">
          <Link
            href="/d/purchase-orders/new"
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 transition-colors"
          >
            <Plus className="h-4 w-4" /> New PO
          </Link>
        </IfCan>
      </div>

      {/* Filter bar */}
      <div className="mb-6">
        <Suspense fallback={null}>
          <POFilterBar />
        </Suspense>
      </div>

      {!list.length ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
          <ShoppingCart className="mx-auto h-8 w-8 text-zinc-700 mb-3" />
          <p className="text-zinc-500 text-sm">No purchase orders found.</p>
          <Link href="/d/purchase-orders/new"
            className="mt-3 inline-block text-amber-400 text-sm hover:underline">
            Create your first PO
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">PO No</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Supplier</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Linked Order</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Total</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Paid</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Balance</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {list.map(po => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const supplier = po.suppliers as any;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const order    = po.orders as any;
                const paid     = paidMap[po.id] ?? 0;
                const balance  = (po.total_amount ?? 0) - paid;
                return (
                  <tr key={po.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-amber-400 font-semibold">{po.po_no}</span>
                      <div className="text-[11px] text-zinc-500 mt-0.5">{fmtDate(po.po_date)}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-white text-sm">{supplier?.legal_name ?? '—'}</div>
                      {supplier?.state && (
                        <div className="text-xs text-zinc-500">{supplier.state}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {order ? (
                        <div>
                          <span className="font-mono text-xs text-sky-400">{order.order_no}</span>
                          <div className="text-xs text-zinc-500 truncate max-w-[120px]">{order.client_name}</div>
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-sm text-white">
                      {fmt(po.total_amount ?? 0)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-sm text-emerald-400">
                      {fmt(paid)}
                    </td>
                    <td className={`px-5 py-3.5 text-right font-mono text-sm ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {fmt(balance)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize border ${STATUS_COLOR[po.status] ?? STATUS_COLOR.draft}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/d/purchase-orders/${po.id}`}
                        className="text-xs text-amber-400 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <Suspense fallback={null}>
            <Pagination page={safePage} totalPages={totalPages} basePath="/dashboard/accounts/purchase-orders" />
          </Suspense>
        </div>
      )}
    </div>
  );
}
