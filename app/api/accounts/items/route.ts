export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { requireApiPermission } from '@/lib/apiAuthz';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

const ItemSchema = z.object({
  item_type:        z.enum(['goods', 'service']),
  name:             z.string().min(1),
  description:      z.string().optional(),
  hsn_code:         z.string().optional(),
  sac_code:         z.string().optional(),
  unit:             z.string().min(1),
  mrp:              z.number().min(0).optional(),
  default_gst_rate: z.number().min(0).max(28).default(18),
  category:         z.string().optional(),
  is_active:        z.boolean().default(true),
  notes:            z.string().optional(),
});

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('items')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const ctx = await requireApiPermission('sales.create');
  if (ctx instanceof NextResponse) return ctx;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = ItemSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  // Generate sku_id: SKU-NNN for goods, SRV-NNN for services
  const prefix = parsed.data.item_type === 'goods' ? 'SKU' : 'SRV';
  const { count } = await supabaseAdmin
    .from('items')
    .select('*', { count: 'exact', head: true })
    .eq('item_type', parsed.data.item_type);
  const seq = String((count ?? 0) + 1).padStart(3, '0');
  const sku_id = `${prefix}-${seq}`;

  const { data, error } = await supabaseAdmin
    .from('items')
    .insert([{ ...parsed.data, sku_id }])
    .select('id, sku_id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id, sku_id: data.sku_id }, { status: 201 });
}
