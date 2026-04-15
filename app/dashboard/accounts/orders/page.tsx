import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { Plus, ShoppingBag, Wrench } from 'lucide-react';
import { Suspense } from 'react';
import OrdersFilterBar from './OrdersFilterBar';
import Pagination from '../Pagination';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const PAGE_SIZE = 25;

export default async function OrdersListPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  const statusFilter = typeof sp.status === 'string' ? sp.status : 'all';
  const typeFilter = typeof sp.type === 'string' ? sp.type : 'all';
  const page = Math.max(1, parseInt(typeof sp.page === 'string' ? sp.page : '1', 10) || 1);

  // Build the query for total count (with filters)
  let countQuery = supabaseAdmin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .neq('order_category', 'reimbursement');

  if (statusFilter !== 'all') {
    countQuery = countQuery.eq('status', statusFilter);
  } else {
    countQuery = countQuery.neq('status', 'cancelled');
  }

  if (typeFilter !== 'all') {
    countQuery = countQuery.eq('order_type', typeFilter);
  }

  if (q) {
    countQuery = countQuery.or(`order_no.ilike.%${q}%,client_name.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { count: totalCount } = await countQuery;
  const total = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Build the data query
  let dataQuery = supabaseAdmin
    .from('orders')
    .select('id, order_no, order_type, order_category, client_name, description, order_date, entry_date, total_value_incl_gst, base_value, tds_deducted_total, status')
    .neq('order_category', 'reimbursement');

  if (statusFilter !== 'all') {
    dataQuery = dataQuery.eq('status', statusFilter);
  } else {
    dataQuery = dataQuery.neq('status', 'cancelled');
  }

  if (typeFilter !== 'all') {
    dataQuery = dataQuery.eq('order_type', typeFilter);
  }

  if (q) {
    dataQuery = dataQuery.or(`order_no.ilike.%${q}%,client_name.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data: orders } = await dataQuery
    .order('order_no', { ascending: true })
    .range(from, to);

  const ids = (orders ?? []).map(o => o.id);
  const { data: payments } = ids.length
    ? await supabaseAdmin.from('order_payments').select('order_id, amount_received').in('order_id', ids)
    : { data: [] };

  const pmtMap: Record<string, number> = {};
  for (const p of payments ?? []) {
    pmtMap[p.order_id] = (pmtMap[p.order_id] ?? 0) + (p.amount_received ?? 0);
  }

  const enriched = (orders ?? []).map(o => ({
    ...o,
    received: pmtMap[o.id] ?? 0,
    pending: (o.total_value_incl_gst ?? 0) - (pmtMap[o.id] ?? 0),
  }));

  // Totals for the current filtered set (use all matching records, not just current page)
  // For performance we compute totals from the full filtered query
  let totalsQuery = supabaseAdmin
    .from('orders')
    .select('id, total_value_incl_gst, tds_deducted_total, order_category')
    .neq('order_category', 'reimbursement');

  if (statusFilter !== 'all') {
    totalsQuery = totalsQuery.eq('status', statusFilter);
  } else {
    totalsQuery = totalsQuery.neq('status', 'cancelled');
  }

  if (typeFilter !== 'all') {
    totalsQuery = totalsQuery.eq('order_type', typeFilter);
  }

  if (q) {
    totalsQuery = totalsQuery.or(`order_no.ilike.%${q}%,client_name.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data: allFiltered } = await totalsQuery;
  const allIds = (allFiltered ?? []).map(o => o.id);
  const { data: allPayments } = allIds.length
    ? await supabaseAdmin.from('order_payments').select('order_id, amount_received').in('order_id', allIds)
    : { data: [] };

  const allPmtMap: Record<string, number> = {};
  for (const p of allPayments ?? []) {
    allPmtMap[p.order_id] = (allPmtMap[p.order_id] ?? 0) + (p.amount_received ?? 0);
  }

  const billable = (allFiltered ?? []).filter(o => o.order_category !== 'complimentary');
  const totalBook = billable.reduce((s, o) => s + (o.total_value_incl_gst ?? 0), 0);
  const totalReceived = billable.reduce((s, o) => s + (allPmtMap[o.id] ?? 0), 0);
  const totalPending = totalBook - totalReceived;
  const totalTds = billable.reduce((s, o) => s + (o.tds_deducted_total ?? 0), 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Orders</h1>
          <p className="mt-1 text-sm text-zinc-400">{total} total orders</p>
        </div>
        <Link href="/d/orders/new"
          className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 transition-colors">
          <Plus className="h-4 w-4" /> New Order
        </Link>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Order Book', value: totalBook, color: 'text-amber-400' },
          { label: 'Received', value: totalReceived, color: 'text-emerald-400' },
          { label: 'Pending', value: totalPending, color: 'text-rose-400' },
          { label: 'TDS Deducted', value: totalTds, color: 'text-sky-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`${glass} p-4`}>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className={`text-lg font-black mt-1 ${color}`}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <Suspense fallback={null}>
        <OrdersFilterBar />
      </Suspense>

      {/* Orders table */}
      <div className={glass}>
        {!enriched.length ? (
          <div className="p-12 text-center">
            <p className="text-zinc-500 text-sm">No orders found.</p>
            <Link href="/d/orders/new"
              className="mt-4 inline-block rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 transition-colors">
              Create first order
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="hidden lg:grid grid-cols-[120px_1fr_130px_130px_130px_90px_80px] gap-4 px-6 py-3 border-b border-zinc-800/60 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
              <span>Order</span><span>Client / Description</span>
              <span className="text-right">Total</span><span className="text-right">Received</span>
              <span className="text-right">Pending</span><span className="text-right">Status</span><span></span>
            </div>

            <div className="divide-y divide-zinc-800/60">
              {enriched.map(o => (
                <div key={o.id}
                  className="flex flex-col lg:grid lg:grid-cols-[120px_1fr_130px_130px_130px_90px_80px] gap-2 lg:gap-4 px-6 py-4 hover:bg-zinc-800/20 transition-colors items-start lg:items-center">
                  <div>
                    <p className="text-sm font-mono font-semibold text-amber-400">{o.order_no}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {o.order_type === 'service'
                        ? <Wrench className="h-3 w-3 text-sky-400" />
                        : <ShoppingBag className="h-3 w-3 text-violet-400" />}
                      <span className={`text-[10px] capitalize font-medium ${o.order_type === 'service' ? 'text-sky-400' : 'text-violet-400'}`}>
                        {o.order_type}
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{o.client_name}</p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{o.description}</p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">
                      Received {new Date(o.order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="text-right">
                    {o.order_category === 'complimentary'
                      ? <span className="text-xs font-medium text-violet-400">Complimentary</span>
                      : <p className="text-sm font-semibold text-white">{fmt(o.total_value_incl_gst)}</p>
                    }
                  </div>
                  <div className="text-right">
                    {o.order_category !== 'complimentary' && (
                      <p className="text-sm font-semibold text-emerald-400">{fmt(o.received)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {o.order_category !== 'complimentary' && (
                      <p className={`text-sm font-semibold ${o.pending > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {fmt(o.pending)}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLE[o.status] ?? STATUS_STYLE.active}`}>
                      {o.status}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/d/orders/${o.id}/invoice`}
                      className="rounded-lg bg-amber-600/80 hover:bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors">
                      Invoice
                    </Link>
                    <Link href={`/d/orders/${o.id}`}
                      className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 transition-colors">
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <Suspense fallback={null}>
              <Pagination page={safePage} totalPages={totalPages} basePath="/dashboard/accounts/orders" />
            </Suspense>
          </>
        )}
      </div>
    </div>
  );
}
