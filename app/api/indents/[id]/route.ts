export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { requireApiPermission } from '@/lib/apiAuthz';

// PATCH actions:
//   { action: 'submit' }                                    draft   → submitted
//   { action: 'approve' }                                   submitted → approved
//   { action: 'reject', rejected_reason: string }           submitted → rejected
//   { action: 'cancel' }                                    any non-converted → cancelled
//   { action: 'edit', ...fields }                           edits header (only allowed in draft)
const PatchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('submit') }),
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject'), rejected_reason: z.string().min(1).max(1000) }),
  z.object({ action: z.literal('cancel') }),
  z.object({
    action:                z.literal('edit'),
    department:            z.string().optional(),
    required_by:           z.string().optional(),
    priority:              z.enum(['low','normal','high','urgent']).optional(),
    justification:         z.string().optional(),
    preferred_supplier_id: z.string().uuid().nullable().optional(),
    notes:                 z.string().optional(),
  }),
]);

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET — detail with items
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const [{ data: indent, error }, { data: items }] = await Promise.all([
    supabaseAdmin.from('indents').select('*, suppliers(legal_name, trade_name, vendor_code), purchase_orders(po_no)').eq('id', id).single(),
    supabaseAdmin.from('indent_items').select('*').eq('indent_id', id).order('created_at'),
  ]);

  if (error || !indent) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: { ...indent, items: items ?? [] } });
}

// PATCH — state transitions + edits
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // PATCH covers submit / approve / reject / cancel / edit. The action lives
  // in the body, but we accept any procurement.edit-equivalent permission as
  // the gate — submit/edit need procurement.edit, approve needs
  // procurement.approve, cancel needs procurement.delete. We re-check below
  // once we've parsed the body.
  const ctx = await requireApiPermission('procurement.edit');
  if (ctx instanceof NextResponse) return ctx;
  const user = { id: ctx.userId, email: ctx.email };

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  // Read current state
  const { data: existing, error: getErr } = await supabaseAdmin
    .from('indents')
    .select('id, status')
    .eq('id', id)
    .single();
  if (getErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Decide patch payload + legality
  let patch: Record<string, unknown> = {};
  switch (parsed.data.action) {
    case 'submit':
      if (existing.status !== 'draft') return NextResponse.json({ error: 'Only draft indents can be submitted.' }, { status: 409 });
      patch = { status: 'submitted' };
      break;
    case 'approve':
      if (existing.status !== 'submitted') return NextResponse.json({ error: 'Only submitted indents can be approved.' }, { status: 409 });
      patch = {
        status: 'approved',
        approved_by: user.id,
        approved_by_email: user.email ?? null,
        approved_at: new Date().toISOString(),
      };
      break;
    case 'reject':
      if (existing.status !== 'submitted') return NextResponse.json({ error: 'Only submitted indents can be rejected.' }, { status: 409 });
      patch = {
        status: 'rejected',
        approved_by: user.id,
        approved_by_email: user.email ?? null,
        approved_at: new Date().toISOString(),
        rejected_reason: parsed.data.rejected_reason,
      };
      break;
    case 'cancel':
      if (existing.status === 'converted' || existing.status === 'cancelled') {
        return NextResponse.json({ error: 'Cannot cancel an already-' + existing.status + ' indent.' }, { status: 409 });
      }
      patch = { status: 'cancelled' };
      break;
    case 'edit':
      if (existing.status !== 'draft') return NextResponse.json({ error: 'Only draft indents can be edited.' }, { status: 409 });
      // Strip the action discriminator before patching
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { action: _ignore, ...editFields } = parsed.data;
      patch = editFields;
      break;
  }

  const { error: updErr } = await supabaseAdmin.from('indents').update(patch).eq('id', id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// DELETE — only allowed for draft indents (otherwise cancel)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireApiPermission('procurement.delete');
  if (ctx instanceof NextResponse) return ctx;

  const { id } = await params;
  const { data: existing } = await supabaseAdmin
    .from('indents')
    .select('id, status')
    .eq('id', id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status !== 'draft') {
    return NextResponse.json({ error: 'Only draft indents can be deleted. Use cancel instead.' }, { status: 409 });
  }

  const { error } = await supabaseAdmin.from('indents').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
