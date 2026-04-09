export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

const EmployeeSchema = z.object({
  full_name: z.string().min(2),
  employment_type: z.enum(['full_time', 'part_time', 'consultant', 'contract', 'intern']),
  rex_id: z.string().optional(),
  role: z.string().min(1),
  department: z.string().optional(),
  reporting_manager: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  national_id: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account: z.string().optional(),
  bank_ifsc: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  basic_salary: z.coerce.number().nonnegative().optional(),
  allowance: z.coerce.number().nonnegative().optional(),
  bonus: z.coerce.number().nonnegative().optional(),
  join_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('employees')
    .select('id, full_name, role, department, employment_type, email, phone, status, join_date, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = EmployeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const d = parsed.data;

  // Interns must provide a REX ID — it becomes their employee_code
  if (d.employment_type === 'intern' && !d.rex_id?.trim()) {
    return NextResponse.json({ error: 'REX ID is required for interns.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.from('employees').insert([{
    full_name: d.full_name,
    employment_type: d.employment_type,
    role: d.role,
    department: d.department || null,
    reporting_manager: d.reporting_manager || null,
    phone: d.phone || null,
    email: d.email || null,
    address: d.address || null,
    national_id: d.national_id || null,
    bank_name: d.bank_name || null,
    bank_account: d.bank_account || null,
    bank_ifsc: d.bank_ifsc || null,
    emergency_contact_name: d.emergency_contact_name || null,
    emergency_contact_phone: d.emergency_contact_phone || null,
    basic_salary: d.basic_salary ?? null,
    allowance: d.allowance ?? null,
    bonus: d.bonus ?? null,
    join_date: d.join_date || new Date().toISOString().split('T')[0],
    // Interns: use REX ID as employee_code (trigger skips auto-gen when not null)
    ...(d.employment_type === 'intern' && d.rex_id ? { employee_code: d.rex_id.trim().toUpperCase() } : {}),
  }]).select('id').single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Email already exists.' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
