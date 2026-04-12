import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; milestoneId: string }> }) {
  const { milestoneId } = await params;
  const body = await req.json();

  delete body.id;
  delete body.project_id;
  delete body.created_at;

  const { data, error } = await supabaseAdmin
    .from('project_milestones')
    .update(body)
    .eq('id', milestoneId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
