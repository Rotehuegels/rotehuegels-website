import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logAudit } from '@/lib/audit';
import { requireApiPermission } from '@/lib/apiAuthz';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const GRNItemSchema = z.object({
  po_item_id: z.string().uuid().optional().nullable(),
  description: z.string().min(1),
  hsn_code: z.string().optional(),
  ordered_qty: z.number().min(0),
  received_qty: z.number().min(0),
  accepted_qty: z.number().min(0),
  rejected_qty: z.number().min(0).default(0),
  unit: z.string().default('NOS'),
  unit_price: z.number().min(0),
  remarks: z.string().optional(),
});

const GRNSchema = z.object({
  po_id: z.string().uuid().optional().nullable(),
  supplier_id: z.string().uuid().optional().nullable(),
  receipt_date: z.string(),
  received_by: z.string().optional(),
  warehouse_location: z.string().default('Main Store'),
  delivery_note_no: z.string().optional(),
  vehicle_no: z.string().optional(),
  transporter: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(GRNItemSchema).min(1),
});

// GET — list all GRNs
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('goods_receipt_notes')
    .select('*, suppliers(legal_name), purchase_orders(po_no)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST — create new GRN
export async function POST(req: Request) {
  const ctx = await requireApiPermission('procurement.create');
  if (ctx instanceof NextResponse) return ctx;
  const user = { id: ctx.userId, email: ctx.email };

  const body = await req.json();
  const parsed = GRNSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { items, ...grnData } = parsed.data;

  // Generate GRN number atomically. Same race fix as PO numbering.
  const { data: grnNo, error: grnNoErr } = await supabaseAdmin.rpc('next_grn_no');
  if (grnNoErr || !grnNo) {
    return NextResponse.json({ error: 'Could not generate GRN number.' }, { status: 500 });
  }

  const { data: grn, error } = await supabaseAdmin
    .from('goods_receipt_notes')
    .insert({ ...grnData, grn_no: grnNo })
    .select('id, grn_no')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insert items and capture their IDs so we can link stock movements back to GRN lines
  const grnItems = items.map(item => ({ ...item, grn_id: grn.id }));
  const { data: insertedItems } = await supabaseAdmin
    .from('grn_items')
    .insert(grnItems)
    .select('id, description, accepted_qty, unit_price');

  // Receipt every accepted line into the stock_movements ledger so the audit
  // trail traces back to the GRN. The ledger trigger will recompute
  // stock_items.quantity automatically.
  for (const gi of insertedItems ?? []) {
    if (Number(gi.accepted_qty ?? 0) <= 0 || !gi.description) continue;
    const { data: si } = await supabaseAdmin
      .from('stock_items')
      .select('id')
      .eq('item_name', gi.description)
      .maybeSingle();
    if (!si) continue;   // no matching stock item — skip silently (matches legacy behaviour)

    await supabaseAdmin.rpc('record_stock_movement', {
      p_stock_item_id:    si.id,
      p_movement_type:    'receipt',
      p_quantity:         gi.accepted_qty,
      p_unit_cost:        gi.unit_price,
      p_source_type:      'grn',
      p_source_id:        gi.id,
      p_created_by_email: user.email ?? null,
      p_notes:            `Receipt against ${grnNo}`,
    });
  }

  logAudit({
    userId: user.id, userEmail: user.email ?? undefined,
    action: 'create', entityType: 'grn', entityId: grn.id,
    entityLabel: `${grn.grn_no} - ${items.length} items`,
  });

  return NextResponse.json({ success: true, id: grn.id, grn_no: grnNo }, { status: 201 });
}
