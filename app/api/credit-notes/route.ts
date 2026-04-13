import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('credit_debit_notes')
    .select('*, orders(order_no, client_name)')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Generate note number
    const prefix = body.note_type === 'credit' ? 'CN' : 'DN';
    const { count } = await supabaseAdmin
      .from('credit_debit_notes')
      .select('*', { count: 'exact', head: true })
      .eq('note_type', body.note_type);
    const seq = String((count ?? 0) + 1).padStart(3, '0');
    const noteNo = `${prefix}-${seq}`;

    const { data, error } = await supabaseAdmin
      .from('credit_debit_notes')
      .insert({ ...body, note_no: noteNo, status: 'issued' })
      .select('id, note_no')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, ...data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
