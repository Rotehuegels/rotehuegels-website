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
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = POSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  // Generate PO number: PO-YYYY-NNN
  const year = new Date(parsed.data.po_date).getFullYear();
  const { count } = await supabaseAdmin
    .from('purchase_orders')
    .select('*', { count: 'exact', head: true });
  const seq = String((count ?? 0) + 1).padStart(3, '0');
  const po_no = `PO-${year}-${seq}`;

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

  return NextResponse.json({ success: true, id: po.id, po_no: po.po_no }, { status: 201 });
}
