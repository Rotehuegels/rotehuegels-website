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

const StageSchema = z.object({
  stage_name: z.string().min(1),
  stage_number: z.number().int().positive(),
  percentage: z.number().min(0).max(100).nullable().optional(),
  amount_due: z.number().positive(),
  gst_on_stage: z.number().min(0).default(0),
  tds_rate: z.number().min(0).default(0),
  tds_amount: z.number().min(0).default(0),
  net_receivable: z.number().min(0).optional(),
  due_date: z.string().nullable().optional(),
  trigger_condition: z.string().optional(),
  status: z.enum(['pending', 'partial', 'paid']).default('pending'),
});

const OrderSchema = z.object({
  order_type: z.enum(['goods', 'service']),
  client_name: z.string().min(1),
  client_gstin: z.string().optional(),
  client_pan: z.string().optional(),
  description: z.string().optional(),
  order_date: z.string(),
  entry_date: z.string(),
  total_value_incl_gst: z.number().positive(),
  base_value: z.number().positive().optional(),
  gst_rate: z.number().min(0).default(18),
  cgst_amount: z.number().min(0).default(0),
  sgst_amount: z.number().min(0).default(0),
  igst_amount: z.number().min(0).default(0),
  tds_applicable: z.boolean().default(false),
  tds_rate: z.number().min(0).default(0),
  notes: z.string().optional(),
  stages: z.array(StageSchema).optional(),
});

// GET — list all orders with payment summary
export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id, order_no, order_type, order_category, client_name, description,
      order_date, entry_date, total_value_incl_gst, base_value,
      tds_applicable, tds_rate, tds_deducted_total, status, notes,
      created_at,
      order_payments(amount_received, tds_deducted, net_received)
    `)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Compute totals per order
  const enriched = (orders ?? []).map(o => {
    const pmts = (o.order_payments ?? []) as { amount_received: number; tds_deducted: number; net_received: number }[];
    const totalReceived = pmts.reduce((s, p) => s + (p.amount_received ?? 0), 0);
    const totalNetReceived = pmts.reduce((s, p) => s + (p.net_received ?? 0), 0);
    const totalTds = pmts.reduce((s, p) => s + (p.tds_deducted ?? 0), 0);
    const pending = (o.total_value_incl_gst ?? 0) - totalReceived;
    return { ...o, totalReceived, totalNetReceived, totalTds, pending, order_payments: undefined };
  });

  return NextResponse.json({ data: enriched });
}

// POST — create order (with optional stages)
export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = OrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { stages, ...orderData } = parsed.data;

  // Generate order_no
  const prefix = orderData.order_type === 'service' ? 'SVC' : 'GDS';
  const year = new Date().getFullYear();
  const { count } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('order_type', orderData.order_type);
  const seq = String((count ?? 0) + 1).padStart(3, '0');
  const order_no = `${prefix}-${year}-${seq}`;

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .insert([{ ...orderData, order_no }])
    .select('id, order_no')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insert stages if provided
  if (stages?.length) {
    const stagesWithOrder = stages.map(s => ({
      ...s,
      order_id: order.id,
      net_receivable: s.net_receivable ?? (s.amount_due + s.gst_on_stage - s.tds_amount),
    }));
    const { error: stageErr } = await supabaseAdmin
      .from('order_payment_stages')
      .insert(stagesWithOrder);
    if (stageErr) return NextResponse.json({ error: stageErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: order.id, order_no: order.order_no }, { status: 201 });
}
