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

  let q = supabaseAdmin
    .from('approvals')
    .select('id, entity_type, entity_id, entity_label, requested_by_email, status, current_level, total_levels, approval_chain, amount, created_at, completed_at')
    .order('created_at', { ascending: false });
  if (statusParam) q = q.eq('status', statusParam);
  if (entityType)  q = q.eq('entity_type', entityType);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let rows = data ?? [];
  if (mine && user.email) {
    const me = user.email.toLowerCase();
    rows = rows.filter((row) => {
      if (row.status !== 'pending') return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chain = row.approval_chain as any[];
      const step = chain.find((s) => s.level === row.current_level);
      return step?.approver_email?.toLowerCase() === me;
    });
  }

  return NextResponse.json({ data: rows });
}
