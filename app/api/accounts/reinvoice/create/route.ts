import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface LineItem {
  description: string;
  hsn_code: string;
  quantity: number;
  unit: string;
  rate: number;
  discount?: string | null;
  taxable_amount: number;
  gst_rate: number;
  gst_amount: number;
  total: number;
}

interface CreateReinvoiceBody {
  customer_id: string;
  customer_name: string;
  customer_gstin: string;
  customer_pan?: string;
  customer_address: string;
  customer_contact: string;
  items: LineItem[];
  extra_charges: LineItem[];
  margin_percent: number;
  invoice_date: string;
  delivery_date?: string;
  notes?: string;
  supplier_refs?: string;
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body: CreateReinvoiceBody = await req.json();

    // Combine items + extra charges
    const allItems = [...body.items, ...body.extra_charges];

    // Apply margin if any
    const marginMultiplier = 1 + (body.margin_percent / 100);
    const finalItems = allItems.map(item => {
      const adjustedTaxable = parseFloat((item.taxable_amount * marginMultiplier).toFixed(2));
      const adjustedGst = parseFloat((adjustedTaxable * item.gst_rate / 100).toFixed(2));
      const adjustedTotal = parseFloat((adjustedTaxable + adjustedGst).toFixed(2));
      return {
        name: item.description,
        hsn_code: item.hsn_code,
        quantity: item.quantity,
        unit: item.unit,
        rate: body.margin_percent > 0
          ? parseFloat((item.rate * marginMultiplier).toFixed(2))
          : item.rate,
        discount: item.discount || undefined,
        taxable_amount: adjustedTaxable,
        gst_amount: adjustedGst,
        total: adjustedTotal,
      };
    });

    // Calculate totals
    const baseValue = finalItems.reduce((s, i) => s + i.taxable_amount, 0);
    const totalGst = finalItems.reduce((s, i) => s + i.gst_amount, 0);
    const halfGst = parseFloat((totalGst / 2).toFixed(2));
    const grandTotal = Math.round(baseValue + totalGst);

    // Determine if intra-state (both TN = state code 33)
    const customerStateCode = body.customer_gstin?.substring(0, 2);
    const isIntra = customerStateCode === '33';

    // Generate order number
    const { count } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('order_type', 'goods');
    const seq = String((count ?? 0) + 1).padStart(3, '0');
    const orderNo = `GDS-${seq}`;

    // Primary HSN (most common across items)
    const hsnCounts: Record<string, number> = {};
    for (const i of finalItems) {
      hsnCounts[i.hsn_code] = (hsnCounts[i.hsn_code] || 0) + 1;
    }
    const primaryHsn = Object.entries(hsnCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

    // Build notes
    const marginNote = body.margin_percent > 0
      ? `${body.margin_percent}% margin applied.`
      : 'Zero-margin re-invoice (at cost).';
    const supplierNote = body.supplier_refs ? `Supplier ref: ${body.supplier_refs}.` : '';
    const fullNotes = [marginNote, supplierNote, body.notes].filter(Boolean).join(' ');

    // Insert order
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .insert({
        order_no: orderNo,
        order_type: 'goods',
        order_category: 'order',
        client_name: body.customer_name,
        client_gstin: body.customer_gstin,
        client_pan: body.customer_pan ?? null,
        client_address: body.customer_address,
        client_contact: body.customer_contact,
        description: `Supply of materials — re-invoiced to ${body.customer_name}`,
        order_date: body.invoice_date,
        invoice_date: body.invoice_date,
        entry_date: new Date().toISOString().split('T')[0],
        delivery_date: body.delivery_date ?? body.invoice_date,
        base_value: parseFloat(baseValue.toFixed(2)),
        gst_rate: 18,
        cgst_amount: isIntra ? halfGst : 0,
        sgst_amount: isIntra ? halfGst : 0,
        igst_amount: isIntra ? 0 : parseFloat(totalGst.toFixed(2)),
        total_value_incl_gst: grandTotal,
        tds_applicable: false,
        tds_rate: 0,
        place_of_supply: isIntra ? 'Tamil Nadu (33)' : null,
        hsn_sac_code: primaryHsn,
        status: 'active',
        notes: fullNotes,
        items: finalItems,
      })
      .select('id, order_no')
      .single();

    if (error) throw error;

    // Insert payment stage
    await supabaseAdmin.from('order_payment_stages').insert({
      order_id: order.id,
      stage_number: 1,
      stage_name: 'Full Payment',
      percentage: 100,
      amount_due: parseFloat(baseValue.toFixed(2)),
      gst_on_stage: parseFloat(totalGst.toFixed(2)),
      tds_rate: 0,
      tds_amount: 0,
      net_receivable: grandTotal,
      due_date: body.invoice_date,
      trigger_condition: 'On delivery of materials',
      status: 'pending',
    });

    logAudit({
      userId: user.id,
      userEmail: user.email ?? undefined,
      action: 'create',
      entityType: 'order',
      entityId: order.id,
      entityLabel: `Re-invoice ${order.order_no} → ${body.customer_name}`,
      metadata: { margin: body.margin_percent, total: grandTotal },
    });

    return NextResponse.json({
      success: true,
      id: order.id,
      order_no: order.order_no,
      total: grandTotal,
    }, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/accounts/reinvoice/create]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create re-invoice' },
      { status: 500 },
    );
  }
}
