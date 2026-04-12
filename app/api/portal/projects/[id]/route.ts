import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const portalUser = await getPortalUser();
  if (!portalUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Fetch project (only if it belongs to this client's customer)
  const { data: project, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('customer_id', portalUser.customerId)
    .single();

  if (error || !project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Fetch linked orders summary
  const { data: links } = await supabaseAdmin
    .from('project_orders')
    .select('order_id')
    .eq('project_id', id);

  const orderIds = (links ?? []).map(l => l.order_id);

  let totalContract = 0;
  let totalPaid = 0;

  if (orderIds.length > 0) {
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('total_value_incl_gst')
      .in('id', orderIds);

    totalContract = (orders ?? []).reduce((s, o) => s + (o.total_value_incl_gst ?? 0), 0);

    const { data: payments } = await supabaseAdmin
      .from('order_payments')
      .select('amount_received, tds_deducted')
      .in('order_id', orderIds);

    totalPaid = (payments ?? []).reduce((s, p) => s + (p.amount_received ?? 0) + (p.tds_deducted ?? 0), 0);
  }

  // Fetch milestones summary
  const { data: milestones } = await supabaseAdmin
    .from('project_milestones')
    .select('id, title, status, target_date, completion_pct')
    .eq('project_id', id)
    .order('milestone_no');

  // Fetch recent activities
  const { data: activities } = await supabaseAdmin
    .from('project_activities')
    .select('id, activity_type, title, created_at')
    .eq('project_id', id)
    .eq('visible_to_client', true)
    .order('created_at', { ascending: false })
    .limit(5);

  // Pending change requests count
  const { count: pendingChanges } = await supabaseAdmin
    .from('change_requests')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', id)
    .in('status', ['requested', 'under_review']);

  return NextResponse.json({
    project,
    financials: { totalContract, totalPaid, totalPending: totalContract - totalPaid },
    milestones: milestones ?? [],
    recentActivities: activities ?? [],
    pendingChanges: pendingChanges ?? 0,
  });
}
