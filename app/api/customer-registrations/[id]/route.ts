import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('customer_registrations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH — approve or reject
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action, rejection_reason, approved_by } = body;

  const { data: reg } = await supabaseAdmin
    .from('customer_registrations')
    .select('*')
    .eq('id', id)
    .single();

  if (!reg) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'reject') {
    await supabaseAdmin
      .from('customer_registrations')
      .update({ status: 'rejected', rejection_reason: rejection_reason || null })
      .eq('id', id);

    return NextResponse.json({ success: true, status: 'rejected' });
  }

  if (action === 'approve') {
    // Generate customer_id
    const { count } = await supabaseAdmin
      .from('customers')
      .select('*', { count: 'exact', head: true });
    const seq = String((count ?? 0) + 1).padStart(3, '0');
    const customer_id = `CUST-${seq}`;

    // Derive state/PAN from GSTIN
    let state_code: string | null = null;
    let pan: string | null = reg.pan;
    if (reg.gstin && reg.gstin.length >= 15) {
      state_code = reg.gstin.slice(0, 2);
      if (!pan) pan = reg.gstin.slice(2, 12);
    }

    const addr = reg.billing_address || {};

    // Create customer
    const { data: customer, error: custErr } = await supabaseAdmin
      .from('customers')
      .insert({
        customer_id,
        name: reg.company_name,
        gstin: reg.gstin || null,
        pan,
        billing_address: reg.billing_address,
        shipping_address: reg.shipping_address || reg.billing_address,
        contact_person: reg.contact_person,
        email: reg.email,
        phone: reg.phone || null,
        state: addr.state || null,
        state_code,
        notes: `Registered via website. Reg: ${reg.reg_no}. Industry: ${reg.industry || '—'}. Type: ${reg.business_type || '—'}.`,
      })
      .select('id, customer_id')
      .single();

    if (custErr) return NextResponse.json({ error: custErr.message }, { status: 500 });

    // Update registration with approval
    await supabaseAdmin
      .from('customer_registrations')
      .update({
        status: 'approved',
        approved_by: approved_by || 'Admin',
        approved_at: new Date().toISOString(),
        customer_id: customer.id,
      })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      status: 'approved',
      customer_id: customer.customer_id,
      customer_uuid: customer.id,
    });
  }

  return NextResponse.json({ error: 'Invalid action. Use "approve" or "reject".' }, { status: 400 });
}
