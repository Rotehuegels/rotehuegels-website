export const runtime = 'nodejs';

// POST /api/accounts/quotes/[id]/convert
// Converts an accepted quote into an Order + Proforma Invoice

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  // Load quote with customer
  const { data: quote, error: qErr } = await supabaseAdmin
    .from('quotes')
    .select('*, customers(*)')
    .eq('id', id)
    .single();

  if (qErr || !quote) return NextResponse.json({ error: 'Quote not found.' }, { status: 404 });
  if (quote.status === 'converted') return NextResponse.json({ error: 'Quote already converted.' }, { status: 400 });

  const customer = quote.customers as Record<string, string>;
  const items = (quote.items ?? []) as Array<{ item_type: string }>;

  // Determine order type: goods if any goods item, else service
  const hasGoods = items.some(i => i.item_type === 'goods');
  const order_type = hasGoods ? 'goods' : 'service';
  const prefix = order_type === 'goods' ? 'GDS' : 'SVC';

  // Generate order_no
  const { count } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('order_type', order_type);
  const seq = String((count ?? 0) + 1).padStart(3, '0');
  const order_no = `${prefix}-${seq}`;
  const today = new Date().toISOString().split('T')[0];

  // Determine GST split (intra = CGST+SGST, inter = IGST)
  const isIntra = customer.state_code === '33' || customer.state?.toLowerCase().includes('tamil');

  // Create the order
  const { data: order, error: oErr } = await supabaseAdmin
    .from('orders')
    .insert([{
      order_no,
      order_type,
      client_name:          customer.name,
      client_gstin:         customer.gstin ?? null,
      client_pan:           customer.pan ?? null,
      description:          `Converted from Quote ${quote.quote_no}`,
      order_date:           today,
      entry_date:           today,
      total_value_incl_gst: quote.total_amount,
      base_value:           quote.taxable_value,
      gst_rate:             18,  // stored for reference; line items carry individual rates
      cgst_amount:          isIntra ? quote.cgst_amount : 0,
      sgst_amount:          isIntra ? quote.sgst_amount : 0,
      igst_amount:          isIntra ? 0 : quote.igst_amount,
      tds_applicable:       false,
      tds_rate:             0,
      items:                quote.items,
      status:               'active',
    }])
    .select('id, order_no')
    .single();

  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 });

  // Generate proforma invoice
  const { count: piCount } = await supabaseAdmin
    .from('proforma_invoices')
    .select('*', { count: 'exact', head: true });
  const piSeq = String((piCount ?? 0) + 1).padStart(3, '0');
  const pi_no = `PI-${new Date().getFullYear()}-${piSeq}`;

  const { data: pi, error: piErr } = await supabaseAdmin
    .from('proforma_invoices')
    .insert([{
      pi_no,
      quote_id:       quote.id,
      order_id:       order.id,
      customer_id:    quote.customer_id,
      pi_date:        today,
      items:          quote.items,
      subtotal:       quote.subtotal,
      discount_amount: quote.discount_amount,
      taxable_value:  quote.taxable_value,
      cgst_amount:    isIntra ? quote.cgst_amount : 0,
      sgst_amount:    isIntra ? quote.sgst_amount : 0,
      igst_amount:    isIntra ? 0 : quote.igst_amount,
      total_amount:   quote.total_amount,
      status:         'draft',
    }])
    .select('id, pi_no')
    .single();

  if (piErr) return NextResponse.json({ error: piErr.message }, { status: 500 });

  // Mark quote as converted
  await supabaseAdmin
    .from('quotes')
    .update({ status: 'converted', converted_order_id: order.id })
    .eq('id', id);

  return NextResponse.json({
    success: true,
    order_id: order.id,
    order_no: order.order_no,
    pi_id: pi.id,
    pi_no: pi.pi_no,
  }, { status: 201 });
}
