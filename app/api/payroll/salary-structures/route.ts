export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

async function auth() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

// GET /api/payroll/salary-structures — all structures (joined with employee name)
export async function GET() {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from('payroll_salary_structures')
    .select('*, employees(id, full_name, role, department, employment_type, status)')
    .order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST /api/payroll/salary-structures — upsert salary structure
export async function POST(req: Request) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { employee_id, basic, hra, special_allowance, other_allowance,
          epf_enabled, esi_enabled, pt_enabled } = body;
  if (!employee_id) return NextResponse.json({ error: 'employee_id required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('payroll_salary_structures')
    .upsert({
      employee_id,
      basic: basic ?? 0,
      hra: hra ?? 0,
      special_allowance: special_allowance ?? 0,
      other_allowance: other_allowance ?? 0,
      epf_enabled: epf_enabled ?? false,
      esi_enabled: esi_enabled ?? false,
      pt_enabled: pt_enabled ?? true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'employee_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
