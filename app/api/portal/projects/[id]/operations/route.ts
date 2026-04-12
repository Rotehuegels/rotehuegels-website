import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getPortalUser } from '@/lib/portalAuth';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const portalUser = await getPortalUser();
  if (!portalUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Verify project belongs to client
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('customer_id', portalUser.customerId)
    .single();

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Get operations contract
  const { data: contract } = await supabaseAdmin
    .from('operations_contracts')
    .select('*')
    .eq('project_id', id)
    .single();

  if (!contract) return NextResponse.json({ contract: null });

  // Get last 30 days production
  const { data: logs } = await supabaseAdmin
    .from('production_logs')
    .select('*')
    .eq('contract_id', contract.id)
    .order('log_date', { ascending: false })
    .limit(30);

  const allLogs = logs ?? [];

  // Cumulative stats (all time)
  const { data: allLogsForStats } = await supabaseAdmin
    .from('production_logs')
    .select('zinc_recovered_kg, dross_input_kg, revenue, power_kwh')
    .eq('contract_id', contract.id);

  const all = allLogsForStats ?? [];
  const totalZinc = all.reduce((s, l) => s + (l.zinc_recovered_kg ?? 0), 0);
  const totalDross = all.reduce((s, l) => s + (l.dross_input_kg ?? 0), 0);
  const totalRevenue = all.reduce((s, l) => s + (l.revenue ?? 0), 0);
  const totalPower = all.reduce((s, l) => s + (l.power_kwh ?? 0), 0);
  const avgRecovery = totalDross > 0 ? (totalZinc / totalDross) * 100 : 0;
  const avgPowerPerKg = totalZinc > 0 ? totalPower / totalZinc : 0;

  // Today's production
  const today = new Date().toISOString().split('T')[0];
  const todayLog = allLogs.find(l => l.log_date === today);

  // Latest lab results
  const { data: latestSamples } = await supabaseAdmin
    .from('lab_samples')
    .select('*, lab_results(*, lab_parameters(name, unit))')
    .eq('contract_id', contract.id)
    .eq('status', 'completed')
    .order('collected_at', { ascending: false })
    .limit(4);

  // Out of spec count
  const outOfSpecCount = (latestSamples ?? []).reduce((count, s) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return count + (s.lab_results ?? []).filter((r: any) => !r.is_within_spec).length;
  }, 0);

  return NextResponse.json({
    contract: {
      id: contract.id,
      contract_code: contract.contract_code,
      investment_amount: contract.investment_amount,
      status: contract.status,
      product_type: contract.product_type,
      contract_start: contract.contract_start,
    },
    production: {
      recent: allLogs,
      today: todayLog || null,
    },
    stats: {
      totalZinc, totalDross, totalRevenue, totalPower,
      avgRecovery, avgPowerPerKg,
      roiPercent: contract.investment_amount > 0 ? (totalRevenue / contract.investment_amount) * 100 : 0,
      daysLogged: all.length,
    },
    lab: {
      latestSamples: latestSamples ?? [],
      outOfSpecCount,
    },
  });
}
