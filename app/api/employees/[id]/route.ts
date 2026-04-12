export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

const UpdateEngagementSchema = z.object({
  role: z.string().min(1).optional(),
  department: z.string().optional().nullable(),
  reporting_manager: z.string().optional().nullable(),
  employment_type: z.enum(['full_time', 'rex_network', 'board_member']).optional(),
  rex_subtype: z.enum(['part_time', 'consultant', 'contract', 'intern']).optional().nullable(),
  status: z.enum(['active', 'inactive', 'terminated', 'completed']).optional(),
  join_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  termination_reason: z.string().optional().nullable(),
  termination_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  termination_type: z.enum(['resignation', 'termination', 'contract_end', 'retirement', 'other']).optional().nullable(),
  basic_salary: z.coerce.number().nonnegative().optional().nullable(),
  allowance: z.coerce.number().nonnegative().optional().nullable(),
  bonus: z.coerce.number().nonnegative().optional().nullable(),
  // Rex member personal details — if rex_id exists, these update the rex_members table
  full_name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  national_id: z.string().optional().nullable(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  bank_name: z.string().optional().nullable(),
  bank_account: z.string().optional().nullable(),
  bank_ifsc: z.string().optional().nullable(),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('employees')
    .select('*, rex_members(full_name, email, phone, address, national_id, date_of_birth, bank_name, bank_account, bank_ifsc, emergency_contact_name, emergency_contact_phone)')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = UpdateEngagementSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const d = parsed.data;

  // Separate engagement fields from rex_member fields
  const engagementFields: Record<string, unknown> = {};
  const memberFields: Record<string, unknown> = {};

  const engKeys = ['role', 'department', 'reporting_manager', 'employment_type', 'rex_subtype', 'status', 'join_date', 'end_date', 'basic_salary', 'allowance', 'bonus', 'termination_reason', 'termination_date', 'termination_type'];
  const memberKeys = ['full_name', 'phone', 'email', 'address', 'national_id', 'date_of_birth', 'bank_name', 'bank_account', 'bank_ifsc', 'emergency_contact_name', 'emergency_contact_phone'];

  for (const [key, value] of Object.entries(d)) {
    if (engKeys.includes(key) && value !== undefined) {
      engagementFields[key] = value;
    }
    if (memberKeys.includes(key) && value !== undefined) {
      memberFields[key] = value;
    }
  }

  // Update engagement
  if (Object.keys(engagementFields).length > 0) {
    const { error } = await supabaseAdmin
      .from('employees')
      .update(engagementFields)
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update rex_member if personal fields provided
  if (Object.keys(memberFields).length > 0) {
    const { data: eng } = await supabaseAdmin
      .from('employees')
      .select('rex_id')
      .eq('id', id)
      .single();

    if (eng?.rex_id) {
      const { error } = await supabaseAdmin
        .from('rex_members')
        .update(memberFields)
        .eq('rex_id', eng.rex_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
