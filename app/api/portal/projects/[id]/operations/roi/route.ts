import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const portalUser = await getPortalUser();
  if (!portalUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: project } = await supabaseAdmin
    .from('projects').select('id').eq('id', id).eq('customer_id', portalUser.customerId).single();
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: contract } = await supabaseAdmin
    .from('operations_contracts').select('id, investment_amount, contract_start').eq('project_id', id).single();
  if (!contract) return NextResponse.json({ error: 'No operations contract' }, { status: 404 });

  // Get all production logs sorted by date
  const { data: logs } = await supabaseAdmin
    .from('production_logs')
    .select('log_date, revenue, zinc_recovered_kg')
    .eq('contract_id', contract.id)
    .order('log_date');

  const entries = logs ?? [];
  const investment = contract.investment_amount ?? 0;

  // Build cumulative timeline
  let cumulative = 0;
  const timeline = entries.map(l => {
    cumulative += l.revenue ?? 0;
    return {
      date: l.log_date,
      daily_revenue: l.revenue ?? 0,
      cumulative_revenue: cumulative,
      recovery_pct: investment > 0 ? (cumulative / investment) * 100 : 0,
      zinc_kg: l.zinc_recovered_kg ?? 0,
    };
  });

  // Estimate breakeven
  const avgDailyRevenue = entries.length > 0
    ? entries.reduce((s, l) => s + (l.revenue ?? 0), 0) / entries.length
    : 0;

  const remaining = Math.max(0, investment - cumulative);
  const daysToBreakeven = avgDailyRevenue > 0 ? Math.ceil(remaining / avgDailyRevenue) : null;
  const breakevenDate = daysToBreakeven !== null
    ? new Date(Date.now() + daysToBreakeven * 86400000).toISOString().split('T')[0]
    : null;

  return NextResponse.json({
    investment,
    totalRevenue: cumulative,
    recoveryPct: investment > 0 ? (cumulative / investment) * 100 : 0,
    remaining,
    avgDailyRevenue,
    daysToBreakeven,
    estimatedBreakeven: breakevenDate,
    timeline,
  });
}
