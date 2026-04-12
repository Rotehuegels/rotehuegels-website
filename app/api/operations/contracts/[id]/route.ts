import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: contract, error } = await supabaseAdmin
    .from('operations_contracts')
    .select('*, projects(project_code, name, customer_id, customers(name, customer_id))')
    .eq('id', id)
    .single();

  if (error || !contract) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [logsRes, samplesRes] = await Promise.all([
    supabaseAdmin.from('production_logs').select('*').eq('contract_id', id).order('log_date', { ascending: false }).limit(60),
    supabaseAdmin.from('lab_samples').select('*, lab_results(*)').eq('contract_id', id).order('collected_at', { ascending: false }).limit(30),
  ]);

  // Cumulative stats
  const logs = logsRes.data ?? [];
  const totalZinc = logs.reduce((s, l) => s + (l.zinc_recovered_kg ?? 0), 0);
  const totalRevenue = logs.reduce((s, l) => s + (l.revenue ?? 0), 0);
  const totalDross = logs.reduce((s, l) => s + (l.dross_input_kg ?? 0), 0);
  const avgRecovery = totalDross > 0 ? (totalZinc / totalDross) * 100 : 0;

  return NextResponse.json({
    contract,
    logs,
    samples: samplesRes.data ?? [],
    stats: { totalZinc, totalRevenue, totalDross, avgRecovery, logCount: logs.length },
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  delete body.id;
  delete body.created_at;
  delete body.contract_code;

  const { data, error } = await supabaseAdmin
    .from('operations_contracts')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
