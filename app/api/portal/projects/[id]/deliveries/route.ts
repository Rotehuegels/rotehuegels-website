import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const portalUser = await getPortalUser();
  if (!portalUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: project } = await supabaseAdmin
    .from('projects').select('id').eq('id', id).eq('customer_id', portalUser.customerId).single();
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Only return client-visible fields — NO shipment_id, carrier, supplier
  const { data } = await supabaseAdmin
    .from('delivery_updates')
    .select('id, title, description, status, expected_date, delivered_date, created_at')
    .eq('project_id', id)
    .eq('visible_to_client', true)
    .order('created_at', { ascending: false });

  return NextResponse.json(data ?? []);
}
