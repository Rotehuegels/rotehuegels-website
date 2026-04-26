export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import {
  matchInvoiceLine,
  rollupHeaderStatus,
  DEFAULT_TOLERANCES,
  type LineMatchStatus,
  type Tolerances,
} from '@/lib/threeWayMatch';

const ItemSchema = z.object({
  po_item_id:     z.string().uuid().nullable().optional(),
  description:    z.string().min(1),
  hsn_code:       z.string().optional(),
  quantity:       z.coerce.number().positive(),
  unit:           z.string().default('pcs'),
  unit_price:     z.coerce.number().nonnegative(),
  taxable_amount: z.coerce.number().nonnegative(),
  gst_rate:       z.coerce.number().min(0).max(28).default(18),
  gst_amount:     z.coerce.number().nonnegative().default(0),
  total:          z.coerce.number().nonnegative(),
});

const CreateSchema = z.object({
  invoice_no:    z.string().min(1),
  supplier_id:   z.string().uuid(),
  po_id:         z.string().uuid().nullable().optional(),
  invoice_date:  z.string(),                       // 'YYYY-MM-DD'
  received_date: z.string().optional(),
  due_date:      z.string().optional(),
  subtotal:      z.coerce.number().nonnegative().default(0),
  taxable_value: z.coerce.number().nonnegative(),
  igst_amount:   z.coerce.number().nonnegative().default(0),
  cgst_amount:   z.coerce.number().nonnegative().default(0),
  sgst_amount:   z.coerce.number().nonnegative().default(0),
  total_amount:  z.coerce.number().nonnegative(),
  notes:         z.string().optional(),
  items:         z.array(ItemSchema).min(1),
});

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function loadTolerances(): Promise<Tolerances> {
  const { data } = await supabaseAdmin
    .from('app_settings')
    .select('key, value')
    .in('key', ['ap.price_tolerance_pct', 'ap.qty_tolerance_pct']);
  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return {
    price_tolerance_pct: Number(map['ap.price_tolerance_pct'] ?? DEFAULT_TOLERANCES.price_tolerance_pct),
    qty_tolerance_pct:   Number(map['ap.qty_tolerance_pct']   ?? DEFAULT_TOLERANCES.qty_tolerance_pct),
  };
}

// GET — list invoices
export async function GET(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const matchFilter = url.searchParams.get('match_status');
  const payFilter   = url.searchParams.get('payment_status');

  let q = supabaseAdmin
    .from('purchase_invoices')
    .select(`
      id, invoice_no, invoice_date, received_date, due_date,
      total_amount, match_status, payment_status, created_at,
      suppliers(legal_name, vendor_code),
      purchase_orders(po_no)
    `)
    .order('created_at', { ascending: false });
  if (matchFilter) q = q.eq('match_status',  matchFilter);
  if (payFilter)   q = q.eq('payment_status', payFilter);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST — create invoice + run 3-way match
export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const tolerances = await loadTolerances();

  // 1. Insert header
  const { data: inv, error: insErr } = await supabaseAdmin
    .from('purchase_invoices')
    .insert({
      invoice_no:    parsed.data.invoice_no,
      supplier_id:   parsed.data.supplier_id,
      po_id:         parsed.data.po_id ?? null,
      invoice_date:  parsed.data.invoice_date,
      received_date: parsed.data.received_date ?? null,
      due_date:      parsed.data.due_date ?? null,
      subtotal:      parsed.data.subtotal,
      taxable_value: parsed.data.taxable_value,
      igst_amount:   parsed.data.igst_amount,
      cgst_amount:   parsed.data.cgst_amount,
      sgst_amount:   parsed.data.sgst_amount,
      total_amount:  parsed.data.total_amount,
      notes:         parsed.data.notes ?? null,
      match_status:  'pending',
    })
    .select('id')
    .single();
  if (insErr || !inv) {
    if (insErr?.code === '23505') {
      return NextResponse.json({ error: 'An invoice with this number already exists for this supplier.' }, { status: 409 });
    }
    return NextResponse.json({ error: insErr?.message ?? 'Insert failed' }, { status: 500 });
  }

  // 2. Pre-fetch PO items + cumulative GRN qty per po_item_id (in one shot)
  const poItemIds = Array.from(new Set(parsed.data.items.map((it) => it.po_item_id).filter(Boolean) as string[]));
  const [poItemsRes, grnRowsRes] = await Promise.all([
    poItemIds.length
      ? supabaseAdmin.from('po_items').select('id, quantity, unit_price').in('id', poItemIds)
      : Promise.resolve({ data: [], error: null }),
    poItemIds.length
      ? supabaseAdmin
          .from('grn_items')
          .select('po_item_id, accepted_qty, goods_receipt_notes!inner(status)')
          .in('po_item_id', poItemIds)
          .eq('goods_receipt_notes.status', 'accepted')
      : Promise.resolve({ data: [], error: null }),
  ]);

  const poByItem = new Map((poItemsRes.data ?? []).map((p) => [p.id, p]));
  const grnByItem = new Map<string, number>();
  for (const row of grnRowsRes.data ?? []) {
    grnByItem.set(
      row.po_item_id,
      (grnByItem.get(row.po_item_id) ?? 0) + Number(row.accepted_qty ?? 0),
    );
  }

  // 3. Build line-level match results
  const itemRows = parsed.data.items.map((it) => {
    const po  = it.po_item_id ? poByItem.get(it.po_item_id) ?? null : null;
    const grn = it.po_item_id
      ? { po_item_id: it.po_item_id, cumulative_accepted_qty: grnByItem.get(it.po_item_id) ?? 0 }
      : null;
    const verdict = matchInvoiceLine(
      { po_item_id: it.po_item_id ?? null, quantity: it.quantity, unit_price: it.unit_price },
      po ? { id: po.id, quantity: Number(po.quantity), unit_price: Number(po.unit_price) } : null,
      grn,
      tolerances,
    );
    return {
      invoice_id:         inv.id,
      po_item_id:         it.po_item_id ?? null,
      description:        it.description,
      hsn_code:           it.hsn_code ?? null,
      quantity:           it.quantity,
      unit:               it.unit,
      unit_price:         it.unit_price,
      taxable_amount:     it.taxable_amount,
      gst_rate:           it.gst_rate,
      gst_amount:         it.gst_amount,
      total:              it.total,
      match_status:       verdict.match_status,
      variance_price_pct: verdict.variance_price_pct,
      variance_qty_pct:   verdict.variance_qty_pct,
      matched_grn_qty:    verdict.matched_grn_qty,
    };
  });

  const { error: itemsErr } = await supabaseAdmin
    .from('purchase_invoice_items')
    .insert(itemRows);
  if (itemsErr) {
    await supabaseAdmin.from('purchase_invoices').delete().eq('id', inv.id);
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  // 4. Roll up header status
  const { data: poTotalRow } = parsed.data.po_id
    ? await supabaseAdmin.from('purchase_orders').select('total_amount').eq('id', parsed.data.po_id).single()
    : { data: null };
  const headerStatus = rollupHeaderStatus(
    itemRows.map((r) => r.match_status as LineMatchStatus),
    parsed.data.total_amount,
    poTotalRow?.total_amount ? Number(poTotalRow.total_amount) : null,
  );

  // Auto-hold payment when match is anything other than matched / under_billed
  const autoOnHold = !['matched', 'under_billed'].includes(headerStatus);

  await supabaseAdmin
    .from('purchase_invoices')
    .update({
      match_status:   headerStatus,
      payment_status: autoOnHold ? 'on_hold' : 'unpaid',
    })
    .eq('id', inv.id);

  return NextResponse.json({
    success:        true,
    id:             inv.id,
    match_status:   headerStatus,
    payment_status: autoOnHold ? 'on_hold' : 'unpaid',
  }, { status: 201 });
}
