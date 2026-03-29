export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

const JobSchema = z.object({
  title: z.string().min(3),
  department: z.string().optional(),
  location: z.string().default('Chennai, India'),
  employment_type: z.enum(['full_time', 'part_time', 'consultant', 'contract']),
  description: z.string().min(20),
  requirements: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
});

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET — list all jobs (admin: all; public not used here)
export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('job_postings')
    .select('id, title, department, location, employment_type, status, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST — create job
export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = JobSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('job_postings')
    .insert([parsed.data])
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
