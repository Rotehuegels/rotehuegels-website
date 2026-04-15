export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type  = searchParams.get('type');   // order_payment | expense
  const query = searchParams.get('q') ?? '';

  if (type === 'order_payment') {
    // Search BOTH existing payments AND orders (for new payment matching)
    // This allows matching bank transactions to orders that don't have payments yet

    // 1. Search existing payments
    let paymentBuilder = supabaseAdmin
      .from('order_payments')
      .select('id, order_id, payment_date, amount_received, net_received, tds_deducted, reference_no, notes, orders!inner(order_no, client_name)')
      .order('payment_date', { ascending: false })
      .limit(10);

    // 2. Search orders directly (including those without payments)
    let orderBuilder = supabaseAdmin
      .from('orders')
      .select('id, order_no, client_name, total_value_incl_gst, order_date, status')
      .neq('status', 'cancelled')
      .order('order_date', { ascending: false })
      .limit(10);

    if (query) {
      const num = parseFloat(query);
      if (!isNaN(num) && num > 0) {
        paymentBuilder = paymentBuilder.or(`net_received.eq.${num},amount_received.eq.${num}`);
        orderBuilder = orderBuilder.eq('total_value_incl_gst', num);
      } else {
        // Search by order number
        const { data: matchingOrders } = await supabaseAdmin
          .from('orders')
          .select('id')
          .ilike('order_no', `%${query}%`);

        if (matchingOrders && matchingOrders.length > 0) {
          const orderIds = matchingOrders.map(o => o.id);
          paymentBuilder = paymentBuilder.in('order_id', orderIds);
        }
        orderBuilder = orderBuilder.ilike('order_no', `%${query}%`);
      }
    }

    const [{ data: payments }, { data: orders }] = await Promise.all([
      paymentBuilder,
      orderBuilder,
    ]);

    // Combine: existing payments first, then orders (as potential new matches)
    const results: any[] = [
      ...(payments ?? []).map(p => ({ ...p, _type: 'payment' })),
      ...(orders ?? []).map(o => ({
        id: `order_${o.id}`,
        order_id: o.id,
        payment_date: o.order_date,
        amount_received: o.total_value_incl_gst,
        net_received: o.total_value_incl_gst,
        tds_deducted: 0,
        reference_no: null,
        notes: null,
        orders: { order_no: o.order_no, client_name: o.client_name },
        _type: 'order',
        _status: o.status,
      })),
    ];

    return NextResponse.json({ data: results });
  }

  if (type === 'expense') {
    let builder = supabaseAdmin
      .from('expenses')
      .select('id, expense_date, amount, description, vendor_name, reference_no, expense_type')
      .order('expense_date', { ascending: false })
      .limit(20);

    if (query) {
      const num = parseFloat(query);
      if (!isNaN(num) && num > 0) {
        builder = builder.eq('amount', num);
      } else {
        builder = builder.or(`description.ilike.%${query}%,vendor_name.ilike.%${query}%`);
      }
    }

    const { data, error } = await builder;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data ?? [] });
  }

  return NextResponse.json({ error: 'Invalid type. Use order_payment or expense.' }, { status: 400 });
}
