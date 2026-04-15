import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const TemplateSchema = z.object({
  template_name: z.string().min(1),
  customer_id: z.string().uuid().optional().nullable(),
  client_name: z.string().min(1),
  client_gstin: z.string().optional(),
  client_pan: z.string().optional(),
  client_address: z.string().optional(),
  client_contact: z.string().optional(),
  order_type: z.enum(['goods', 'service']).default('service'),
  description: z.string().optional(),
  items: z.any().optional(),
  base_value: z.number().min(0),
  gst_rate: z.number().default(18),
  total_value: z.number().min(0),
  hsn_sac_code: z.string().optional(),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).default('monthly'),
  next_run_date: z.string(),
  auto_generate: z.boolean().default(false),
  notes: z.string().optional(),
});

// GET — list all recurring order templates
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('recurring_order_templates')
    .select('*, customers(name, customer_id)')
    .order('next_run_date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST — create new template
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = TemplateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('recurring_order_templates')
    .insert({ ...parsed.data, created_by: user.id })
    .select('id, template_name')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAudit({
    userId: user.id, userEmail: user.email ?? undefined,
    action: 'create', entityType: 'recurring_order', entityId: data.id,
    entityLabel: `Recurring: ${data.template_name}`,
  });

  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
