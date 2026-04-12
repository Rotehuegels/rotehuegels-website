import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const portalUser = await getPortalUser();
  if (!portalUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '60');

  const { data: project } = await supabaseAdmin
    .from('projects').select('id').eq('id', id).eq('customer_id', portalUser.customerId).single();
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: contract } = await supabaseAdmin
    .from('operations_contracts').select('id').eq('project_id', id).single();
  if (!contract) return NextResponse.json([]);

  const { data } = await supabaseAdmin
    .from('production_logs')
    .select('log_date, dross_input_kg, zinc_recovered_kg, recovery_rate, power_kwh, power_per_kg, revenue')
    .eq('contract_id', contract.id)
    .order('log_date', { ascending: false })
    .limit(limit);

  return NextResponse.json(data ?? []);
}
