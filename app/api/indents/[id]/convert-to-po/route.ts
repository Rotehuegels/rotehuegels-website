export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

// Body lets the caller override the supplier and gst rate at conversion time
// without having to edit the indent first.
const ConvertSchema = z.object({
  supplier_id:       z.string().uuid().optional(),  // overrides indent's preferred_supplier_id
  po_date:           z.string().optional(),         // 'YYYY-MM-DD', defaults to today
  expected_delivery: z.string().optional(),
  default_gst_rate:  z.coerce.number().min(0).max(28).default(18),
});

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body: unknown = {};
  try { body = await req.json(); } catch { /* allow empty body */ }
  const parsed = ConvertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  // Read indent
  const { data: indent, error: indErr } = await supabaseAdmin
    .from('indents')
    .select('*')
    .eq('id', id)
    .single();
  if (indErr || !indent) return NextResponse.json({ error: 'Indent not found' }, { status: 404 });
  if (indent.status !== 'approved') {
    return NextResponse.json({ error: 'Only approved indents can be converted to a PO.' }, { status: 409 });
  }
  if (indent.converted_to_po_id) {
    return NextResponse.json({ error: 'This indent has already been converted to a PO.' }, { status: 409 });
  }

  const supplierId = parsed.data.supplier_id ?? indent.preferred_supplier_id;
  if (!supplierId) {
    return NextResponse.json({ error: 'No supplier specified. Provide supplier_id in the request body.' }, { status: 400 });
  }

  const { data: items } = await supabaseAdmin
    .from('indent_items')
    .select('*')
    .eq('indent_id', id)
    .order('created_at');
  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Indent has no items.' }, { status: 400 });
  }

  const poDate = parsed.data.po_date ?? new Date().toISOString().slice(0, 10);
  const gstRate = parsed.data.default_gst_rate;

  // Build PO header. Tax split (igst vs cgst+sgst) defaults to igst here;
  // user can adjust on the PO edit screen before sending.
  let subtotal = 0;
  let gstSum = 0;
  const poItems = items.map((it, idx) => {
    const qty       = Number(it.qty ?? 0);
    const unitPrice = Number(it.estimated_unit_cost ?? 0);
    const taxable   = +(qty * unitPrice).toFixed(2);
    const gstAmt    = +(taxable * gstRate / 100).toFixed(2);
    const total     = +(taxable + gstAmt).toFixed(2);
    subtotal += taxable;
    gstSum   += gstAmt;
    return {
      sl_no:          idx + 1,
      description:    it.description ? `${it.item_name} — ${it.description}` : it.item_name,
      hsn_code:       null,
      unit:           it.uom ?? 'pcs',
      quantity:       qty,
      unit_price:     unitPrice,
      taxable_amount: taxable,
      gst_rate:       gstRate,
      igst_rate:      gstRate,
      cgst_rate:      0,
      sgst_rate:      0,
      gst_amount:     gstAmt,
      total,
      notes:          it.notes,
    };
  });

  // Generate PO number atomically (same pattern as the bare PO POST)
  const { data: po_no, error: noErr } = await supabaseAdmin.rpc('next_po_no', { p_date: poDate });
  if (noErr || !po_no) {
    return NextResponse.json({ error: 'Could not generate PO number.' }, { status: 500 });
  }

  const { data: po, error: poErr } = await supabaseAdmin
    .from('purchase_orders')
    .insert([{
      po_no,
      supplier_id:       supplierId,
      po_date:           poDate,
      expected_delivery: parsed.data.expected_delivery ?? indent.required_by ?? null,
      status:            'draft',
      bill_to:           {},
      subtotal:          +subtotal.toFixed(2),
      taxable_value:     +subtotal.toFixed(2),
      igst_amount:       +gstSum.toFixed(2),
      cgst_amount:       0,
      sgst_amount:       0,
      total_amount:      +(subtotal + gstSum).toFixed(2),
      notes:             `Converted from indent ${indent.indent_no}` + (indent.notes ? ` · ${indent.notes}` : ''),
    }])
    .select('id, po_no')
    .single();

  if (poErr || !po) return NextResponse.json({ error: poErr?.message ?? 'PO insert failed' }, { status: 500 });

  // Insert PO items
  const { error: itemsErr } = await supabaseAdmin
    .from('po_items')
    .insert(poItems.map(it => ({ ...it, po_id: po.id })));
  if (itemsErr) {
    await supabaseAdmin.from('purchase_orders').delete().eq('id', po.id);
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  // Mark indent converted
  await supabaseAdmin
    .from('indents')
    .update({ status: 'converted', converted_to_po_id: po.id })
    .eq('id', id);

  return NextResponse.json({ success: true, po_id: po.id, po_no: po.po_no }, { status: 201 });
}
