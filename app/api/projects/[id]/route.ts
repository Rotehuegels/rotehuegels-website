import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: project, error } = await supabaseAdmin
    .from('projects')
    .select('*, customers(name, customer_id, email, phone)')
    .eq('id', id)
    .single();

  if (error || !project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Fetch all related data
  const [milestonesRes, ordersRes, activitiesRes, changesRes, docsRes, clientsRes] = await Promise.all([
    supabaseAdmin.from('project_milestones').select('*').eq('project_id', id).order('milestone_no'),
    supabaseAdmin.from('project_orders').select('order_id, orders(id, order_no, description, total_value_incl_gst, status)').eq('project_id', id),
    supabaseAdmin.from('project_activities').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(20),
    supabaseAdmin.from('change_requests').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    supabaseAdmin.from('project_documents').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    supabaseAdmin.from('user_profiles').select('id, display_name, phone, created_at').eq('customer_id', project.customer_id).eq('role', 'client'),
  ]);

  return NextResponse.json({
    project,
    milestones: milestonesRes.data ?? [],
    linkedOrders: ordersRes.data ?? [],
    activities: activitiesRes.data ?? [],
    changeRequests: changesRes.data ?? [],
    documents: docsRes.data ?? [],
    clientUsers: clientsRes.data ?? [],
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  delete body.id;
  delete body.created_at;
  delete body.project_code;

  const { data, error } = await supabaseAdmin
    .from('projects')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
