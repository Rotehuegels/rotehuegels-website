export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET /api/approvals
//   ?mine=1            → only those waiting on the current user (current_level approver)
//   ?status=pending    → status filter
//   ?entity_type=...   → filter by entity type
export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const mine        = url.searchParams.get('mine') === '1';
  const statusParam = url.searchParams.get('status');
  const entityType  = url.searchParams.get('entity_type');

  // ?mine=1 path — pushed into Postgres via an RPC that walks approval_chain
  // with LATERAL jsonb_array_elements. Avoids the previous fetch-then-filter
  // pattern that didn't scale beyond a few hundred rows.
  if (mine && user.email) {
    const { data, error } = await supabaseAdmin.rpc('approvals_pending_for_email', { p_email: user.email });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    let rows = (data ?? []) as Array<{ entity_type: string }>;
    if (entityType) rows = rows.filter((r) => r.entity_type === entityType);
    return NextResponse.json({ data: rows });
  }

  // Generic listing — supports status + entity_type filters.
  let q = supabaseAdmin
    .from('approvals')
    .select('id, entity_type, entity_id, entity_label, requested_by_email, status, current_level, total_levels, approval_chain, amount, created_at, completed_at')
    .order('created_at', { ascending: false });
  if (statusParam) q = q.eq('status', statusParam);
  if (entityType)  q = q.eq('entity_type', entityType);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}
