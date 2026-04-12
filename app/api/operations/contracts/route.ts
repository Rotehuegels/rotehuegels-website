import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('operations_contracts')
    .select('*, projects(project_code, name, customers(name, customer_id))')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { project_id, investment_amount, contract_start, contract_end, product_type, notes } = body;

  if (!project_id) return NextResponse.json({ error: 'project_id is required' }, { status: 400 });

  const year = new Date().getFullYear();
  const { count } = await supabaseAdmin
    .from('operations_contracts')
    .select('id', { count: 'exact', head: true });

  const code = `OPS-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`;

  const { data, error } = await supabaseAdmin
    .from('operations_contracts')
    .insert({
      project_id,
      contract_code: code,
      investment_amount: investment_amount || 0,
      contract_start: contract_start || null,
      contract_end: contract_end || null,
      product_type: product_type || 'zinc',
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
