export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function parseFY(fy: string) {
  const [startYear] = fy.split('-').map(Number);
  const endYear = startYear + 1;
  return {
    from: `${startYear}-04-01`,
    to: `${endYear}-03-31`,
    label: `FY ${startYear}-${endYear}`,
  };
}

export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const fy = url.searchParams.get('fy') ?? '2025-26';
  const { from, to, label } = parseFY(fy);

  // Fetch orders
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, order_type, base_value, total_value_incl_gst, cgst_amount, sgst_amount, igst_amount')
    .gte('order_date', from)
    .lte('order_date', to)
    .neq('status', 'cancelled')
    .neq('status', 'draft')
    .neq('order_category', 'reimbursement')
    .neq('order_category', 'complimentary');

  const orderList = orders ?? [];
  const orderIds = orderList.map(o => o.id);

  // Fetch payments and expenses
  const [paymentsRes, expensesRes] = await Promise.all([
    orderIds.length > 0
      ? supabaseAdmin
          .from('order_payments')
          .select('amount_received, tds_deducted, net_received')
          .in('order_id', orderIds)
      : Promise.resolve({ data: [] }),
    supabaseAdmin
      .from('expenses')
      .select('expense_type, amount, gst_input_credit')
      .gte('expense_date', from)
      .lte('expense_date', to),
  ]);

  const payments = paymentsRes.data ?? [];
  const expenses = expensesRes.data ?? [];

  const goodsBase = orderList.filter(o => o.order_type === 'goods').reduce((s, o) => s + (o.base_value ?? 0), 0);
  const serviceBase = orderList.filter(o => o.order_type === 'service').reduce((s, o) => s + (o.base_value ?? 0), 0);
  const totalBase = goodsBase + serviceBase;

  const outputCGST = orderList.reduce((s, o) => s + (o.cgst_amount ?? 0), 0);
  const outputSGST = orderList.reduce((s, o) => s + (o.sgst_amount ?? 0), 0);
  const outputIGST = orderList.reduce((s, o) => s + (o.igst_amount ?? 0), 0);
  const totalGST = outputCGST + outputSGST + outputIGST;
  const totalInvoiced = orderList.reduce((s, o) => s + (o.total_value_incl_gst ?? 0), 0);

  const grossReceived = payments.reduce((s, p) => s + (p.amount_received ?? 0), 0);
  const tdsDeducted = payments.reduce((s, p) => s + (p.tds_deducted ?? 0), 0);

  const sumExp = (type: string) =>
    expenses.filter(e => e.expense_type === type).reduce((s, e) => s + (e.amount ?? 0), 0);

  const salaries = sumExp('salary');
  const purchases = sumExp('purchase');
  const tdsPaid = sumExp('tds_paid');
  const advanceTax = sumExp('advance_tax');
  const gstPaid = sumExp('gst_paid');
  const otherExp = sumExp('other');
  const inputCredit = expenses.reduce((s, e) => s + (e.gst_input_credit ?? 0), 0);

  const grossProfit = totalBase - purchases;
  const operatingProfit = grossProfit - salaries - otherExp;
  const netProfit = operatingProfit - advanceTax;
  const effectiveReceived = grossReceived + tdsDeducted;
  const pendingRec = totalInvoiced - effectiveReceived;

  const rows = [
    [`Profit & Loss Statement - ${label}`],
    [`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`],
    [],
    ['Section', 'Item', 'Amount (INR)'],
    [],
    ['A - Income', 'Sales of Goods', goodsBase.toFixed(2)],
    ['', 'Sales of Services', serviceBase.toFixed(2)],
    ['', 'Total Revenue (excl. GST)', totalBase.toFixed(2)],
    [],
    ['B - Direct Costs', 'Purchases / Raw Materials', purchases.toFixed(2)],
    ['', 'Gross Profit (A - B)', grossProfit.toFixed(2)],
    [],
    ['C - Operating Expenses', 'Salaries & Wages', salaries.toFixed(2)],
    ['', 'Other Expenses', otherExp.toFixed(2)],
    ['', 'Total Operating Expenses', (salaries + otherExp).toFixed(2)],
    ['', 'Operating Profit', operatingProfit.toFixed(2)],
    [],
    ['D - Tax', 'Advance Tax Paid', advanceTax.toFixed(2)],
    ['', 'GST Paid to Govt', gstPaid.toFixed(2)],
    ['', 'Net Profit / (Loss)', netProfit.toFixed(2)],
    [],
    ['GST Summary', 'Output GST (Liability)', totalGST.toFixed(2)],
    ['', 'CGST', outputCGST.toFixed(2)],
    ['', 'SGST', outputSGST.toFixed(2)],
    ['', 'IGST', outputIGST.toFixed(2)],
    ['', 'Input Tax Credit (ITC)', inputCredit.toFixed(2)],
    ['', 'GST Paid to Govt', gstPaid.toFixed(2)],
    ['', 'Net GST Position', (totalGST - inputCredit - gstPaid).toFixed(2)],
    [],
    ['TDS Summary', 'TDS Deducted by Clients', tdsDeducted.toFixed(2)],
    ['', 'TDS Paid to Govt', tdsPaid.toFixed(2)],
    ['', 'Net TDS Refundable', (tdsDeducted - tdsPaid).toFixed(2)],
    [],
    ['Receivables', 'Total Invoiced (incl. GST)', totalInvoiced.toFixed(2)],
    ['', 'Effective Amount Settled', effectiveReceived.toFixed(2)],
    ['', 'Outstanding Receivables', pendingRec.toFixed(2)],
  ];

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pl-${fy}.csv"`,
    },
  });
}
