import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  delete body.id; delete body.created_at;

  if (body.status === 'delivered' && !body.delivered_date) body.delivered_date = new Date().toISOString().split('T')[0];

  const { data, error } = await supabaseAdmin.from('shipments').update(body).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await supabaseAdmin.from('shipments').delete().eq('id', id);
  return NextResponse.json({ success: true });
}
