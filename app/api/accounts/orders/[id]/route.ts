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

// GET — full order detail with stages and payments
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const [orderRes, stagesRes, paymentsRes] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('order_payment_stages')
      .select('*')
      .eq('order_id', id)
      .order('stage_number'),
    supabaseAdmin
      .from('order_payments')
      .select('*')
      .eq('order_id', id)
      .order('payment_date', { ascending: false }),
  ]);

  if (orderRes.error || !orderRes.data)
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  return NextResponse.json({
    order: orderRes.data,
    stages: stagesRes.data ?? [],
    payments: paymentsRes.data ?? [],
  });
}

const UpdateOrderSchema = z.object({
  client_name: z.string().min(1).optional(),
  client_gstin: z.string().optional(),
  client_pan: z.string().optional(),
  description: z.string().optional(),
  order_date: z.string().optional(),
  entry_date: z.string().optional(),
  total_value_incl_gst: z.number().positive().optional(),
  base_value: z.number().positive().optional(),
  gst_rate: z.number().min(0).optional(),
  cgst_amount: z.number().min(0).optional(),
  sgst_amount: z.number().min(0).optional(),
  igst_amount: z.number().min(0).optional(),
  tds_applicable: z.boolean().optional(),
  tds_rate: z.number().min(0).optional(),
  tds_deducted_total: z.number().min(0).optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).optional(),
  notes: z.string().optional(),
  hsn_sac_code: z.string().max(8).optional().nullable(),
});

// PATCH — update order fields
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = UpdateOrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('orders')
    .update(parsed.data)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE — soft-cancel order
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
