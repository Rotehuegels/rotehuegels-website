export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { logAudit } from '@/lib/audit';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

const AddressSchema = z.object({
  line1:   z.string().min(1),
  line2:   z.string().optional(),
  city:    z.string().min(1),
  state:   z.string().min(1),
  pincode: z.string().optional(),
});

const CustomerSchema = z.object({
  name:             z.string().min(1),
  gstin:            z.string().optional(),
  pan:              z.string().optional(),
  billing_address:  AddressSchema,
  shipping_address: AddressSchema.optional(),
  contact_person:   z.string().optional(),
  email:            z.string().email().optional().or(z.literal('')),
  phone:            z.string().optional(),
  state:            z.string().optional(),
  state_code:       z.string().optional(),
  notes:            z.string().optional(),
});

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('id, customer_id, name, gstin, contact_person, email, phone, state, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = CustomerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  // Auto-derive state + PAN from GSTIN if not supplied
  let { state, state_code, pan } = parsed.data;
  if (parsed.data.gstin && parsed.data.gstin.length >= 15) {
    if (!state_code) state_code = parsed.data.gstin.slice(0, 2);
    if (!pan)        pan        = parsed.data.gstin.slice(2, 12);
  }

  // Generate customer_id
  const { count } = await supabaseAdmin
    .from('customers')
    .select('*', { count: 'exact', head: true });
  const seq = String((count ?? 0) + 1).padStart(3, '0');
  const customer_id = `CUST-${seq}`;

  const { data, error } = await supabaseAdmin
    .from('customers')
    .insert([{ ...parsed.data, customer_id, state, state_code, pan }])
    .select('id, customer_id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAudit({
    userId: user.id,
    userEmail: user.email ?? undefined,
    action: 'create',
    entityType: 'customer',
    entityId: data.id,
    entityLabel: `Customer ${parsed.data.name}`,
    metadata: { customer_id: data.customer_id, gstin: parsed.data.gstin },
  });

  return NextResponse.json({ success: true, id: data.id, customer_id: data.customer_id }, { status: 201 });
}
