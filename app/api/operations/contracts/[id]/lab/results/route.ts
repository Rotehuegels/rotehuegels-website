import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  const body = await req.json();
  const { sample_id, results } = body;

  if (!sample_id || !Array.isArray(results) || results.length === 0) {
    return NextResponse.json({ error: 'sample_id and results array required' }, { status: 400 });
  }

  const rows = results.map((r: { parameter_id: string; value: number; unit: string; min_spec?: number; max_spec?: number; tested_by?: string }) => {
    const withinSpec =
      (r.min_spec == null || r.value >= r.min_spec) &&
      (r.max_spec == null || r.value <= r.max_spec);

    return {
      sample_id,
      parameter_id: r.parameter_id,
      value: r.value,
      unit: r.unit,
      min_spec: r.min_spec ?? null,
      max_spec: r.max_spec ?? null,
      is_within_spec: withinSpec,
      tested_by: r.tested_by || null,
    };
  });

  const { data, error } = await supabaseAdmin
    .from('lab_results')
    .insert(rows)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update sample status to completed
  await supabaseAdmin
    .from('lab_samples')
    .update({ status: 'completed' })
    .eq('id', sample_id);

  return NextResponse.json(data, { status: 201 });
}
