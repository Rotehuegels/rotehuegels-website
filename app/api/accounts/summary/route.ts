export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [ordersRes, paymentsRes, expensesRes, stockRes] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('id, order_type, total_value_incl_gst, base_value, status, tds_deducted_total')
      .neq('status', 'cancelled')
      .neq('order_category', 'reimbursement')
      .neq('order_category', 'complimentary'),
    supabaseAdmin
      .from('order_payments')
      .select('amount_received, tds_deducted, net_received'),
    supabaseAdmin
      .from('expenses')
      .select('amount, expense_type'),
    supabaseAdmin
      .from('stock_items')
      .select('quantity, unit_cost'),
  ]);

  const orders = ordersRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const expenses = expensesRes.data ?? [];
  const stock = stockRes.data ?? [];

  // Revenue metrics
  const totalOrderBook = orders.reduce((s, o) => s + (o.total_value_incl_gst ?? 0), 0);
  const totalGrossReceived = payments.reduce((s, p) => s + (p.amount_received ?? 0), 0);
  const totalTdsDeducted = payments.reduce((s, p) => s + (p.tds_deducted ?? 0), 0);
  const totalNetReceived = payments.reduce((s, p) => s + (p.net_received ?? 0), 0);
  const totalPending = totalOrderBook - totalGrossReceived;

  // Order counts
  const activeOrders = orders.filter(o => o.status === 'active').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const goodsOrders = orders.filter(o => o.order_type === 'goods').length;
  const serviceOrders = orders.filter(o => o.order_type === 'service').length;

  // Expenses
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const expensesByType = expenses.reduce((acc, e) => {
    acc[e.expense_type] = (acc[e.expense_type] ?? 0) + (e.amount ?? 0);
    return acc;
  }, {} as Record<string, number>);

  // Stock value
  const totalStockValue = stock.reduce((s, i) => s + (i.quantity ?? 0) * (i.unit_cost ?? 0), 0);

  // Estimated profit: net received - total expenses (cash basis)
  const netProfit = totalNetReceived - totalExpenses;

  return NextResponse.json({
    revenue: {
      totalOrderBook,
      totalGrossReceived,
      totalNetReceived,
      totalTdsDeducted,
      totalPending,
    },
    orders: {
      total: orders.length,
      active: activeOrders,
      completed: completedOrders,
      goods: goodsOrders,
      service: serviceOrders,
    },
    expenses: {
      total: totalExpenses,
      byType: expensesByType,
    },
    stock: {
      totalValue: totalStockValue,
      itemCount: stock.length,
    },
    profit: {
      net: netProfit,
    },
  });
}
