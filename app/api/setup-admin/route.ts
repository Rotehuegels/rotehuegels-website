export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const SETUP_KEY = process.env.ADMIN_SETUP_KEY;
const ADMIN_EMAIL = 'sivakumar@rotehuegels.com';
const ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD;

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get('key');

  if (!SETUP_KEY || key !== SETUP_KEY) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'ADMIN_INITIAL_PASSWORD env var not set' }, { status: 500 });
  }

  // Check if user already exists
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
  const found = existing?.users?.find(u => u.email === ADMIN_EMAIL);

  if (found) {
    // Update password
    const { error } = await supabaseAdmin.auth.admin.updateUserById(found.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, action: 'password_updated', email: ADMIN_EMAIL });
  }

  // Create new user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, action: 'user_created', email: data.user?.email });
}
