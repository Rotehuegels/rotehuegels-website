import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { Plus, ShoppingBag, Wrench } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default async function OrdersListPage() {
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, order_no, order_type, client_name, description, order_date, entry_date, total_value_incl_gst, base_value, tds_deducted_total, status')
    .order('created_at', { ascending: false });

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

  // Totals
  const totalBook = enriched.reduce((s, o) => s + o.total_value_incl_gst, 0);
  const totalReceived = enriched.reduce((s, o) => s + o.received, 0);
  const totalPending = enriched.reduce((s, o) => s + o.pending, 0);
  const totalTds = enriched.reduce((s, o) => s + (o.tds_deducted_total ?? 0), 0);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="mt-1 text-sm text-zinc-400">{enriched.length} total orders</p>
        </div>
        <Link href="/dashboard/accounts/orders/new"
          className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 transition-colors">
          <Plus className="h-4 w-4" /> New Order
        </Link>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Orders table */}
      <div className={glass}>
        {!enriched.length ? (
          <div className="p-12 text-center">
            <p className="text-zinc-500 text-sm">No orders yet.</p>
            <Link href="/dashboard/accounts/orders/new"
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
                    <p className="text-sm font-semibold text-white">{fmt(o.total_value_incl_gst)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-400">{fmt(o.received)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${o.pending > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {fmt(o.pending)}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLE[o.status] ?? STATUS_STYLE.active}`}>
                      {o.status}
                    </span>
                  </div>

                  <div>
                    <Link href={`/dashboard/accounts/orders/${o.id}`}
                      className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 transition-colors">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
