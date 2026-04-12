import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const dross = body.dross_input_kg ?? 0;
  const zinc = body.zinc_recovered_kg ?? 0;
  const power = body.power_kwh ?? 0;
  const price = body.zinc_price_per_kg ?? 0;

  const { data, error } = await supabaseAdmin
    .from('production_logs')
    .insert({
      contract_id: id,
      log_date: body.log_date,
      dross_input_kg: dross,
      zinc_recovered_kg: zinc,
      recovery_rate: dross > 0 ? parseFloat(((zinc / dross) * 100).toFixed(2)) : 0,
      power_kwh: power,
      power_per_kg: zinc > 0 ? parseFloat((power / zinc).toFixed(2)) : 0,
      zinc_price_per_kg: price,
      revenue: parseFloat((zinc * price).toFixed(2)),
      shift: body.shift || 'day',
      operator: body.operator || null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
