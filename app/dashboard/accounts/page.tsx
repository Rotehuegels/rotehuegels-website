import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import {
  IndianRupee, TrendingUp, Clock, ReceiptText, Package,
  ArrowRight, Plus, ShoppingBag, Wrench,
} from 'lucide-react';
import AccountsFYSelector from './AccountsFYSelector';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

function parseFY(fy: string) {
  const [startYear] = fy.split('-').map(Number);
  const endYear = startYear + 1;
  return {
    from:  `${startYear}-04-01`,
    to:    `${endYear}-03-31`,
    label: `FY ${startYear}–${endYear}`,
    full:  `1 April ${startYear} to 31 March ${endYear}`,
  };
}

async function getSummary(from: string, to: string) {
  const [ordersRes, paymentsRes, expensesRes, stockRes] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('id, order_type, total_value_incl_gst, base_value, status, tds_deducted_total')
      .gte('invoice_date', from)
      .lte('invoice_date', to)
      .neq('status', 'cancelled'),
    supabaseAdmin
      .from('order_payments')
      .select('order_id, amount_received, tds_deducted, net_received')
      .gte('payment_date', from)
      .lte('payment_date', to),
    supabaseAdmin
      .from('expenses')
      .select('amount, expense_type')
      .gte('expense_date', from)
      .lte('expense_date', to),
    supabaseAdmin.from('stock_items').select('quantity, unit_cost'),
  ]);

  const orders   = ordersRes.data   ?? [];
  const payments = paymentsRes.data ?? [];
  const expenses = expensesRes.data ?? [];
  const stock    = stockRes.data    ?? [];

  const totalOrderBook     = orders.reduce((s, o) => s + (o.total_value_incl_gst ?? 0), 0);
  const totalGrossReceived = payments.reduce((s, p) => s + (p.amount_received ?? 0), 0);
  const totalTdsDeducted   = payments.reduce((s, p) => s + (p.tds_deducted ?? 0), 0);
  const totalNetReceived   = payments.reduce((s, p) => s + (p.net_received ?? 0), 0);
  const totalPending       = totalOrderBook - totalGrossReceived;
  const totalExpenses      = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const totalStockValue    = stock.reduce((s, i) => s + (i.quantity ?? 0) * (i.unit_cost ?? 0), 0);
  const netProfit          = totalNetReceived - totalExpenses;

  return {
    totalOrderBook, totalGrossReceived, totalNetReceived,
    totalTdsDeducted, totalPending, totalExpenses, totalStockValue, netProfit,
    orderCount:    orders.length,
    activeOrders:  orders.filter(o => o.status === 'active').length,
    goodsOrders:   orders.filter(o => o.order_type === 'goods').length,
    serviceOrders: orders.filter(o => o.order_type === 'service').length,
  };
}

async function getRecentOrders(from: string, to: string) {
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, order_no, order_type, client_name, total_value_incl_gst, status, invoice_date, order_date')
    .gte('invoice_date', from)
    .lte('invoice_date', to)
    .neq('status', 'cancelled')
    .order('invoice_date', { ascending: true, nullsFirst: false })
    .limit(8);

  const ids = (orders ?? []).map(o => o.id);
  if (!ids.length) return orders ?? [];

  const { data: payments } = await supabaseAdmin
    .from('order_payments')
    .select('order_id, amount_received')
    .in('order_id', ids);

  const pmtMap: Record<string, number> = {};
  for (const p of payments ?? []) {
    pmtMap[p.order_id] = (pmtMap[p.order_id] ?? 0) + (p.amount_received ?? 0);
  }

  return (orders ?? []).map(o => ({
    ...o,
    totalReceived: pmtMap[o.id] ?? 0,
    pending: (o.total_value_incl_gst ?? 0) - (pmtMap[o.id] ?? 0),
  }));
}

const STATUS_STYLE: Record<string, string> = {
  active:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  draft:     'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ fy?: string }> }) {
  const { fy: fyParam } = await searchParams;
  const fy = fyParam ?? '2025-26';
  const { from, to, label, full } = parseFY(fy);

  const [summary, recentOrders] = await Promise.all([
    getSummary(from, to),
    getRecentOrders(from, to),
  ]);

  const profitPositive = summary.netProfit >= 0;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Accounts</h1>
          <p className="mt-1 text-sm text-zinc-400">{full}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <AccountsFYSelector current={fy} />
          <Link href="/dashboard/accounts/orders/new"
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 transition-colors">
            <Plus className="h-4 w-4" /> New Order
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className={`${glass} p-6`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Order Book ({label})</p>
            <div className="bg-amber-500/10 rounded-xl p-2">
              <ReceiptText className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400">{fmt(summary.totalOrderBook)}</p>
          <p className="mt-1 text-xs text-zinc-600">{summary.orderCount} orders · {summary.activeOrders} active</p>
        </div>

        <div className={`${glass} p-6`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Received (Net)</p>
            <div className="bg-emerald-500/10 rounded-xl p-2">
              <IndianRupee className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400">{fmt(summary.totalNetReceived)}</p>
          <p className="mt-1 text-xs text-zinc-600">TDS deducted: {fmt(summary.totalTdsDeducted)}</p>
        </div>

        <div className={`${glass} p-6`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Pending Receivables</p>
            <div className="bg-rose-500/10 rounded-xl p-2">
              <Clock className="h-4 w-4 text-rose-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-400">{fmt(summary.totalPending)}</p>
          <p className="mt-1 text-xs text-zinc-600">Across {summary.activeOrders} active orders</p>
        </div>

        <div className={`${glass} p-6`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Net Profit</p>
            <div className={`${profitPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10'} rounded-xl p-2`}>
              <TrendingUp className={`h-4 w-4 ${profitPositive ? 'text-emerald-400' : 'text-rose-400'}`} />
            </div>
          </div>
          <p className={`text-2xl font-black ${profitPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {fmt(summary.netProfit)}
          </p>
          <p className="mt-1 text-xs text-zinc-600">Net received − expenses</p>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className={`${glass} p-5 flex items-center gap-4`}>
          <div className="bg-sky-500/10 rounded-xl p-3">
            <Wrench className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Service Orders</p>
            <p className="text-xl font-bold text-sky-400">{summary.serviceOrders}</p>
          </div>
        </div>
        <div className={`${glass} p-5 flex items-center gap-4`}>
          <div className="bg-violet-500/10 rounded-xl p-3">
            <ShoppingBag className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Goods Orders</p>
            <p className="text-xl font-bold text-violet-400">{summary.goodsOrders}</p>
          </div>
        </div>
        <div className={`${glass} p-5 flex items-center gap-4`}>
          <div className="bg-orange-500/10 rounded-xl p-3">
            <Package className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Stock Value</p>
            <p className="text-xl font-bold text-orange-400">{fmt(summary.totalStockValue)}</p>
          </div>
        </div>
      </div>

      {/* Expense summary */}
      <div className={`${glass} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-300">Total Expenses ({label})</h2>
          <Link href="/dashboard/accounts/expenses"
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors">
            Manage <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <p className="text-3xl font-black text-rose-400">{fmt(summary.totalExpenses)}</p>
        <p className="mt-1 text-xs text-zinc-600">Salary, purchases, TDS paid, taxes — all combined</p>
      </div>

      {/* Orders in this FY */}
      <div className={glass}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/60">
          <h2 className="text-sm font-semibold text-zinc-300">Orders in {label}</h2>
          <Link href="/dashboard/accounts/orders"
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {!recentOrders.length ? (
          <div className="p-12 text-center">
            <p className="text-zinc-500 text-sm">No orders in {label}.</p>
            <Link href="/dashboard/accounts/orders/new"
              className="mt-4 inline-block rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 transition-colors">
              Create first order
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {recentOrders.map((o) => {
              const order = o as typeof o & { totalReceived: number; pending: number };
              return (
                <div key={o.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800/20 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-semibold text-amber-400">{o.order_no}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${
                        o.order_type === 'service' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                      }`}>{o.order_type}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-400 truncate">{o.client_name}</p>
                  </div>
                  <div className="flex items-center gap-6 ml-4 shrink-0 text-right">
                    <div className="hidden sm:block">
                      <p className="text-xs text-zinc-600">Invoice Date</p>
                      <p className="text-sm font-semibold text-white">
                        {o.invoice_date ? new Date(o.invoice_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs text-zinc-600">Total</p>
                      <p className="text-sm font-semibold text-white">{fmt(o.total_value_incl_gst)}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs text-zinc-600">Pending</p>
                      <p className={`text-sm font-semibold ${order.pending > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {fmt(order.pending)}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLE[o.status] ?? STATUS_STYLE.active}`}>
                      {o.status}
                    </span>
                    <Link href={`/dashboard/accounts/orders/${o.id}`}
                      className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 transition-colors">
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className={`${glass} p-6`}>
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/accounts/orders/new"
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 transition-colors">
            <Plus className="h-4 w-4" /> New Order
          </Link>
          <Link href={`/dashboard/accounts/pl?fy=${fy}`}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:border-zinc-600 transition-colors">
            <TrendingUp className="h-4 w-4" /> P&amp;L Statement
          </Link>
          <Link href="/dashboard/accounts/expenses"
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:border-zinc-600 transition-colors">
            <ReceiptText className="h-4 w-4" /> Manage Expenses
          </Link>
          <Link href="/dashboard/accounts/stock"
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:border-zinc-600 transition-colors">
            <Package className="h-4 w-4" /> Stock Items
          </Link>
        </div>
      </div>
    </div>
  );
}
