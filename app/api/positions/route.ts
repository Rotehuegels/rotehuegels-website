export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

// Create-position payload. Used today by the org-chart "Add regional rep" form;
// general enough to grow into a full position-management surface later.
const CreateSchema = z.object({
  id:             z.string().min(2).regex(/^[a-z0-9-]+$/, 'Lowercase, digits, hyphens only').max(48),
  title:          z.string().min(2).max(120),
  short_title:    z.string().max(48).optional(),
  department_id:  z.string().min(2),
  reports_to_id:  z.string().min(2),
  level:          z.coerce.number().int().min(0).max(5),
  is_head:        z.boolean().default(false),
  sort_order:     z.coerce.number().int().default(900),
  country_code:   z.string().length(2).optional().nullable(),
  is_external:    z.boolean().default(false),
});

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  // Verify the parent position exists so we don't create orphans.
  const { data: parent } = await supabaseAdmin
    .from('positions').select('id, level').eq('id', parsed.data.reports_to_id).maybeSingle();
  if (!parent) return NextResponse.json({ error: `Parent position "${parsed.data.reports_to_id}" not found.` }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('positions')
    .insert({
      id:            parsed.data.id,
      title:         parsed.data.title,
      short_title:   parsed.data.short_title ?? null,
      department_id: parsed.data.department_id,
      reports_to_id: parsed.data.reports_to_id,
      level:         parsed.data.level,
      is_head:       parsed.data.is_head,
      sort_order:    parsed.data.sort_order,
      country_code:  parsed.data.country_code?.toUpperCase() ?? null,
      is_external:   parsed.data.is_external,
    })
    .select('id, title')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A position with this id already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id, title: data.title }, { status: 201 });
}

// DELETE /api/positions?id=xyz — only allowed when nobody is assigned and no
// other positions report to it (otherwise we'd orphan reportees).
export async function DELETE(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const id  = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const [{ data: pos }, { count: reportees }] = await Promise.all([
    supabaseAdmin.from('positions').select('filled_by_employee_id').eq('id', id).maybeSingle(),
    supabaseAdmin.from('positions').select('*', { count: 'exact', head: true }).eq('reports_to_id', id),
  ]);
  if (!pos) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (pos.filled_by_employee_id) {
    return NextResponse.json({ error: 'Vacate the position before deleting it.' }, { status: 409 });
  }
  if ((reportees ?? 0) > 0) {
    return NextResponse.json({ error: `${reportees} position(s) report to this. Reassign them first.` }, { status: 409 });
  }

  const { error } = await supabaseAdmin.from('positions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
