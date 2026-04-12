import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { invalidateCompanyCache } from '@/lib/company';

// GET — return current company settings
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('company_settings')
    .select('*')
    .limit(1)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PUT — update company settings
export async function PUT(req: Request) {
  const body = await req.json();

  // Remove fields that shouldn't be overwritten
  delete body.id;
  delete body.created_at;
  delete body.updated_at;

  // Get the existing row id
  const { data: existing } = await supabaseAdmin
    .from('company_settings')
    .select('id')
    .limit(1)
    .single();

  if (!existing) {
    // No row yet — insert
    const { data, error } = await supabaseAdmin
      .from('company_settings')
      .insert(body)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    invalidateCompanyCache();
    return NextResponse.json(data);
  }

  // Update existing row
  const { data, error } = await supabaseAdmin
    .from('company_settings')
    .update(body)
    .eq('id', existing.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidateCompanyCache();
  return NextResponse.json(data);
}
