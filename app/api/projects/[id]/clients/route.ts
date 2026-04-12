import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { validatePassword } from '@/lib/passwordValidation';

// POST — create a client user for this project's customer
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { email, password, display_name, phone } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
  }

  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) {
    return NextResponse.json({ error: `Weak password: ${pwCheck.errors.join(', ')}` }, { status: 400 });
  }

  // Get the project's customer_id
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('customer_id')
    .eq('id', id)
    .single();

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  // Create profile with client role
  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .upsert({
      id: authData.user.id,
      role: 'client',
      customer_id: project.customer_id,
      display_name: display_name || null,
      phone: phone || null,
    });

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  return NextResponse.json({ id: authData.user.id, email, display_name }, { status: 201 });
}
