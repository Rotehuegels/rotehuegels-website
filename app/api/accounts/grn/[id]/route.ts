export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logAudit } from '@/lib/audit';
import { requireApiPermission } from '@/lib/apiAuthz';

const TERMINAL = new Set(['accepted', 'rejected', 'partial', 'voided']);

// Whichever target status the user picks, these all flip the GRN to a state
// where the receipts posted at GRN creation must be backed out of inventory.
const REVERSAL_STATUSES = new Set(['rejected', 'voided']);

const PatchSchema = z.object({
  status:           z.enum(['inspected', 'accepted', 'rejected', 'partial', 'voided']),
  inspection_notes: z.string().optional().nullable(),
  rejection_reason: z.string().optional().nullable(),
  void_reason:      z.string().optional().nullable(),
});

async function reverseStockReceipts(
  grnId: string,
  grnNo: string,
  newStatus: string,
  reason: string | null,
  userEmail: string | null,
) {
  // 1. Find every grn_item on this GRN (we look up by GRN id, not by joining,
  //    because RLS on stock_movements may vary).
  const { data: grnItems } = await supabaseAdmin
    .from('grn_items').select('id').eq('grn_id', grnId);
  const grnItemIds = (grnItems ?? []).map(x => x.id);
  if (grnItemIds.length === 0) return;

  // 2. Pull every receipt movement that was posted against any of those lines.
  const { data: receipts } = await supabaseAdmin
    .from('stock_movements')
    .select('stock_item_id, quantity, unit_cost, source_id')
    .eq('source_type', 'grn')
    .eq('movement_type', 'receipt')
    .in('source_id', grnItemIds);

  // 3. Post a matching negative 'adjustment' for each. The same source_id keeps
  //    them paired in the audit trail; the PATCH terminal-status guard above
  //    prevents this from running twice on the same GRN.
  for (const r of receipts ?? []) {
    await supabaseAdmin.rpc('record_stock_movement', {
      p_stock_item_id:    r.stock_item_id,
      p_movement_type:    'adjustment',
      p_quantity:         -Number(r.quantity),
      p_unit_cost:        r.unit_cost,
      p_source_type:      'grn',
      p_source_id:        r.source_id,
      p_created_by_email: userEmail,
      p_notes:            `Reversal — GRN ${grnNo} ${newStatus}${reason ? `: ${reason}` : ''}`,
    });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Status transitions on a GRN are an "edit" — voiding/rejecting/accepting
  // alters the inventory ledger and the audit trail. Gate on procurement.edit.
  const ctx = await requireApiPermission('procurement.edit');
  if (ctx instanceof NextResponse) return ctx;
  const user = { id: ctx.userId, email: ctx.email };

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

  // Voiding is for create-time mistakes — only permitted before any inspection
  // outcome has been recorded. After 'inspected' the right action is reject.
  if (parsed.data.status === 'voided' && prior.status !== 'pending') {
    return NextResponse.json({
      error: `Void is only allowed on pending GRNs. This GRN is ${prior.status} — use Reject instead.`,
    }, { status: 409 });
  }

  if (parsed.data.status === 'rejected' && !parsed.data.rejection_reason?.trim() && !parsed.data.inspection_notes?.trim()) {
    return NextResponse.json({ error: 'rejection_reason is required.' }, { status: 400 });
  }
  if (parsed.data.status === 'voided' && !parsed.data.void_reason?.trim()) {
    return NextResponse.json({ error: 'void_reason is required.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('goods_receipt_notes')
    .update({
      status:           parsed.data.status,
      inspection_notes: parsed.data.inspection_notes ?? null,
      rejection_reason: parsed.data.rejection_reason ?? null,
      void_reason:      parsed.data.void_reason ?? null,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Reverse stock receipts for reject / void. Fail-safe: a reversal failure must
  // not unwind the status change (otherwise the GRN gets stuck in limbo). It IS
  // logged so an admin can chase any divergence.
  if (REVERSAL_STATUSES.has(parsed.data.status)) {
    try {
      await reverseStockReceipts(
        id,
        prior.grn_no,
        parsed.data.status,
        parsed.data.rejection_reason ?? parsed.data.void_reason ?? parsed.data.inspection_notes ?? null,
        user.email ?? null,
      );
    } catch (err) {
      console.error('[grn] stock reversal failed for', prior.grn_no, err);
    }
  }

  logAudit({
    userId: user.id,
    userEmail: user.email ?? undefined,
    action: 'status_change',
    entityType: 'grn',
    entityId: id,
    entityLabel: prior.grn_no,
    changes: { status: { old: prior.status, new: parsed.data.status } },
    metadata: {
      rejection_reason: parsed.data.rejection_reason ?? null,
      void_reason:      parsed.data.void_reason ?? null,
    },
  });

  return NextResponse.json({ success: true });
}
