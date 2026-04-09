export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

async function auth() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

// POST /api/payroll/runs/[runId]/process — lock the run (draft → processed)
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { runId } = await params;

  const { data: run } = await supabaseAdmin
    .from('payroll_runs').select('status').eq('id', runId).single();
  if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  if (run.status !== 'draft') return NextResponse.json({ error: 'Already processed.' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('payroll_runs')
    .update({ status: 'processed', processed_at: new Date().toISOString() })
    .eq('id', runId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// POST /api/payroll/runs/[runId]/process (with body { action: 'mark_paid' }) — processed → paid
export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { runId } = await params;

  const { error } = await supabaseAdmin
    .from('payroll_runs')
    .update({ status: 'paid' })
    .eq('id', runId)
    .eq('status', 'processed');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
