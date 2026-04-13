import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const ALLOWED_TABLES = ['supplier_leads', 'customer_leads', 'trading_leads'] as const;
type LeadTable = (typeof ALLOWED_TABLES)[number];

const ALLOWED_STATUSES = ['reviewed', 'approved', 'rejected', 'contacted', 'qualified'];

// ── POST — Update lead status ─────────────────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    const { status, notes, table } = body as {
      status: string;
      notes?: string;
      table?: string;
    };

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const targetTable: LeadTable = ALLOWED_TABLES.includes(table as LeadTable)
      ? (table as LeadTable)
      : 'supplier_leads';

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
