export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ rexId: string }> }
) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rexId } = await params;

  const { data, error } = await supabaseAdmin
    .from('rex_members')
    .select('*')
    .eq('rex_id', rexId.toUpperCase())
    .single();

  if (error || !data) return NextResponse.json({ data: null }, { status: 200 });
  return NextResponse.json({ data });
}
