import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // Generate sample code
  const now = new Date();
  const prefix = { zinc: 'ZN', electrolyte: 'EL', dross: 'DR', water: 'WQ' }[body.sample_type as string] || 'SM';
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
  const { count } = await supabaseAdmin
    .from('lab_samples')
    .select('id', { count: 'exact', head: true })
    .eq('contract_id', id);

  const code = `${prefix}-${dateStr}-${String((count ?? 0) + 1).padStart(3, '0')}`;

  const { data, error } = await supabaseAdmin
    .from('lab_samples')
    .insert({
      contract_id: id,
      sample_code: code,
      sample_type: body.sample_type,
      collected_at: body.collected_at || now.toISOString(),
      collected_by: body.collected_by || null,
      notes: body.notes || null,
      status: 'collected',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
