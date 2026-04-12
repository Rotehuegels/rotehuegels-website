import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from('delivery_updates')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from('delivery_updates')
    .insert({
      project_id: id,
      shipment_id: body.shipment_id || null,
      title: body.title,
      description: body.description || null,
      status: body.status || 'dispatched',
      expected_date: body.expected_date || null,
      visible_to_client: body.visible_to_client ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also log as project activity
  await supabaseAdmin.from('project_activities').insert({
    project_id: id,
    activity_type: 'deliverable',
    title: body.title,
    description: body.description || null,
    actor: 'Rotehügels',
    visible_to_client: true,
  });

  return NextResponse.json(data, { status: 201 });
}
