import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().max(500).optional().nullable(),
});

// POST /api/listings/[id]/moderate — admin only
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const newStatus = parsed.data.action === 'approve' ? 'approved' : 'rejected';

  const { data, error } = await supabaseAdmin.from('listings').update({
    moderation_status: newStatus,
    moderation_notes: parsed.data.notes ?? null,
    moderated_at: new Date().toISOString(),
    moderated_by: user.email ?? null,
  }).eq('id', id).select('id, moderation_status').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, listing: data });
}
