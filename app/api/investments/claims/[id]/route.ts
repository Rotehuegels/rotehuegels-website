import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, actual_result, notes } = body as {
      status?: string;
      actual_result?: string;
      notes?: string;
    };

    const updates: Record<string, string> = {};
    if (status) updates.status = status;
    if (actual_result) updates.actual_result = actual_result;
    if (notes) updates.notes = notes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('stock_claims')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ claim: data });
  } catch (err) {
    console.error('Claim update error:', err);
    return NextResponse.json({ error: 'Failed to update claim' }, { status: 500 });
  }
}
