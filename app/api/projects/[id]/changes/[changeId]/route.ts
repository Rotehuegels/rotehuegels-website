import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; changeId: string }> }) {
  const { id, changeId } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = {};
  if (body.status) update.status = body.status;
  if (body.admin_notes !== undefined) update.admin_notes = body.admin_notes;
  if (body.cost_impact !== undefined) update.cost_impact = body.cost_impact;
  if (body.schedule_impact !== undefined) update.schedule_impact = body.schedule_impact;
  if (body.reviewed_by) update.reviewed_by = body.reviewed_by;
  if (body.status && body.status !== 'requested') update.reviewed_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('change_requests')
    .update(update)
    .eq('id', changeId)
    .eq('project_id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log activity
  await supabaseAdmin.from('project_activities').insert({
    project_id: id,
    activity_type: 'change_request',
    title: `Change request ${body.status}: ${data.title}`,
    description: body.admin_notes || null,
    actor: body.reviewed_by || 'Admin',
    visible_to_client: true,
  });

  return NextResponse.json(data);
}
