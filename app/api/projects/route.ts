import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET — list all projects (admin)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*, customers(name, customer_id)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — create project
export async function POST(req: Request) {
  const body = await req.json();
  const { customer_id, name, description, start_date, target_end_date, site_location, project_manager } = body;

  if (!customer_id || !name) {
    return NextResponse.json({ error: 'customer_id and name are required' }, { status: 400 });
  }

  // Generate project code
  const year = new Date().getFullYear();
  const { count } = await supabaseAdmin
    .from('projects')
    .select('id', { count: 'exact', head: true });

  const code = `PRJ-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`;

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({
      project_code: code,
      customer_id,
      name,
      description: description || null,
      start_date: start_date || null,
      target_end_date: target_end_date || null,
      site_location: site_location || null,
      project_manager: project_manager || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
