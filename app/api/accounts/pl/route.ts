export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Parse FY string like "2025-26" → { from: '2025-04-01', to: '2026-03-31' }
function parseFY(fy: string) {
  const [startYear] = fy.split('-').map(Number);
  const endYear = startYear + 1;
  return {
    from: `${startYear}-04-01`,
    to:   `${endYear}-03-31`,
    label: `FY ${startYear}-${String(endYear).slice(2)}`,
  };
}

export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const fy = url.searchParams.get('fy') ?? '2025-26';
  const { from, to, label } = parseFY(fy);

  const [ordersRes, paymentsRes, expensesRes] = await Promise.all([
    // Revenue — orders by order_date within FY (accrual)
    // Exclude cancelled, reimbursements (pass-through, not revenue) and complimentary (zero-value)
    supabaseAdmin
      .from('orders')
      .select('order_type, base_value, total_value_incl_gst, cgst_amount, sgst_amount, igst_amount, status')
      .gte('order_date', from)
      .lte('order_date', to)
      .neq('status', 'cancelled')
      .neq('order_category', 'reimbursement')
      .neq('order_category', 'complimentary'),

    // Receipts — payments by payment_date within FY (cash)
    supabaseAdmin
      .from('order_payments')
      .select('amount_received, tds_deducted, net_received, payment_date, order_id')
      .gte('payment_date', from)
      .lte('payment_date', to),

    // Expenses — by expense_date within FY
    supabaseAdmin
      .from('expenses')
      .select('expense_type, amount, gst_input_credit')
      .gte('expense_date', from)
      .lte('expense_date', to),
  ]);

  const orders   = ordersRes.data   ?? [];
  const payments = paymentsRes.data ?? [];
  const expenses = expensesRes.data ?? [];

  // ── REVENUE (Accrual) ──────────────────────────────────
  const goodsOrders   = orders.filter(o => o.order_type === 'goods');
  const serviceOrders = orders.filter(o => o.order_type === 'service');

  const goodsBase    = goodsOrders.reduce((s, o) => s + (o.base_value ?? 0), 0);
  const serviceBase  = serviceOrders.reduce((s, o) => s + (o.base_value ?? 0), 0);
  const totalBase    = goodsBase + serviceBase;

  const outputCGST   = orders.reduce((s, o) => s + (o.cgst_amount ?? 0), 0);
  const outputSGST   = orders.reduce((s, o) => s + (o.sgst_amount ?? 0), 0);
  const outputIGST   = orders.reduce((s, o) => s + (o.igst_amount ?? 0), 0);
  const totalGST     = outputCGST + outputSGST + outputIGST;
  const totalInvoiced = totalBase + totalGST;

  // ── RECEIPTS (Cash) ────────────────────────────────────
  const grossReceived = payments.reduce((s, p) => s + (p.amount_received ?? 0), 0);
  const tdsDeducted   = payments.reduce((s, p) => s + (p.tds_deducted   ?? 0), 0);
  const netReceived   = payments.reduce((s, p) => s + (p.net_received   ?? 0), 0);
  const pendingReceivables = totalInvoiced - grossReceived;

  // ── EXPENSES ───────────────────────────────────────────
  const sum = (type: string) => expenses.filter(e => e.expense_type === type).reduce((s, e) => s + (e.amount ?? 0), 0);
  const salaries    = sum('salary');
  const purchases   = sum('purchase');
  const tdsPaid     = sum('tds_paid');
  const advanceTax  = sum('advance_tax');
  const gstPaid     = sum('gst_paid');
  const otherExp    = sum('other');
  const totalExpenses = salaries + purchases + tdsPaid + advanceTax + gstPaid + otherExp;

  // GST input credit from purchase expenses
  const inputCredit = expenses.reduce((s, e) => s + (e.gst_input_credit ?? 0), 0);
  const netGSTLiability = totalGST - inputCredit;

  // ── PROFIT ─────────────────────────────────────────────
  const grossProfit     = totalBase - purchases;
  const operatingProfit = grossProfit - salaries - otherExp;
  const profitBeforeTax = operatingProfit;
  const taxProvision    = advanceTax + gstPaid;
  const netProfit       = profitBeforeTax - taxProvision;

  return NextResponse.json({
    fy, label,
    period: { from, to },
    revenue: {
      goodsBase, serviceBase, totalBase,
      goodsInclGST: goodsOrders.reduce((s, o) => s + (o.total_value_incl_gst ?? 0), 0),
      serviceInclGST: serviceOrders.reduce((s, o) => s + (o.total_value_incl_gst ?? 0), 0),
      totalInvoiced,
    },
    gst: {
      outputCGST, outputSGST, outputIGST,
      totalOutput: totalGST,
      inputCredit,
      netLiability: netGSTLiability,
    },
    receipts: {
      grossReceived, tdsDeducted, netReceived,
      pendingReceivables,
    },
    expenses: {
      salaries, purchases, tdsPaid, advanceTax, gstPaid, otherExp,
      total: totalExpenses,
    },
    profit: {
      grossProfit,
      operatingProfit,
      profitBeforeTax,
      taxProvision,
      netProfit,
    },
    tds: {
      deductedByClients: tdsDeducted,
      paidToGovt: tdsPaid,
    },
    counts: {
      orders: orders.length,
      goodsOrders: goodsOrders.length,
      serviceOrders: serviceOrders.length,
      payments: payments.length,
      expenses: expenses.length,
    },
  });
}
