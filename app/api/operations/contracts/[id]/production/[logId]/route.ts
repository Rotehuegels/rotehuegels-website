import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; logId: string }> }) {
  const { logId } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = {};
  for (const key of ['log_date', 'dross_input_kg', 'zinc_recovered_kg', 'power_kwh', 'zinc_price_per_kg', 'shift', 'operator', 'notes']) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  // Recalculate derived fields
  const dross = (update.dross_input_kg ?? body.dross_input_kg ?? 0) as number;
  const zinc = (update.zinc_recovered_kg ?? body.zinc_recovered_kg ?? 0) as number;
  const power = (update.power_kwh ?? body.power_kwh ?? 0) as number;
  const price = (update.zinc_price_per_kg ?? body.zinc_price_per_kg ?? 0) as number;

  if (dross > 0) update.recovery_rate = parseFloat(((zinc / dross) * 100).toFixed(2));
  if (zinc > 0) update.power_per_kg = parseFloat((power / zinc).toFixed(2));
  update.revenue = parseFloat((zinc * price).toFixed(2));

  const { data, error } = await supabaseAdmin
    .from('production_logs')
    .update(update)
    .eq('id', logId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
