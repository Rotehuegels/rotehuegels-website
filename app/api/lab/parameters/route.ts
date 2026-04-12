import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const industryId = searchParams.get('industry_id');
  const sampleType = searchParams.get('sample_type');

  let query = supabaseAdmin
    .from('lab_parameters')
    .select('*, lab_instruments(code, name), lab_industries(code, name)')
    .eq('is_active', true)
    .order('name');

  if (industryId) query = query.eq('industry_id', industryId);
  if (sampleType) query = query.eq('sample_type', sampleType);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
