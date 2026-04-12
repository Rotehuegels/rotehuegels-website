import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; sampleId: string }> }) {
  const portalUser = await getPortalUser();
  if (!portalUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, sampleId } = await params;

  const { data: project } = await supabaseAdmin
    .from('projects').select('id').eq('id', id).eq('customer_id', portalUser.customerId).single();
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: sample } = await supabaseAdmin
    .from('lab_samples')
    .select('*, lab_results(*, lab_parameters(name, unit, category, sample_type))')
    .eq('id', sampleId)
    .single();

  if (!sample) return NextResponse.json({ error: 'Sample not found' }, { status: 404 });
  return NextResponse.json(sample);
}
