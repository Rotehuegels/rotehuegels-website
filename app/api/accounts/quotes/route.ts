export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { logAudit } from '@/lib/audit';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

const QuoteItemSchema = z.object({
  item_id:        z.string().optional(),
  sku_id:         z.string(),
  name:           z.string().min(1),
  item_type:      z.enum(['goods', 'service']),
  hsn_code:       z.string().optional(),
  sac_code:       z.string().optional(),
  unit:           z.string(),
  quantity:       z.number().positive(),
  mrp:            z.number().min(0).default(0),
  unit_price:     z.number().min(0),
  discount_pct:   z.number().min(0).max(100).default(0),
  discount_amount: z.number().min(0).default(0),
  taxable_amount: z.number().min(0),
  gst_rate:       z.number().min(0).max(28),
  cgst_rate:      z.number().min(0).default(0),
  sgst_rate:      z.number().min(0).default(0),
  igst_rate:      z.number().min(0).default(0),
  gst_amount:     z.number().min(0).default(0),
  total:          z.number().min(0),
});

const QuoteSchema = z.object({
  customer_id:     z.string().uuid(),
  quote_date:      z.string(),
  valid_until:     z.string().optional(),
  items:           z.array(QuoteItemSchema).min(1),
  subtotal:        z.number().min(0),
  discount_amount: z.number().min(0).default(0),
  taxable_value:   z.number().min(0),
  cgst_amount:     z.number().min(0).default(0),
  sgst_amount:     z.number().min(0).default(0),
  igst_amount:     z.number().min(0).default(0),
  total_amount:    z.number().min(0),
  notes:           z.string().optional(),
  terms:           z.string().optional(),
});

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('quotes')
    .select(`
      id, quote_no, quote_date, valid_until, total_amount, status, created_at,
      customers(id, customer_id, name, state)
    `)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = QuoteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  // Generate quote_no: QT-YYYY-NNN
  const year = new Date().getFullYear();
  const { count } = await supabaseAdmin
    .from('quotes')
    .select('*', { count: 'exact', head: true });
  const seq = String((count ?? 0) + 1).padStart(3, '0');
  const quote_no = `QT-${year}-${seq}`;

  const { data, error } = await supabaseAdmin
    .from('quotes')
    .insert([{ ...parsed.data, quote_no }])
    .select('id, quote_no')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAudit({
    userId: user.id,
    userEmail: user.email ?? undefined,
    action: 'create',
    entityType: 'quote',
    entityId: data.id,
    entityLabel: `Quote ${data.quote_no}`,
    metadata: { total_amount: parsed.data.total_amount },
  });

  return NextResponse.json({ success: true, id: data.id, quote_no: data.quote_no }, { status: 201 });
}
