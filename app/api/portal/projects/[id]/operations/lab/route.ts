import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const portalUser = await getPortalUser();
  if (!portalUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const typeFilter = searchParams.get('type');

  const { data: project } = await supabaseAdmin
    .from('projects').select('id').eq('id', id).eq('customer_id', portalUser.customerId).single();
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: contract } = await supabaseAdmin
    .from('operations_contracts').select('id').eq('project_id', id).single();
  if (!contract) return NextResponse.json([]);

  let query = supabaseAdmin
    .from('lab_samples')
    .select('*, lab_results(*, lab_parameters(name, unit, category))')
    .eq('contract_id', contract.id)
    .order('collected_at', { ascending: false })
    .limit(50);

  if (typeFilter) query = query.eq('sample_type', typeFilter);

  const { data } = await query;
  return NextResponse.json(data ?? []);
}
