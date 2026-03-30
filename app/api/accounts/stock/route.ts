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

const StockSchema = z.object({
  item_name: z.string().min(1),
  item_code: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  hsn_code: z.string().optional(),
  unit: z.string().default('pcs'),
  quantity: z.number().min(0).default(0),
  unit_cost: z.number().min(0).default(0),
  order_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// GET — list stock items
export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('stock_items')
    .select('*, orders(order_no, client_name)')
    .order('item_name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

// POST — add stock item
export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = StockSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('stock_items')
    .insert([parsed.data])
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
