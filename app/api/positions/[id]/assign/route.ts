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

  // If filling: clear any other position currently held by the same employee
  // (one person → one position is the cleaner default; relaxed if the use
  // case ever needs cross-functional assignments).
  if (parsed.data.employee_id) {
    await supabaseAdmin
      .from('positions')
      .update({ filled_by_employee_id: null })
      .eq('filled_by_employee_id', parsed.data.employee_id);
  }

  const { error } = await supabaseAdmin
    .from('positions')
    .update({ filled_by_employee_id: parsed.data.employee_id, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
