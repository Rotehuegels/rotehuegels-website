import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// GET — verify recycler by code + email (simple auth for recycler portal)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const email = url.searchParams.get('email');

  if (!code || !email) {
    return NextResponse.json({ error: 'Recycler code and email required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('ewaste_recyclers')
    .select('id, recycler_code, company_name, is_active')
    .eq('recycler_code', code.toUpperCase())
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid recycler code or email' }, { status: 401 });
  }

  if (!data.is_active) {
    return NextResponse.json({ error: 'This recycler account is inactive' }, { status: 403 });
  }

  return NextResponse.json({ id: data.id, code: data.recycler_code, name: data.company_name });
}
