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

  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('order_no, order_type, client_name, order_date, base_value, total_value_incl_gst, gst_rate, status')
    .neq('order_category', 'reimbursement')
    .order('order_no', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = 'Order No,Type,Client,Date,Base Value,GST %,Total (incl. GST),Status';

  const rows = (orders ?? []).map(o => {
    const date = new Date(o.order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const clientEscaped = `"${(o.client_name ?? '').replace(/"/g, '""')}"`;
    return [
      o.order_no,
      o.order_type,
      clientEscaped,
      date,
      (o.base_value ?? 0).toFixed(2),
      (o.gst_rate ?? 0).toString(),
      (o.total_value_incl_gst ?? 0).toFixed(2),
      o.status,
    ].join(',');
  });

  const csv = [header, ...rows].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="orders-export.csv"',
    },
  });
}
