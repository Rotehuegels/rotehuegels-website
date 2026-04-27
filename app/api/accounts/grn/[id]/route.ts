export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { logAudit } from '@/lib/audit';

const TERMINAL = new Set(['accepted', 'rejected', 'partial']);

const PatchSchema = z.object({
  status: z.enum(['inspected', 'accepted', 'rejected', 'partial']),
  inspection_notes: z.string().optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { data: prior, error: priorErr } = await supabaseAdmin
    .from('goods_receipt_notes')
    .select('id, grn_no, status')
    .eq('id', id)
    .single();
  if (priorErr || !prior) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (TERMINAL.has(prior.status)) {
    return NextResponse.json({
      error: `GRN is already ${prior.status}; status is final and cannot be changed.`,
    }, { status: 409 });
  }

  const { error } = await supabaseAdmin
    .from('goods_receipt_notes')
    .update({
      status: parsed.data.status,
      inspection_notes: parsed.data.inspection_notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAudit({
    userId: user.id,
    userEmail: user.email ?? undefined,
    action: 'status_change',
    entityType: 'grn',
    entityId: id,
    entityLabel: prior.grn_no,
    changes: { status: { old: prior.status, new: parsed.data.status } },
  });

  return NextResponse.json({ success: true });
}
