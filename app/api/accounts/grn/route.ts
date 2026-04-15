import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const GRNItemSchema = z.object({
  po_item_id: z.string().uuid().optional().nullable(),
  description: z.string().min(1),
  hsn_code: z.string().optional(),
  ordered_qty: z.number().min(0),
  received_qty: z.number().min(0),
  accepted_qty: z.number().min(0),
  rejected_qty: z.number().min(0).default(0),
  unit: z.string().default('NOS'),
  unit_price: z.number().min(0),
  remarks: z.string().optional(),
});

const GRNSchema = z.object({
  po_id: z.string().uuid().optional().nullable(),
  supplier_id: z.string().uuid().optional().nullable(),
  receipt_date: z.string(),
  received_by: z.string().optional(),
  warehouse_location: z.string().default('Main Store'),
  delivery_note_no: z.string().optional(),
  vehicle_no: z.string().optional(),
  transporter: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(GRNItemSchema).min(1),
});

// GET — list all GRNs
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('goods_receipt_notes')
    .select('*, suppliers(legal_name), purchase_orders(po_no)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST — create new GRN
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = GRNSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { items, ...grnData } = parsed.data;

  // Generate GRN number
  const { count } = await supabaseAdmin.from('goods_receipt_notes').select('*', { count: 'exact', head: true });
  const seq = String((count ?? 0) + 1).padStart(4, '0');
  const grnNo = `GRN-${seq}`;

  const { data: grn, error } = await supabaseAdmin
    .from('goods_receipt_notes')
    .insert({ ...grnData, grn_no: grnNo })
    .select('id, grn_no')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insert items
  const grnItems = items.map(item => ({ ...item, grn_id: grn.id }));
  await supabaseAdmin.from('grn_items').insert(grnItems);

  // Update stock quantities for accepted items
  for (const item of items) {
    if (item.accepted_qty > 0 && item.description) {
      try {
        await supabaseAdmin.rpc('increment_stock_quantity', {
          p_item_name: item.description,
          p_qty: item.accepted_qty,
        });
      } catch { /* RPC may not exist yet */ }
    }
  }

  logAudit({
    userId: user.id, userEmail: user.email ?? undefined,
    action: 'create', entityType: 'grn', entityId: grn.id,
    entityLabel: `${grn.grn_no} - ${items.length} items`,
  });

  return NextResponse.json({ success: true, id: grn.id, grn_no: grnNo }, { status: 201 });
}
