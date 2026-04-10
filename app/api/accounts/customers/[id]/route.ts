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

const UpdateSchema = z.object({
  name:             z.string().min(1).optional(),
  gstin:            z.string().optional(),
  pan:              z.string().optional(),
  billing_address:  AddressSchema.optional(),
  shipping_address: AddressSchema.optional().nullable(),
  contact_person:   z.string().optional(),
  email:            z.string().email().optional().or(z.literal('')),
  phone:            z.string().optional(),
  state:            z.string().optional(),
  state_code:       z.string().optional(),
  notes:            z.string().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('customers')
    .update(parsed.data)
    .eq('id', id)
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAudit({
    userId: user.id,
    userEmail: user.email ?? undefined,
    action: 'update',
    entityType: 'customer',
    entityId: id,
    entityLabel: `Customer ${parsed.data.name ?? id}`,
    changes: Object.fromEntries(
      Object.entries(parsed.data).map(([k, v]) => [k, { old: null, new: v }]),
    ),
  });

  return NextResponse.json({ success: true, id: data.id });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from('customers')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
