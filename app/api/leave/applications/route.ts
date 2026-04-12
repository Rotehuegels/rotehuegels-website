import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const employeeId = searchParams.get('employee_id');

  let query = supabaseAdmin
    .from('leave_applications')
    .select('*, leave_types(name, short_code), employees(full_name, engagement_id)')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') query = query.eq('status', status);
  if (employeeId) query = query.eq('employee_id', employeeId);

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { employee_id, leave_type_id, from_date, to_date, days, reason } = body;

  if (!employee_id || !leave_type_id || !from_date || !to_date || !days) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('leave_applications')
    .insert({
      employee_id,
      leave_type_id,
      from_date,
      to_date,
      days,
      reason: reason || null,
      status: 'pending',
    })
    .select('*, leave_types(name, short_code)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
