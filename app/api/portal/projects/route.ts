import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';

export async function GET() {
  const portalUser = await getPortalUser();
  if (!portalUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('id, project_code, name, status, completion_pct, start_date, target_end_date, site_location, project_manager')
    .eq('customer_id', portalUser.customerId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
