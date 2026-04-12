import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let query = supabaseAdmin
    .from('customer_leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();

  const year = new Date().getFullYear();
  const { count } = await supabaseAdmin
    .from('customer_leads')
    .select('id', { count: 'exact', head: true });

  const leadCode = `LEAD-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`;

  const { data, error } = await supabaseAdmin
    .from('customer_leads')
    .insert({
      lead_code: leadCode,
      company_name: body.company_name,
      contact_person: body.contact_person || null,
      email: body.email || null,
      phone: body.phone || null,
      industry: body.industry || null,
      source: body.source || 'inquiry',
      notes: body.notes || null,
      next_follow_up: body.next_follow_up || null,
      assigned_to: body.assigned_to || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
