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

const ExpenseSchema = z.object({
  expense_type: z.enum(['salary', 'purchase', 'tds_paid', 'advance_tax', 'gst_paid', 'other']),
  category: z.string().optional(),
  description: z.string().min(1),
  vendor_name: z.string().optional(),
  vendor_gstin: z.string().optional(),
  amount: z.number().positive(),
  gst_input_credit: z.number().min(0).default(0),
  expense_date: z.string(),
  reference_no: z.string().optional(),
  payment_mode: z.string().optional(),
  notes: z.string().optional(),
});

// GET — list expenses
export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get('type');

  let query = supabaseAdmin
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false });

  if (type) query = query.eq('expense_type', type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

// POST — create expense
export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = ExpenseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('expenses')
    .insert([parsed.data])
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAudit({
    userId: user.id,
    userEmail: user.email ?? undefined,
    action: 'create',
    entityType: 'expense',
    entityId: data.id,
    entityLabel: `Expense: ${parsed.data.description}`,
    metadata: { expense_type: parsed.data.expense_type, amount: parsed.data.amount },
  });

  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
