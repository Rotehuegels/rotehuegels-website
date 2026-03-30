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

const PaymentSchema = z.object({
  stage_id: z.string().uuid().optional(),
  payment_date: z.string(),
  amount_received: z.number().positive(),
  tds_deducted: z.number().min(0).default(0),
  payment_mode: z.enum(['NEFT', 'RTGS', 'IMPS', 'Cheque', 'Cash', 'UPI', 'Other']).default('NEFT'),
  reference_no: z.string().optional(),
  notes: z.string().optional(),
});

// POST — record a new payment against an order
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: order_id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = PaymentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { tds_deducted, amount_received, ...rest } = parsed.data;
  const net_received = amount_received - tds_deducted;

  // Insert payment
  const { data: payment, error } = await supabaseAdmin
    .from('order_payments')
    .insert([{ order_id, tds_deducted, amount_received, net_received, ...rest }])
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If linked to a stage, update stage status
  if (parsed.data.stage_id) {
    const { data: stage } = await supabaseAdmin
      .from('order_payment_stages')
      .select('net_receivable')
      .eq('id', parsed.data.stage_id)
      .single();

    if (stage) {
      const stageStatus = net_received >= (stage.net_receivable ?? 0) ? 'paid' : 'partial';
      await supabaseAdmin
        .from('order_payment_stages')
        .update({ status: stageStatus })
        .eq('id', parsed.data.stage_id);
    }
  }

  // Update cumulative TDS on the order
  const { data: allPmts } = await supabaseAdmin
    .from('order_payments')
    .select('tds_deducted')
    .eq('order_id', order_id);

  const totalTds = (allPmts ?? []).reduce((s, p) => s + (p.tds_deducted ?? 0), 0);
  await supabaseAdmin
    .from('orders')
    .update({ tds_deducted_total: totalTds })
    .eq('id', order_id);

  return NextResponse.json({ success: true, id: payment.id }, { status: 201 });
}

// DELETE — remove a payment record
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: order_id } = await params;
  const url = new URL(req.url);
  const paymentId = url.searchParams.get('paymentId');
  if (!paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('order_payments')
    .delete()
    .eq('id', paymentId)
    .eq('order_id', order_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
