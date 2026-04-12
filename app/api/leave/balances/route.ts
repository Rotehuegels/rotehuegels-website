import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fy = searchParams.get('fy') || '2025-26';
  const employeeId = searchParams.get('employee_id');

  let query = supabaseAdmin
    .from('leave_balances')
    .select('*, leave_types(name, short_code, is_paid), employees(full_name, engagement_id)')
    .eq('fy', fy);

  if (employeeId) query = query.eq('employee_id', employeeId);

  const { data, error } = await query.order('employee_id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
