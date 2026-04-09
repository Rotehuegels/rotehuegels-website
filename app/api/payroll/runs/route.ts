export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { computePayroll } from '@/lib/payroll';

async function auth() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

// GET /api/payroll/runs — list all runs
export async function GET() {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from('payroll_runs')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST /api/payroll/runs — create a new run and auto-populate entries
export async function POST(req: Request) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { month, year } = await req.json();
  if (!month || !year) return NextResponse.json({ error: 'month and year required' }, { status: 400 });

  // Check for duplicate
  const { data: existing } = await supabaseAdmin
    .from('payroll_runs')
    .select('id')
    .eq('month', month)
    .eq('year', year)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: `Payroll run for this month already exists.`, runId: existing.id }, { status: 409 });

  // Create the run
  const { data: run, error: runErr } = await supabaseAdmin
    .from('payroll_runs')
    .insert({ month, year, status: 'draft' })
    .select()
    .single();
  if (runErr) return NextResponse.json({ error: runErr.message }, { status: 500 });

  // Fetch active staff (exclude board members — they draw director fees, not salary)
  const { data: employees } = await supabaseAdmin
    .from('employees')
    .select('id, basic_salary, allowance, bonus')
    .eq('status', 'active')
    .neq('employment_type', 'board_member');

  const { data: structures } = await supabaseAdmin
    .from('payroll_salary_structures')
    .select('*');

  const structMap = Object.fromEntries((structures ?? []).map((s) => [s.employee_id, s]));

  // Build entries
  const entries = (employees ?? []).map((emp) => {
    const s = structMap[emp.id];
    // Use salary structure if set, else derive from employee fields
    const basic    = s?.basic             ?? (emp.basic_salary ?? 0);
    const hra      = s?.hra               ?? Math.round((emp.basic_salary ?? 0) * 0.4);
    const special  = s?.special_allowance ?? (emp.allowance ?? 0);
    const other    = s?.other_allowance   ?? 0;
    const bonus    = 0; // starts at 0, editable per run
    const epfEn    = s?.epf_enabled       ?? false;
    const esiEn    = s?.esi_enabled       ?? false;
    const ptEn     = s?.pt_enabled        ?? true;

    const computed = computePayroll({
      basic, hra, special_allowance: special, other_allowance: other, bonus,
      working_days: 26, days_present: 26, lop_days: 0,
      tds: 0, advance_recovery: 0, other_deductions: 0,
      epf_enabled: epfEn, esi_enabled: esiEn, pt_enabled: ptEn,
      month,
    });

    return {
      run_id: run.id,
      employee_id: emp.id,
      basic, hra,
      special_allowance: special,
      other_allowance: other,
      bonus,
      working_days: 26,
      days_present: 26,
      lop_days: 0,
      ...computed,
    };
  });

  if (entries.length > 0) {
    const { error: entryErr } = await supabaseAdmin.from('payroll_entries').insert(entries);
    if (entryErr) {
      // Rollback run
      await supabaseAdmin.from('payroll_runs').delete().eq('id', run.id);
      return NextResponse.json({ error: entryErr.message }, { status: 500 });
    }
  }

  // Update run totals
  const totals = entries.reduce((acc, e) => ({
    total_gross: acc.total_gross + e.gross_pay,
    total_deductions: acc.total_deductions + e.total_deductions,
    total_net: acc.total_net + e.net_pay,
    total_employer_cost: acc.total_employer_cost + e.employer_cost,
  }), { total_gross: 0, total_deductions: 0, total_net: 0, total_employer_cost: 0 });

  await supabaseAdmin.from('payroll_runs').update(totals).eq('id', run.id);

  return NextResponse.json({ runId: run.id }, { status: 201 });
}
