import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GSTR-1: Outward supplies — invoice-level detail for filing
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('id, order_no, client_name, client_gstin, client_pan, place_of_supply, order_date, invoice_date, base_value, gst_rate, cgst_amount, sgst_amount, igst_amount, total_value_incl_gst, hsn_sac_code, order_type, status, order_category')
    .gte('order_date', from)
    .lte('order_date', to)
    .neq('status', 'cancelled')
    .neq('status', 'draft')
    .neq('order_category', 'reimbursement')
    .neq('order_category', 'complimentary')
    .order('order_date');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const list = orders ?? [];

  // Categorize for GSTR-1 tables
  const b2b = list.filter(o => o.client_gstin); // B2B (registered)
  const b2c = list.filter(o => !o.client_gstin && (o.total_value_incl_gst ?? 0) <= 250000); // B2C Small
  const b2cLarge = list.filter(o => !o.client_gstin && (o.total_value_incl_gst ?? 0) > 250000); // B2C Large

  // HSN-wise summary
  const hsnMap: Record<string, { hsn: string; description: string; qty: number; taxable: number; igst: number; cgst: number; sgst: number; total: number }> = {};
  for (const o of list) {
    const hsn = o.hsn_sac_code || 'N/A';
    if (!hsnMap[hsn]) hsnMap[hsn] = { hsn, description: o.order_type === 'service' ? 'Services' : 'Goods', qty: 0, taxable: 0, igst: 0, cgst: 0, sgst: 0, total: 0 };
    hsnMap[hsn].qty += 1;
    hsnMap[hsn].taxable += o.base_value ?? 0;
    hsnMap[hsn].igst += o.igst_amount ?? 0;
    hsnMap[hsn].cgst += o.cgst_amount ?? 0;
    hsnMap[hsn].sgst += o.sgst_amount ?? 0;
    hsnMap[hsn].total += o.total_value_incl_gst ?? 0;
  }

  return NextResponse.json({
    period: { month, year, from, to },
    b2b,
    b2c,
    b2cLarge,
    hsnSummary: Object.values(hsnMap),
    totals: {
      invoices: list.length,
      taxable: list.reduce((s, o) => s + (o.base_value ?? 0), 0),
      cgst: list.reduce((s, o) => s + (o.cgst_amount ?? 0), 0),
      sgst: list.reduce((s, o) => s + (o.sgst_amount ?? 0), 0),
      igst: list.reduce((s, o) => s + (o.igst_amount ?? 0), 0),
      total: list.reduce((s, o) => s + (o.total_value_incl_gst ?? 0), 0),
    },
  });
}
