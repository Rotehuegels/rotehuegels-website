import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { signToken } from '@/lib/recyclerSession';

export const dynamic = 'force-dynamic';

// GET — verify recycler by code + email, set session cookie
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const email = url.searchParams.get('email');

  if (!code || !email) {
    return NextResponse.json({ error: 'Recycler code and email required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('recyclers')
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

  const res = NextResponse.json({ id: data.id, code: data.recycler_code, name: data.company_name });

  // Set signed session cookie — httpOnly, 7 days
  res.cookies.set('recycler_session', signToken(data.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
