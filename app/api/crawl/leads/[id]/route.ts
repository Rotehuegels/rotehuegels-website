import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// ── POST — Update lead status ─────────────────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, notes, table } = body as {
      status: string;
      notes?: string;
      table?: 'supplier_leads' | 'customer_leads';
    };

    if (!['reviewed', 'approved', 'rejected', 'contacted', 'qualified'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const targetTable = table ?? 'supplier_leads';
    const updateData: Record<string, unknown> = {
      status,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (notes) updateData.relevance_notes = notes;

    const { error } = await supabaseAdmin
      .from(targetTable)
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[POST /api/crawl/leads/[id]] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
