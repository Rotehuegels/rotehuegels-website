export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('job_posting_versions')
    .select('id, version_no, title, department, location, employment_type, description, requirements, status, edited_by_email, snapshot_at')
    .eq('job_id', id)
    .order('version_no', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
