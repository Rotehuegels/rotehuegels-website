export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const [poRes, itemsRes, pmtsRes] = await Promise.all([
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
  ]);

  if (poRes.error || !poRes.data)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    data: {
      ...poRes.data,
      items: itemsRes.data ?? [],
      payments: pmtsRes.data ?? [],
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
  status:            z.enum(['draft','sent','acknowledged','partial','received','closed','cancelled']).optional(),
  supplier_id:       z.string().uuid().optional(),
  po_date:           z.string().optional(),
  expected_delivery: z.string().optional().nullable(),
  supplier_ref:      z.string().optional().nullable(),
  linked_order_id:   z.string().uuid().optional().nullable(),
  notes:             z.string().optional().nullable(),
  terms:             z.string().optional().nullable(),
  // Financial totals
  subtotal:          z.number().optional(),
  taxable_value:     z.number().optional(),
  igst_amount:       z.number().optional(),
  cgst_amount:       z.number().optional(),
  sgst_amount:       z.number().optional(),
  total_amount:      z.number().optional(),
  // Line items — if provided, replace all existing items
  items:             z.array(POItemSchema).optional(),
});

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

  const { error: poError } = await supabaseAdmin
    .from('purchase_orders')
    .update({ ...poFields, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (poError) return NextResponse.json({ error: poError.message }, { status: 500 });

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

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { error } = await supabaseAdmin.from('purchase_orders').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
