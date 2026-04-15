import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// POST — Convert an order to an expense entry, then delete the order
// Moves the financial data to expenses table and frees up the order number
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Fetch the order
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  // Create expense entry from order data
  const { data: expense, error: expErr } = await supabaseAdmin
    .from('expenses')
    .insert({
      expense_type: 'other',
      category: 'reimbursement',
      description: `${order.order_no} — ${order.description ?? 'Reimbursement'}`,
      vendor_name: order.client_name,
      amount: order.total_value_incl_gst ?? order.base_value ?? 0,
      gst_input_credit: 0,
      expense_date: order.order_date,
      payment_mode: 'Cash',
      notes: `Converted from order ${order.order_no}. Original client: ${order.client_name}. ${order.notes ?? ''}`.trim(),
    })
    .select('id')
    .single();

  if (expErr) return NextResponse.json({ error: `Failed to create expense: ${expErr.message}` }, { status: 500 });

  // Delete the order (hard delete — payments, stages, then order)
  await supabaseAdmin.from('order_payments').delete().eq('order_id', id);
  await supabaseAdmin.from('order_payment_stages').delete().eq('order_id', id);
  const { error: delErr } = await supabaseAdmin.from('orders').delete().eq('id', id);

  if (delErr) return NextResponse.json({ error: `Expense created but order deletion failed: ${delErr.message}` }, { status: 500 });

  logAudit({
    userId: user.id, userEmail: user.email ?? undefined,
    action: 'delete', entityType: 'order', entityId: id,
    entityLabel: `Converted to expense: ${order.order_no} → EXP-${(expense.id as string).substring(0, 8)}`,
    metadata: { expense_id: expense.id, original_order_no: order.order_no, amount: order.total_value_incl_gst },
  });

  return NextResponse.json({
    success: true,
    expense_id: expense.id,
    message: `${order.order_no} converted to expense and deleted. Order number is now free.`,
  });
}
