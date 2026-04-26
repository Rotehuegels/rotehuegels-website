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
  const { data, error } = await supabaseAdmin
    .from('stock_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  // NOTE: 'quantity' is intentionally NOT editable here. Stock changes must
  // flow through stock_movements via /api/accounts/stock/movements so the
  // ledger stays the source of truth. We accept the field for backwards
  // compatibility but strip it before writing.
  const parsed = z.object({
    item_name:      z.string().min(1).optional(),
    item_code:      z.string().optional().nullable(),
    description:    z.string().optional().nullable(),
    category:       z.string().optional().nullable(),
    hsn_code:       z.string().optional().nullable(),
    unit:           z.string().optional(),
    quantity:       z.number().min(0).optional(),                // ignored — see note above
    unit_cost:      z.number().min(0).optional(),
    reorder_level:  z.number().min(0).nullable().optional(),
    reorder_qty:    z.number().min(0).nullable().optional(),
    order_id:       z.string().uuid().optional().nullable(),
    notes:          z.string().optional().nullable(),
  }).safeParse(body);

  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { quantity: _ignoredQty, ...patch } = parsed.data;
  const { error } = await supabaseAdmin.from('stock_items').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { error } = await supabaseAdmin.from('stock_items').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
