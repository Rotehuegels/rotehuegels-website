import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const portalUser = await getPortalUser();
  if (!portalUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('customer_id', portalUser.customerId)
    .single();

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from('change_requests')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const portalUser = await getPortalUser();
  if (!portalUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('customer_id', portalUser.customerId)
    .single();

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { title, description, reason } = body;

  if (!title || !description) {
    return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
  }

  // Generate change_no
  const { count } = await supabaseAdmin
    .from('change_requests')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', id);

  const changeNo = `CR-${String((count ?? 0) + 1).padStart(3, '0')}`;

  const { data, error } = await supabaseAdmin
    .from('change_requests')
    .insert({
      project_id: id,
      change_no: changeNo,
      requested_by: portalUser.userId,
      title,
      description,
      reason: reason || null,
      status: 'requested',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log activity
  await supabaseAdmin.from('project_activities').insert({
    project_id: id,
    activity_type: 'change_request',
    title: `Change request submitted: ${title}`,
    description: `${changeNo} — ${description.slice(0, 200)}`,
    actor: portalUser.displayName || portalUser.email,
    visible_to_client: true,
  });

  return NextResponse.json(data, { status: 201 });
}
