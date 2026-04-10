export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

interface ReconcileBody {
  transactionId: string;
  entityType: 'order_payment' | 'expense' | 'payroll' | 'other';
  entityId?: string;
  notes?: string;
}

export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: ReconcileBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { transactionId, entityType, entityId, notes } = body;

  if (!transactionId || !entityType) {
    return NextResponse.json({ error: 'transactionId and entityType are required.' }, { status: 400 });
  }

  const validTypes = ['order_payment', 'expense', 'payroll', 'other'];
  if (!validTypes.includes(entityType)) {
    return NextResponse.json({ error: `entityType must be one of: ${validTypes.join(', ')}` }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('bank_transactions')
    .update({
      reconciled: true,
      reconciled_at: new Date().toISOString(),
      matched_entity_type: entityType,
      matched_entity_id: entityId || null,
      match_notes: notes || null,
    })
    .eq('id', transactionId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// DELETE — un-reconcile a transaction
export async function DELETE(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get('transactionId');
  if (!transactionId) return NextResponse.json({ error: 'transactionId is required.' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('bank_transactions')
    .update({
      reconciled: false,
      reconciled_at: null,
      matched_entity_type: null,
      matched_entity_id: null,
      match_notes: null,
    })
    .eq('id', transactionId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
