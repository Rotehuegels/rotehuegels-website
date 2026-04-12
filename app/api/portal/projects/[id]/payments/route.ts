import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const portalUser = await getPortalUser();
  if (!portalUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Verify project belongs to client
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('customer_id', portalUser.customerId)
    .single();

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Get linked orders
  const { data: links } = await supabaseAdmin
    .from('project_orders')
    .select('order_id')
    .eq('project_id', id);

  const orderIds = (links ?? []).map(l => l.order_id);
  if (orderIds.length === 0) return NextResponse.json({ stages: [], payments: [], totals: { contract: 0, paid: 0, pending: 0 } });

  const [ordersRes, stagesRes, paymentsRes] = await Promise.all([
    supabaseAdmin.from('orders').select('id, order_no, description, total_value_incl_gst, status').in('id', orderIds),
    supabaseAdmin.from('order_payment_stages').select('id, order_id, stage_number, stage_name, amount_due, gst_on_stage, status, due_date, trigger_condition').in('order_id', orderIds).order('stage_number'),
    supabaseAdmin.from('order_payments').select('id, order_id, payment_date, amount_received, payment_mode, reference_no').in('order_id', orderIds).order('payment_date'),
  ]);

  const orders = ordersRes.data ?? [];
  const totalContract = orders.reduce((s, o) => s + (o.total_value_incl_gst ?? 0), 0);
  const totalPaid = (paymentsRes.data ?? []).reduce((s, p) => s + (p.amount_received ?? 0), 0);

  return NextResponse.json({
    orders: orders.map(o => ({ id: o.id, orderNo: o.order_no, description: o.description, total: o.total_value_incl_gst })),
    stages: stagesRes.data ?? [],
    payments: paymentsRes.data ?? [],
    totals: { contract: totalContract, paid: totalPaid, pending: totalContract - totalPaid },
  });
}
