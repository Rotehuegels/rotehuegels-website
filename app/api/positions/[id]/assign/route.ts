export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

// PATCH /api/positions/[id]/assign
//   { employee_id: uuid }   → fill the position
//   { employee_id: null  }  → clear (vacate)
const Schema = z.object({
  employee_id: z.string().uuid().nullable(),
});

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  // Single atomic RPC. Vacates any prior position held by this employee
  // and sets the target position in one transaction — so a failure can't
  // leave the employee orphaned with no position.
  const { error } = await supabaseAdmin.rpc('assign_employee_to_position', {
    p_position_id: id,
    p_employee_id: parsed.data.employee_id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
