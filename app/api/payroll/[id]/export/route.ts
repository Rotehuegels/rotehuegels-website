export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { MONTH_NAMES } from '@/lib/payroll';
import { logAudit } from '@/lib/audit';

async function auth() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

// GET /api/payroll/[id]/export — download CSV of all payslips for a run
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await auth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const [{ data: run }, { data: entries }] = await Promise.all([
    supabaseAdmin.from('payroll_runs').select('month, year').eq('id', id).single(),
    supabaseAdmin
      .from('payroll_entries')
      .select('*, employees(full_name, email)')
      .eq('run_id', id)
      .order('created_at'),
  ]);

  if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 });

  const rows = (entries ?? []).map((e) => {
    const emp = e.employees as { full_name: string; email: string } | null;
    const gross = e.gross_pay ?? 0;
    return [
      emp?.full_name ?? '',
      emp?.email ?? '',
      e.basic ?? 0,
      e.hra ?? 0,
      e.special_allowance ?? 0,
      e.other_allowance ?? 0,
      e.bonus ?? 0,
      gross,
      e.epf_employee ?? 0,
      e.esi_employee ?? 0,
      e.professional_tax ?? 0,
      e.tds ?? 0,
      e.advance_recovery ?? 0,
      e.other_deductions ?? 0,
      e.total_deductions ?? 0,
      e.net_pay ?? 0,
    ];
  });

  const header = [
    'Employee', 'Employee Email', 'Basic', 'HRA', 'Special Allowance',
    'Other Allowance', 'Bonus', 'Gross', 'PF', 'ESI', 'Professional Tax',
    'TDS', 'Advance Recovery', 'Other Deductions', 'Total Deductions', 'Net Pay',
  ];

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const filename = `Payroll_${MONTH_NAMES[run.month]}_${run.year}.csv`;

  logAudit({
    userId: user.id,
    userEmail: user.email ?? undefined,
    action: 'export',
    entityType: 'payroll',
    entityId: id,
    entityLabel: `Payroll ${MONTH_NAMES[run.month]} ${run.year}`,
  });

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
