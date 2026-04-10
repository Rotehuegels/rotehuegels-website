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
    // Search order payments with their order info
    let builder = supabaseAdmin
      .from('order_payments')
      .select('id, order_id, payment_date, amount_received, net_received, tds_deducted, reference_no, notes, orders!inner(order_no, client_name)')
      .order('payment_date', { ascending: false })
      .limit(20);

    if (query) {
      // Try as number first (amount search)
      const num = parseFloat(query);
      if (!isNaN(num) && num > 0) {
        builder = builder.or(`net_received.eq.${num},amount_received.eq.${num}`);
      } else {
        // Search by order number via a separate query
        const { data: matchingOrders } = await supabaseAdmin
          .from('orders')
          .select('id')
          .ilike('order_no', `%${query}%`);

        if (matchingOrders && matchingOrders.length > 0) {
          const orderIds = matchingOrders.map(o => o.id);
          builder = builder.in('order_id', orderIds);
        } else {
          return NextResponse.json({ data: [] });
        }
      }
    }

    const { data, error } = await builder;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data ?? [] });
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
