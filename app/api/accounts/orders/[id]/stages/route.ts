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

// POST — add a new payment stage to an order
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: order_id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = StageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('order_payment_stages')
    .insert([{
      ...parsed.data,
      order_id,
      net_receivable: parsed.data.net_receivable
        ?? (parsed.data.amount_due + parsed.data.gst_on_stage - parsed.data.tds_amount),
    }])
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}

// PATCH — update a stage status (mark paid/partial)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: order_id } = await params;
  const url = new URL(req.url);
  const stageId = url.searchParams.get('stageId');
  if (!stageId) return NextResponse.json({ error: 'stageId required' }, { status: 400 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = z.object({
    status: z.enum(['pending', 'partial', 'paid']).optional(),
    due_date: z.string().nullable().optional(),
    trigger_condition: z.string().optional(),
    tds_rate: z.number().min(0).optional(),
    tds_amount: z.number().min(0).optional(),
  }).safeParse(body);

  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('order_payment_stages')
    .update(parsed.data)
    .eq('id', stageId)
    .eq('order_id', order_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
