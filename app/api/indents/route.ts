export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { requireApiPermission } from '@/lib/apiAuthz';

const ItemSchema = z.object({
  stock_item_id:       z.string().uuid().optional(),
  item_code:           z.string().optional(),
  item_name:           z.string().min(1),
  description:         z.string().optional(),
  uom:                 z.string().optional(),
  qty:                 z.coerce.number().positive(),
  estimated_unit_cost: z.coerce.number().nonnegative().optional(),
  notes:               z.string().optional(),
});

const CreateSchema = z.object({
  department:            z.string().optional(),
  required_by:           z.string().optional(),                          // 'YYYY-MM-DD'
  priority:              z.enum(['low','normal','high','urgent']).default('normal'),
  justification:         z.string().optional(),
  preferred_supplier_id: z.string().uuid().optional(),
  notes:                 z.string().optional(),
  source:                z.enum(['manual','auto_low_stock']).default('manual'),
  items:                 z.array(ItemSchema).min(1, 'At least one item required'),
});

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET — list indents (filterable by status)
export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get('status');

  let q = supabaseAdmin
    .from('indents')
    .select('id, indent_no, requested_by_email, department, required_by, priority, status, approved_at, converted_to_po_id, source, created_at')
    .order('created_at', { ascending: false });

  if (status) q = q.eq('status', status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST — create indent (default status: draft)
export async function POST(req: Request) {
  const ctx = await requireApiPermission('procurement.create');
  if (ctx instanceof NextResponse) return ctx;
  const user = { id: ctx.userId, email: ctx.email };

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  // Generate indent_no via DB function
  const { data: noRes, error: noErr } = await supabaseAdmin.rpc('next_indent_no');
  if (noErr || !noRes) return NextResponse.json({ error: 'Could not generate indent number.' }, { status: 500 });

  const { data: indent, error: insErr } = await supabaseAdmin
    .from('indents')
    .insert({
      indent_no:             noRes as string,
      requested_by:          user.id,
      requested_by_email:    user.email ?? null,
      department:            parsed.data.department ?? null,
      required_by:           parsed.data.required_by ?? null,
      priority:              parsed.data.priority,
      justification:         parsed.data.justification ?? null,
      preferred_supplier_id: parsed.data.preferred_supplier_id ?? null,
      notes:                 parsed.data.notes ?? null,
      source:                parsed.data.source,
      status:                'draft',
    })
    .select('id, indent_no')
    .single();

  if (insErr || !indent) return NextResponse.json({ error: insErr?.message ?? 'Insert failed' }, { status: 500 });

  // Insert items
  const itemRows = parsed.data.items.map((it) => ({
    indent_id:           indent.id,
    stock_item_id:       it.stock_item_id ?? null,
    item_code:           it.item_code ?? null,
    item_name:           it.item_name,
    description:         it.description ?? null,
    uom:                 it.uom ?? null,
    qty:                 it.qty,
    estimated_unit_cost: it.estimated_unit_cost ?? null,
    notes:               it.notes ?? null,
  }));

  const { error: itemErr } = await supabaseAdmin.from('indent_items').insert(itemRows);
  if (itemErr) {
    // Roll back the indent header to avoid orphan
    await supabaseAdmin.from('indents').delete().eq('id', indent.id);
    return NextResponse.json({ error: itemErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: indent.id, indent_no: indent.indent_no }, { status: 201 });
}
