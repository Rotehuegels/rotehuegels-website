export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { status, rejection_reason } = await req.json();

  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Fetch the registration record
  const { data: reg, error: fetchError } = await supabaseAdmin
    .from('supplier_registrations')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !reg) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
  }

  // Update the registration status
  const { error } = await supabaseAdmin
    .from('supplier_registrations')
    .update({
      status,
      rejection_reason: rejection_reason ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // On approval, upsert into the verified suppliers table
  if (status === 'approved') {
    const addressParts = [reg.city, reg.state].filter(Boolean);
    const noteParts: string[] = [];
    if (reg.contact_person) noteParts.push(`Contact: ${reg.contact_person}`);
    if (reg.certifications) noteParts.push(`Certifications: ${reg.certifications}`);
    if (reg.notes) noteParts.push(reg.notes);

    const { error: supplierError } = await supabaseAdmin
      .from('suppliers')
      .upsert(
        {
          legal_name: reg.company_name,
          gstin: reg.gstin ?? null,
          pan: reg.pan ?? null,
          email: reg.email ?? null,
          phone: reg.phone ?? null,
          address: addressParts.length ? addressParts.join(', ') : null,
          state: reg.state ?? null,
          notes: noteParts.length ? noteParts.join('\n') : null,
        },
        { onConflict: 'gstin', ignoreDuplicates: false }
      );

    if (supplierError) {
      return NextResponse.json({ error: `Approved but failed to add supplier: ${supplierError.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
