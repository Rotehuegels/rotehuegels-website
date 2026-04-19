import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const RecyclerSchema = z.object({
  company_name: z.string().min(2),
  contact_person: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  gstin: z.string().optional(),
  cpcb_registration: z.string().optional(),
  spcb_registration: z.string().optional(),
  license_valid_until: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  capacity_per_month: z.string().optional(),
  service_radius_km: z.number().default(100),
  notes: z.string().optional(),
});

// GET — list recyclers (auth required; dashboard users only)
export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('recyclers')
    .select('*')
    .order('company_name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST — register new recycler
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = RecyclerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { count } = await supabaseAdmin.from('recyclers').select('*', { count: 'exact', head: true });
  const seq = String((count ?? 0) + 1).padStart(3, '0');
  const recyclerCode = `RCY-${seq}`;

  const { data, error } = await supabaseAdmin
    .from('recyclers')
    .insert({ ...parsed.data, recycler_code: recyclerCode })
    .select('id, recycler_code')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAudit({
    userId: user.id, userEmail: user.email ?? undefined,
    action: 'create', entityType: 'ewaste_recycler', entityId: data.id,
    entityLabel: `${recyclerCode} - ${parsed.data.company_name}`,
  });

  return NextResponse.json({ success: true, id: data.id, recycler_code: recyclerCode }, { status: 201 });
}
