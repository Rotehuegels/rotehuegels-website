import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendRegistrationApproval } from '@/lib/registrationEmails';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = {};
  if (body.status) update.status = body.status;
  if (body.verified_by) update.verified_by = body.verified_by;
  if (body.rejection_reason) update.rejection_reason = body.rejection_reason;
  if (body.status === 'verified') {
    update.verified_at = new Date().toISOString();
    // Generate permanent partner ID on approval (random alphanumeric, not sequential)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    update.partner_id = `RTP-${rand}`;
  }

  const { data, error } = await supabaseAdmin
    .from('trading_partners')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send welcome email on verification/approval
  if (body.status === 'verified' && data.email) {
    sendRegistrationApproval({
      to: data.email,
      companyName: data.company_name,
      contactPerson: data.contact_person,
      refNo: data.reg_no,
      assignedId: data.partner_id,
      type: 'trading_partner',
    });
  }

  return NextResponse.json(data);
}
