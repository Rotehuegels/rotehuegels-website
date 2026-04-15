import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// PATCH — update a payment record
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = {};
  if (body.amount_received != null) update.amount_received = body.amount_received;
  if (body.tds_deducted != null) update.tds_deducted = body.tds_deducted;
  if (body.net_received != null) update.net_received = body.net_received;
  if (body.payment_date) update.payment_date = body.payment_date;
  if (body.payment_mode) update.payment_mode = body.payment_mode;
  if (body.reference_no !== undefined) update.reference_no = body.reference_no;
  if (body.notes !== undefined) update.notes = body.notes;

  // Auto-calculate net_received if not provided
  if (update.amount_received != null && update.net_received == null) {
    update.net_received = (update.amount_received as number) - ((update.tds_deducted as number) ?? body.tds_deducted ?? 0);
  }

  const { data: existing } = await supabaseAdmin.from('order_payments').select('order_id, amount_received, orders(order_no, client_name)').eq('id', id).single();

  const { error } = await supabaseAdmin.from('order_payments').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orderInfo = (existing?.orders as any);
  logAudit({
    userId: user.id, userEmail: user.email ?? undefined,
    action: 'update', entityType: 'payment', entityId: id,
    entityLabel: `Payment on ${orderInfo?.order_no ?? ''} - ${orderInfo?.client_name ?? ''}`,
    changes: Object.fromEntries(Object.entries(update).map(([k, v]) => [k, { old: null, new: v }])),
  });

  return NextResponse.json({ success: true });
}

// DELETE — remove a payment record
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: existing } = await supabaseAdmin.from('order_payments').select('order_id, amount_received, orders(order_no, client_name)').eq('id', id).single();

  const { error } = await supabaseAdmin.from('order_payments').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orderInfo = (existing?.orders as any);
  logAudit({
    userId: user.id, userEmail: user.email ?? undefined,
    action: 'delete', entityType: 'payment', entityId: id,
    entityLabel: `Deleted payment on ${orderInfo?.order_no ?? ''} - ${orderInfo?.client_name ?? ''}`,
  });

  return NextResponse.json({ success: true });
}
