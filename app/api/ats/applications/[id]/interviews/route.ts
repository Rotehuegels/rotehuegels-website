export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

const CreateSchema = z.object({
  round_type: z.enum(['phone', 'technical', 'hr', 'culture', 'final']),
  scheduled_at: z.string().optional(),
  interviewer: z.string().optional(),
});

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  // Verify application exists
  const { data: app } = await supabaseAdmin
    .from('applications')
    .select('id')
    .eq('id', id)
    .single();
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

  // Get next round number
  const { data: rounds } = await supabaseAdmin
    .from('interview_rounds')
    .select('round_number')
    .eq('application_id', id)
    .order('round_number', { ascending: false })
    .limit(1);

  const nextRound = (rounds?.[0]?.round_number ?? 0) + 1;

  const { data, error } = await supabaseAdmin
    .from('interview_rounds')
    .insert([{
      application_id: id,
      round_number: nextRound,
      round_type: parsed.data.round_type,
      scheduled_at: parsed.data.scheduled_at || null,
      interviewer: parsed.data.interviewer || null,
      status: 'scheduled',
    }])
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
