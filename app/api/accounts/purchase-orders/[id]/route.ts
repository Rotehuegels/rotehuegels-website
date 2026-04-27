export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { sendPOConfirmation } from '@/lib/notifications';
import { logAudit } from '@/lib/audit';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const [poRes, itemsRes, pmtsRes, grnRes] = await Promise.all([
    supabaseAdmin
      .from('purchase_orders')
      .select(`
        *,
        suppliers(id, legal_name, trade_name, gstin, address, state, pincode, email, phone),
        orders(id, order_no, client_name)
      `)
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('po_items')
      .select('*')
      .eq('po_id', id)
      .order('sl_no'),
    supabaseAdmin
      .from('po_payments')
      .select('*')
      .eq('po_id', id)
      .order('payment_date'),
    supabaseAdmin
      .from('goods_receipt_notes')
      .select('id', { count: 'exact', head: true })
      .eq('po_id', id),
  ]);

  if (poRes.error || !poRes.data)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    data: {
      ...poRes.data,
      items: itemsRes.data ?? [],
      payments: pmtsRes.data ?? [],
      grn_count: grnRes.count ?? 0,
    },
  });
}

const POItemSchema = z.object({
  id:             z.string().uuid().optional(),
  sl_no:          z.number().int().min(1),
  description:    z.string().min(1),
  hsn_code:       z.string().optional().nullable(),
  unit:           z.string().min(1),
  quantity:       z.number().min(0),
  unit_price:     z.number().min(0),
  taxable_amount: z.number(),
  gst_rate:       z.number().min(0).max(28),
  igst_rate:      z.number().min(0),
  cgst_rate:      z.number().min(0),
  sgst_rate:      z.number().min(0),
  gst_amount:     z.number().min(0),
  total:          z.number().min(0),
  notes:          z.string().optional().nullable(),
});

const UpdatePOSchema = z.object({
  status:              z.enum(['draft','sent','acknowledged','partial','received','closed','cancelled']).optional(),
  supplier_id:         z.string().uuid().optional(),
  po_date:             z.string().optional(),
  expected_delivery:   z.string().optional().nullable(),
  supplier_ref:        z.string().optional().nullable(),
  linked_order_id:     z.string().uuid().optional().nullable(),
  notes:               z.string().optional().nullable(),
  terms:               z.string().optional().nullable(),
  // Closure / cancellation context
  closure_type:        z.enum(['full','short']).optional().nullable(),
  closure_reason:      z.string().optional().nullable(),
  cancellation_reason: z.string().optional().nullable(),
  // Financial totals
  subtotal:            z.number().optional(),
  taxable_value:       z.number().optional(),
  igst_amount:         z.number().optional(),
  cgst_amount:         z.number().optional(),
  sgst_amount:         z.number().optional(),
  total_amount:        z.number().optional(),
  // Line items — if provided, replace all existing items
  items:               z.array(POItemSchema).optional(),
});

// Field-level edits (anything beyond pure status/closure metadata) are only
// allowed while the PO is still in draft. Once 'sent', the PO is a commercial
// commitment to the supplier — changes need to go through a formal amendment.
const FIELD_EDIT_KEYS = [
  'supplier_id','po_date','expected_delivery','supplier_ref','linked_order_id',
  'notes','terms','subtotal','taxable_value','igst_amount','cgst_amount',
  'sgst_amount','total_amount',
] as const;

const TERMINAL_STATUSES = new Set(['received','closed','cancelled']);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = UpdatePOSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { items, ...poFields } = parsed.data;

  const { data: prior, error: priorErr } = await supabaseAdmin
    .from('purchase_orders')
    .select('id, po_no, status')
    .eq('id', id)
    .single();
  if (priorErr || !prior) return NextResponse.json({ error: 'PO not found.' }, { status: 404 });

  if (TERMINAL_STATUSES.has(prior.status)) {
    return NextResponse.json({
      error: `PO is ${prior.status} — no further changes allowed.`,
    }, { status: 409 });
  }

  const editingFields = FIELD_EDIT_KEYS.some(k => poFields[k] !== undefined) || items !== undefined;
  if (editingFields && prior.status !== 'draft') {
    return NextResponse.json({
      error: `Field edits are only permitted while the PO is in draft. Current status: ${prior.status}. Use a PO amendment instead.`,
    }, { status: 409 });
  }

  // Status-transition guards
  if (poFields.status === 'cancelled') {
    if (!poFields.cancellation_reason || !poFields.cancellation_reason.trim()) {
      return NextResponse.json({ error: 'cancellation_reason is required.' }, { status: 400 });
    }
    const { count: grnCount } = await supabaseAdmin
      .from('goods_receipt_notes')
      .select('id', { count: 'exact', head: true })
      .eq('po_id', id);
    if ((grnCount ?? 0) > 0) {
      return NextResponse.json({
        error: 'Cannot cancel — goods have been received against this PO. Use Short Close instead.',
      }, { status: 409 });
    }
  }

  if (poFields.status === 'closed') {
    if (!poFields.closure_type) {
      return NextResponse.json({ error: 'closure_type (full|short) is required when closing a PO.' }, { status: 400 });
    }
    if (poFields.closure_type === 'short' && (!poFields.closure_reason || !poFields.closure_reason.trim())) {
      return NextResponse.json({ error: 'closure_reason is required for a short close.' }, { status: 400 });
    }
  }

  // Track whether we're transitioning into 'sent' so we can email the supplier
  // afterwards. We need to know the PRIOR status to avoid re-mailing on every PATCH.
  let willSendToSupplier = false;
  if (poFields.status === 'sent') {
    const { data: approval } = await supabaseAdmin
      .from('approvals').select('status')
      .eq('entity_type', 'purchase_order').eq('entity_id', id).maybeSingle();
    if (approval && approval.status === 'pending') {
      return NextResponse.json({
        error: 'This PO needs approval before it can be sent. Check /d/approvals.',
      }, { status: 409 });
    }
    if (approval && approval.status === 'rejected') {
      return NextResponse.json({
        error: 'This PO was rejected during approval and cannot be sent. Cancel it or revise and resubmit.',
      }, { status: 409 });
    }
    if (prior.status !== 'sent') willSendToSupplier = true;
  }

  const { error: poError } = await supabaseAdmin
    .from('purchase_orders')
    .update({ ...poFields, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (poError) return NextResponse.json({ error: poError.message }, { status: 500 });

  if (poFields.status && poFields.status !== prior.status) {
    logAudit({
      userId: user.id,
      userEmail: user.email ?? undefined,
      action: 'status_change',
      entityType: 'purchase_order',
      entityId: id,
      entityLabel: prior.po_no,
      changes: { status: { old: prior.status, new: poFields.status } },
      metadata: {
        closure_type: poFields.closure_type ?? null,
        closure_reason: poFields.closure_reason ?? null,
        cancellation_reason: poFields.cancellation_reason ?? null,
      },
    });
  }

  // Replace line items if provided
  if (items !== undefined) {
    // Delete all existing items then re-insert
    const { error: delError } = await supabaseAdmin
      .from('po_items')
      .delete()
      .eq('po_id', id);
    if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

    if (items.length > 0) {
      const rows = items.map(({ id: _itemId, ...rest }) => ({ ...rest, po_id: id }));
      const { error: insError } = await supabaseAdmin.from('po_items').insert(rows);
      if (insError) return NextResponse.json({ error: insError.message }, { status: 500 });
    }
  }

  // Auto-email the supplier when status transitioned into 'sent'. Fail-safe —
  // a missing supplier email or SMTP outage shouldn't unwind the status change.
  let emailedSupplier = false;
  if (willSendToSupplier) {
    try {
      await sendPOConfirmation(id);
      emailedSupplier = true;
    } catch (err) {
      console.warn('[purchase-orders] auto-send to supplier failed:', err);
    }
  }

  return NextResponse.json({ success: true, emailed_supplier: emailedSupplier });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { error } = await supabaseAdmin.from('purchase_orders').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
