export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

const UpdateSchema = z.object({
  title: z.string().min(3).optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  employment_type: z.enum(['full_time', 'part_time', 'consultant', 'contract']).optional(),
  description: z.string().min(20).optional(),
  requirements: z.string().optional(),
  status: z.enum(['draft', 'published', 'closed']).optional(),
});

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('job_postings')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
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

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  // Tag the row with the editor email so the version-snapshot trigger
  // records who made the change.
  const { error } = await supabaseAdmin
    .from('job_postings')
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
      last_edited_by_email: user.email ?? null,
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { error } = await supabaseAdmin.from('job_postings').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
