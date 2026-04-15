import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { sendOrderConfirmation } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
    }

    // Get the customer email from the order for the response
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('client_name, customers(email)')
      .eq('id', order_id)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientEmail = (order as any)?.customers?.email ?? 'customer';

    await sendOrderConfirmation(order_id);

    return NextResponse.json({
      success: true,
      sent_to: clientEmail,
    });
  } catch (err: unknown) {
    console.error('[POST /api/accounts/reinvoice/email]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send email' },
      { status: 500 },
    );
  }
}
