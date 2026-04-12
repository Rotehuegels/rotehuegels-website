export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { sendCandidateStageEmail } from '@/lib/notifications';

const UpdateSchema = z.object({
  stage: z.enum(['applied', 'shortlisted', 'interview', 'offer', 'hired', 'rejected']).optional(),
  notes: z.string().max(5000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  rejection_reason: z.string().max(1000).optional(),
});

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const [{ data: app, error }, { data: interviews }] = await Promise.all([
    supabaseAdmin
      .from('applications')
      .select('*')
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('interview_rounds')
      .select('*')
      .eq('application_id', id)
      .order('round_number', { ascending: true }),
  ]);

  if (error || !app) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: { ...app, interviews: interviews ?? [] } });
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

  const { error } = await supabaseAdmin
    .from('applications')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send candidate email on stage change
  if (parsed.data.stage && parsed.data.stage !== 'applied') {
    sendCandidateStageEmail(id, parsed.data.stage).catch(err =>
      console.error('[ats] Failed to send stage email:', err)
    );
  }

  return NextResponse.json({ success: true });
}
