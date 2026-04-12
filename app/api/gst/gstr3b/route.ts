import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GSTR-3B: Monthly summary return data
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const [ordersRes, expensesRes] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('base_value, cgst_amount, sgst_amount, igst_amount, total_value_incl_gst, client_gstin, place_of_supply, order_type, status, order_category')
      .gte('order_date', from)
      .lte('order_date', to)
      .neq('status', 'cancelled')
      .neq('status', 'draft')
      .neq('order_category', 'reimbursement')
      .neq('order_category', 'complimentary'),
    supabaseAdmin
      .from('expenses')
      .select('amount, gst_input_credit, expense_type')
      .gte('expense_date', from)
      .lte('expense_date', to),
  ]);

  const orders = ordersRes.data ?? [];
  const expenses = expensesRes.data ?? [];

  // 3.1 — Outward supplies
  const intraState = orders.filter(o => (o.cgst_amount ?? 0) > 0);
  const interState = orders.filter(o => (o.igst_amount ?? 0) > 0);
  const zeroRated  = orders.filter(o => (o.cgst_amount ?? 0) === 0 && (o.igst_amount ?? 0) === 0);

  const outward = {
    taxable_intra: intraState.reduce((s, o) => s + (o.base_value ?? 0), 0),
    cgst: intraState.reduce((s, o) => s + (o.cgst_amount ?? 0), 0),
    sgst: intraState.reduce((s, o) => s + (o.sgst_amount ?? 0), 0),
    taxable_inter: interState.reduce((s, o) => s + (o.base_value ?? 0), 0),
    igst: interState.reduce((s, o) => s + (o.igst_amount ?? 0), 0),
    zero_rated: zeroRated.reduce((s, o) => s + (o.base_value ?? 0), 0),
  };

  // 4 — ITC (Input Tax Credit)
  const totalITC = expenses.reduce((s, e) => s + (e.gst_input_credit ?? 0), 0);
  // Approximate ITC split (assuming 18% GST: 9% CGST + 9% SGST on intra-state purchases)
  const itcCGST = totalITC / 2;
  const itcSGST = totalITC / 2;
  const itcIGST = 0; // Would need purchase data with state info for accurate split

  const itc = {
    cgst: itcCGST,
    sgst: itcSGST,
    igst: itcIGST,
    total: totalITC,
  };

  // 6 — Payment of tax
  const netCGST = outward.cgst - itc.cgst;
  const netSGST = outward.sgst - itc.sgst;
  const netIGST = outward.igst - itc.igst;

  const payment = {
    cgst: Math.max(0, netCGST),
    sgst: Math.max(0, netSGST),
    igst: Math.max(0, netIGST),
    total: Math.max(0, netCGST) + Math.max(0, netSGST) + Math.max(0, netIGST),
    itc_carry_forward: {
      cgst: Math.abs(Math.min(0, netCGST)),
      sgst: Math.abs(Math.min(0, netSGST)),
      igst: Math.abs(Math.min(0, netIGST)),
    },
  };

  return NextResponse.json({
    period: { month, year, from, to },
    section_3_1: outward,
    section_4: itc,
    section_6: payment,
    summary: {
      total_outward: outward.taxable_intra + outward.taxable_inter + outward.zero_rated,
      total_tax: outward.cgst + outward.sgst + outward.igst,
      total_itc: itc.total,
      net_payable: payment.total,
    },
  });
}
