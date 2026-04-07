export const runtime = 'nodejs';

// POST /api/accounts/quotes/[id]/convert
// Converts an accepted quote into an Order (+ optional Proforma Invoice)
// Accepts override fields: invoice_date, order_date, description, notes,
//   tds_applicable, tds_rate, stage_name, stage_trigger

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  // Override fields from request body (all optional)
  let overrides: {
    invoice_date?: string;
    order_date?: string;
    description?: string;
    notes?: string;
    tds_applicable?: boolean;
    tds_rate?: number;
    stage_name?: string;
    stage_trigger?: string;
    create_proforma?: boolean;
  } = {};
  try { overrides = await req.json(); } catch { /* no body — use defaults */ }

  const customer = quote.customers as Record<string, string | null>;
  const items = (quote.items ?? []) as Array<{ item_type: string; name: string }>;

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

  const order_date   = overrides.order_date   ?? today;
  const invoice_date = overrides.invoice_date ?? today;
  const tds_applicable = overrides.tds_applicable ?? false;
  const tds_rate       = overrides.tds_rate ?? 0;

  // Default description from quote items list
  const defaultDesc = items.map(i => i.name).join('; ');
  const description = overrides.description?.trim() || defaultDesc || `Converted from Quote ${quote.quote_no}`;

  // Determine GST split (intra = CGST+SGST, inter = IGST)
  const isIntra = customer.state_code === '33' || customer.state?.toLowerCase().includes('tamil');

  // Build client fields from customer record
  const billingAddr = customer.billing_address as unknown as Record<string, string> | null;
  const clientAddress = billingAddr
    ? [billingAddr.line1, billingAddr.line2, billingAddr.city, billingAddr.state, billingAddr.pincode].filter(Boolean).join(', ')
    : null;

  // Create the order
  const { data: order, error: oErr } = await supabaseAdmin
    .from('orders')
    .insert([{
      order_no,
      order_type,
      order_category:       'order',
      customer_id:          quote.customer_id,
      client_name:          customer.name,
      client_gstin:         customer.gstin ?? null,
      client_pan:           customer.pan   ?? null,
      client_address:       clientAddress,
      description,
      order_date,
      invoice_date,
      entry_date:           today,
      total_value_incl_gst: quote.total_amount,
      base_value:           quote.taxable_value,
      gst_rate:             18,
      cgst_amount:          isIntra ? (quote.cgst_amount ?? 0) : 0,
      sgst_amount:          isIntra ? (quote.sgst_amount ?? 0) : 0,
      igst_amount:          isIntra ? 0 : (quote.igst_amount ?? 0),
      tds_applicable,
      tds_rate,
      tds_deducted_total:   0,
      items:                quote.items,
      place_of_supply:      isIntra ? 'Tamil Nadu (33)' : null,
      status:               'active',
      notes:                overrides.notes ?? null,
    }])
    .select('id, order_no')
    .single();

  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 });

  // Create a single payment stage (full amount, advance before delivery)
  const tdsAmount = tds_applicable ? Math.round(quote.taxable_value * (tds_rate / 100) * 100) / 100 : 0;
  const { error: stageErr } = await supabaseAdmin
    .from('order_payment_stages')
    .insert([{
      order_id:       order.id,
      stage_number:   1,
      stage_name:     overrides.stage_name ?? 'Full Payment',
      percentage:     100,
      amount_due:     quote.taxable_value,
      gst_on_stage:   (quote.cgst_amount ?? 0) + (quote.sgst_amount ?? 0) + (quote.igst_amount ?? 0),
      tds_rate,
      tds_amount:     tdsAmount,
      net_receivable: quote.total_amount - tdsAmount,
      trigger_condition: overrides.stage_trigger ?? 'On invoicing',
      status:         'pending',
      invoice_date,
    }]);
  if (stageErr) console.error('Stage creation failed:', stageErr.message);

  // Optionally create proforma invoice
  let pi = null;
  if (overrides.create_proforma !== false) {
    const { count: piCount } = await supabaseAdmin
      .from('proforma_invoices')
      .select('*', { count: 'exact', head: true });
    const piSeq  = String((piCount ?? 0) + 1).padStart(3, '0');
    const pi_no  = `PI-${new Date().getFullYear()}-${piSeq}`;

    const { data: piData, error: piErr } = await supabaseAdmin
      .from('proforma_invoices')
      .insert([{
        pi_no,
        quote_id:        quote.id,
        order_id:        order.id,
        customer_id:     quote.customer_id,
        pi_date:         today,
        items:           quote.items,
        subtotal:        quote.subtotal,
        discount_amount: quote.discount_amount,
        taxable_value:   quote.taxable_value,
        cgst_amount:     isIntra ? (quote.cgst_amount ?? 0) : 0,
        sgst_amount:     isIntra ? (quote.sgst_amount ?? 0) : 0,
        igst_amount:     isIntra ? 0 : (quote.igst_amount ?? 0),
        total_amount:    quote.total_amount,
        status:          'draft',
      }])
      .select('id, pi_no')
      .single();
    if (!piErr) pi = piData;
  }

  // Mark quote as converted
  await supabaseAdmin
    .from('quotes')
    .update({ status: 'converted', converted_order_id: order.id })
    .eq('id', id);

  return NextResponse.json({
    success:  true,
    order_id: order.id,
    order_no: order.order_no,
    ...(pi ? { pi_id: pi.id, pi_no: pi.pi_no } : {}),
  }, { status: 201 });
}
