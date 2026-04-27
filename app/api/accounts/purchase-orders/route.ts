export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { requestApproval, resolveApproverEmail } from '@/lib/approvals';
import { requireApiPermission } from '@/lib/apiAuthz';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

const POItemSchema = z.object({
  sl_no:          z.number().int().positive(),
  description:    z.string().min(1),
  hsn_code:       z.string().optional(),
  unit:           z.string().default('pcs'),
  quantity:       z.number().positive(),
  unit_price:     z.number().min(0),
  taxable_amount: z.number().min(0),
  gst_rate:       z.number().min(0).max(28),
  igst_rate:      z.number().min(0).default(0),
  cgst_rate:      z.number().min(0).default(0),
  sgst_rate:      z.number().min(0).default(0),
  gst_amount:     z.number().min(0).default(0),
  total:          z.number().min(0),
  notes:          z.string().optional(),
});

const POSchema = z.object({
  supplier_id:       z.string().uuid(),
  po_date:           z.string(),
  expected_delivery: z.string().optional(),
  status:            z.enum(['draft','sent','acknowledged','partial','received','closed','cancelled']).default('draft'),
  supplier_ref:      z.string().optional(),
  linked_order_id:   z.string().uuid().optional(),
  bill_to:           z.record(z.string(), z.unknown()).default({}),
  ship_to:           z.record(z.string(), z.unknown()).optional(),
  items:             z.array(POItemSchema).min(1),
  subtotal:          z.number().min(0),
  taxable_value:     z.number().min(0),
  igst_amount:       z.number().min(0).default(0),
  cgst_amount:       z.number().min(0).default(0),
  sgst_amount:       z.number().min(0).default(0),
  total_amount:      z.number().min(0),
  notes:             z.string().optional(),
  terms:             z.string().optional(),
});

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('purchase_orders')
    .select(`
      id, po_no, po_date, status, total_amount, supplier_ref, created_at,
      suppliers(id, legal_name, gstin, state),
      orders(id, order_no, client_name)
    `)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach total paid per PO
  const ids = (data ?? []).map(p => p.id);
  if (ids.length) {
    const { data: pmts } = await supabaseAdmin
      .from('po_payments')
      .select('po_id, amount')
      .in('po_id', ids);

    const paidMap: Record<string, number> = {};
    for (const p of pmts ?? []) {
      paidMap[p.po_id] = (paidMap[p.po_id] ?? 0) + p.amount;
    }
    return NextResponse.json({
      data: (data ?? []).map(po => ({
        ...po,
        total_paid: paidMap[po.id] ?? 0,
      })),
    });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  const ctx = await requireApiPermission('procurement.create');
  if (ctx instanceof NextResponse) return ctx;
  const user = { id: ctx.userId, email: ctx.email };

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = POSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  // Generate PO number atomically via next_po_no() RPC. The previous
  // count()-based pattern was racy under concurrent POSTs (two requests
  // could read the same count and produce duplicate PO-YYYY-NNN).
  const { data: po_no, error: noErr } = await supabaseAdmin.rpc('next_po_no', { p_date: parsed.data.po_date });
  if (noErr || !po_no) {
    return NextResponse.json({ error: 'Could not generate PO number.' }, { status: 500 });
  }

  const { items, ...poData } = parsed.data;

  const { data: po, error: poErr } = await supabaseAdmin
    .from('purchase_orders')
    .insert([{ ...poData, po_no }])
    .select('id, po_no')
    .single();

  if (poErr) return NextResponse.json({ error: poErr.message }, { status: 500 });

  const { error: itemsErr } = await supabaseAdmin
    .from('po_items')
    .insert(items.map(item => ({ ...item, po_id: po.id })));

  if (itemsErr) {
    // Rollback PO header if items fail
    await supabaseAdmin.from('purchase_orders').delete().eq('id', po.id);
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  // Threshold-driven approval gate. The approver is resolved through the org
  // chart cascade: po.approver_position_id (default 'cfo') walks up reports_to_id
  // until it finds a filled position, then uses that employee's email. If the
  // entire chain is vacant (typical for solo ops before any positions are filled),
  // we skip the gate — there's no one to route to. Once the CEO position is
  // assigned to a real employee, the cascade always resolves and gates kick in.
  let approvalRequested = false;
  try {
    const { data: settings } = await supabaseAdmin
      .from('app_settings')
      .select('key, value')
      .in('key', ['po.approval_threshold', 'po.approver_position_id']);
    const cfg = Object.fromEntries((settings ?? []).map((r) => [r.key, r.value]));
    const threshold        = Number(cfg['po.approval_threshold'] ?? 0);
    const approverPosition = String(cfg['po.approver_position_id'] ?? 'cfo').trim();

    if (threshold > 0 && parsed.data.total_amount > threshold) {
      const approverEmail = await resolveApproverEmail(approverPosition);
      if (approverEmail) {
        await requestApproval({
          entity_type:        'purchase_order',
          entity_id:          po.id,
          entity_label:       `${po.po_no} — ₹${parsed.data.total_amount.toLocaleString('en-IN')}`,
          requested_by_id:    user.id,
          requested_by_email: user.email ?? undefined,
          amount:             parsed.data.total_amount,
          approver_emails:    [approverEmail],
          notes:              `PO above ₹${threshold.toLocaleString('en-IN')} threshold (resolved via ${approverPosition})`,
        });
        approvalRequested = true;
      }
      // approverEmail null = entire chain vacant; PO goes through unblocked
    }
  } catch (e) {
    // Approval request shouldn't block PO creation — log and move on
    console.warn('[purchase-orders] Could not request approval:', e);
  }

  return NextResponse.json({
    success: true,
    id: po.id,
    po_no: po.po_no,
    approval_requested: approvalRequested,
  }, { status: 201 });
}
