export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { getUserRole } from '@/lib/portalAuth';
import { decide } from '@/lib/approvals';

const PatchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve'), notes: z.string().max(1000).optional() }),
  z.object({ action: z.literal('reject'),  notes: z.string().min(1).max(1000) }),
  z.object({ action: z.literal('cancel') }),
]);

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
    .from('approvals')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  if (parsed.data.action === 'cancel') {
    // Allowed: the original requester OR an admin (so a solo founder isn't
    // locked out when the requester is unavailable / has left).
    const [{ data: row }, role] = await Promise.all([
      supabaseAdmin
        .from('approvals')
        .select('requested_by_email, status')
        .eq('id', id)
        .single(),
      getUserRole(),
    ]);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (row.status !== 'pending') {
      return NextResponse.json({ error: `Cannot cancel a ${row.status} approval.` }, { status: 409 });
    }
    const isRequester = (row.requested_by_email ?? '').toLowerCase() === user.email.toLowerCase();
    const isAdmin     = role === 'admin';
    if (!isRequester && !isAdmin) {
      return NextResponse.json({ error: 'Only the requester or an admin can cancel.' }, { status: 403 });
    }
    await supabaseAdmin
      .from('approvals')
      .update({ status: 'cancelled', completed_at: new Date().toISOString() })
      .eq('id', id);
    return NextResponse.json({ success: true });
  }

  // approve / reject — delegate to lib
  try {
    const result = await decide({
      approval_id: id,
      actor_email: user.email,
      action:      parsed.data.action,
      notes:       'notes' in parsed.data ? parsed.data.notes : undefined,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Decision failed';
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}
