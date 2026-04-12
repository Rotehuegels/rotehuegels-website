import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from('project_activities')
    .insert({
      project_id: id,
      activity_type: body.activity_type || 'note',
      title: body.title,
      description: body.description || null,
      actor: body.actor || null,
      visible_to_client: body.visible_to_client ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
