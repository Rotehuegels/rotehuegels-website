export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

const CreateSchema = z.object({
  stock_item_id:      z.string().uuid(),
  movement_type:      z.enum(['receipt','issue','adjustment','transfer']),
  quantity:           z.coerce.number().refine((n) => n !== 0, 'Quantity must be non-zero'),
  unit_cost:          z.coerce.number().nonnegative().optional(),
  warehouse_location: z.string().optional(),
  notes:              z.string().min(1, 'Notes are required for manual movements'),
});

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET /api/accounts/stock/movements?stock_item_id=...&type=...
export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const itemId = url.searchParams.get('stock_item_id');
  const type   = url.searchParams.get('type');
  const limit  = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 500);

  let q = supabaseAdmin
    .from('stock_movements')
    .select('id, stock_item_id, movement_type, quantity, unit_cost, source_type, source_id, warehouse_location, created_by_email, notes, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (itemId) q = q.eq('stock_item_id', itemId);
  if (type)   q = q.eq('movement_type', type);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST — manual adjustment / receipt / issue.
// Sign convention: receipt and issue auto-sign; adjustment trusts the caller.
export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  // Coerce sign based on type
  let qty = parsed.data.quantity;
  if (parsed.data.movement_type === 'receipt' && qty < 0)  qty = -qty;
  if (parsed.data.movement_type === 'issue'   && qty > 0)  qty = -qty;
  // 'adjustment' and 'transfer' keep the caller's sign

  // Block negative resulting balance for issues (defensive — the trigger will run regardless)
  if (qty < 0) {
    const { data: si } = await supabaseAdmin
      .from('stock_items')
      .select('quantity')
      .eq('id', parsed.data.stock_item_id)
      .single();
    if (si && Number(si.quantity ?? 0) + qty < -0.0001) {
      return NextResponse.json({
        error: `Issuing ${Math.abs(qty)} would push stock below zero (current: ${si.quantity}). Adjust first if this is intentional.`,
      }, { status: 409 });
    }
  }

  const { data: id, error } = await supabaseAdmin.rpc('record_stock_movement', {
    p_stock_item_id:      parsed.data.stock_item_id,
    p_movement_type:      parsed.data.movement_type,
    p_quantity:           qty,
    p_unit_cost:          parsed.data.unit_cost ?? null,
    p_source_type:        'manual',
    p_source_id:          null,
    p_warehouse_location: parsed.data.warehouse_location ?? 'Main Store',
    p_created_by_email:   user.email ?? null,
    p_notes:              parsed.data.notes,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, id }, { status: 201 });
}
