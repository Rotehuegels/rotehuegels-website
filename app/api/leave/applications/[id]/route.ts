import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = {};
  if (body.status) {
    update.status = body.status;
    if (body.status === 'approved') {
      update.approved_by = body.approved_by || 'Admin';
      update.approved_at = new Date().toISOString();
    }
    if (body.status === 'rejected') {
      update.rejection_reason = body.rejection_reason || null;
    }
  }

  const { data: application, error } = await supabaseAdmin
    .from('leave_applications')
    .update(update)
    .eq('id', id)
    .select('*, leave_types(name, short_code)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update balance if approved
  if (body.status === 'approved' && application) {
    // Determine FY from the leave start date
    const d = new Date(application.from_date);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const fy = m >= 4 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;

    // Increment used, decrement balance
    const { data: bal } = await supabaseAdmin
      .from('leave_balances')
      .select('id, used, balance')
      .eq('employee_id', application.employee_id)
      .eq('leave_type_id', application.leave_type_id)
      .eq('fy', fy)
      .single();

    if (bal) {
      await supabaseAdmin
        .from('leave_balances')
        .update({
          used: (bal.used ?? 0) + application.days,
          balance: (bal.balance ?? 0) - application.days,
        })
        .eq('id', bal.id);
    }
  }

  // Restore balance if cancelled (was approved)
  if (body.status === 'cancelled' && application) {
    const d = new Date(application.from_date);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const fy = m >= 4 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;

    const { data: bal } = await supabaseAdmin
      .from('leave_balances')
      .select('id, used, balance')
      .eq('employee_id', application.employee_id)
      .eq('leave_type_id', application.leave_type_id)
      .eq('fy', fy)
      .single();

    if (bal && application.approved_at) {
      await supabaseAdmin
        .from('leave_balances')
        .update({
          used: Math.max(0, (bal.used ?? 0) - application.days),
          balance: (bal.balance ?? 0) + application.days,
        })
        .eq('id', bal.id);
    }
  }

  return NextResponse.json(application);
}
