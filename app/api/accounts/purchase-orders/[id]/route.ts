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

const UpdatePOSchema = z.object({
  status:            z.enum(['draft','sent','acknowledged','partial','received','closed','cancelled']).optional(),
  po_date:           z.string().optional(),
  expected_delivery: z.string().optional().nullable(),
  supplier_ref:      z.string().optional().nullable(),
  notes:             z.string().optional().nullable(),
  terms:             z.string().optional().nullable(),
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

  const { error } = await supabaseAdmin
    .from('purchase_orders')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
