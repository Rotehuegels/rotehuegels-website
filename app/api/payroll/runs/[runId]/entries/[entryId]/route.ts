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

// PATCH /api/payroll/runs/[runId]/entries/[entryId]
// Accepts editable fields: bonus, lop_days, days_present, working_days,
//   tds, advance_recovery, other_deductions, epf_enabled, esi_enabled, pt_enabled
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ runId: string; entryId: string }> },
) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { runId, entryId } = await params;

  // Ensure run is still draft
  const { data: run } = await supabaseAdmin
    .from('payroll_runs').select('status, month').eq('id', runId).single();
  if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  if (run.status !== 'draft') return NextResponse.json({ error: 'Run is already processed.' }, { status: 400 });

  const body = await req.json();

  // Fetch current entry
  const { data: entry } = await supabaseAdmin
    .from('payroll_entries').select('*').eq('id', entryId).single();
  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });

  // Fetch salary structure flags if not overriding
  const { data: ss } = await supabaseAdmin
    .from('payroll_salary_structures')
    .select('epf_enabled, esi_enabled, pt_enabled')
    .eq('employee_id', entry.employee_id)
    .maybeSingle();

  const merged = {
    basic:             body.basic             ?? entry.basic,
    hra:               body.hra               ?? entry.hra,
    special_allowance: body.special_allowance ?? entry.special_allowance,
    other_allowance:   body.other_allowance   ?? entry.other_allowance,
    bonus:             body.bonus             ?? entry.bonus,
    working_days:      body.working_days      ?? entry.working_days,
    days_present:      body.days_present      ?? entry.days_present,
    lop_days:          body.lop_days          ?? entry.lop_days,
    tds:               body.tds               ?? entry.tds,
    advance_recovery:  body.advance_recovery  ?? entry.advance_recovery,
    other_deductions:  body.other_deductions  ?? entry.other_deductions,
    epf_enabled:       body.epf_enabled       ?? ss?.epf_enabled ?? false,
    esi_enabled:       body.esi_enabled       ?? ss?.esi_enabled ?? false,
    pt_enabled:        body.pt_enabled        ?? ss?.pt_enabled  ?? true,
    month:             run.month,
  };

  const computed = computePayroll(merged);

  const { error } = await supabaseAdmin
    .from('payroll_entries')
    .update({
      bonus:             merged.bonus,
      working_days:      merged.working_days,
      days_present:      merged.days_present,
      lop_days:          merged.lop_days,
      tds:               merged.tds,
      advance_recovery:  merged.advance_recovery,
      other_deductions:  merged.other_deductions,
      ...computed,
    })
    .eq('id', entryId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recompute run totals
  const { data: allEntries } = await supabaseAdmin
    .from('payroll_entries')
    .select('gross_pay, total_deductions, net_pay, employer_cost')
    .eq('run_id', runId);

  const totals = (allEntries ?? []).reduce((acc, e) => ({
    total_gross:        acc.total_gross        + (e.gross_pay        ?? 0),
    total_deductions:   acc.total_deductions   + (e.total_deductions ?? 0),
    total_net:          acc.total_net          + (e.net_pay          ?? 0),
    total_employer_cost:acc.total_employer_cost+ (e.employer_cost    ?? 0),
  }), { total_gross: 0, total_deductions: 0, total_net: 0, total_employer_cost: 0 });

  await supabaseAdmin.from('payroll_runs').update(totals).eq('id', runId);

  return NextResponse.json({ success: true });
}
