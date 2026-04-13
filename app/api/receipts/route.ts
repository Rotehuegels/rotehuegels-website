import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('payment_receipts')
    .select('*, orders(order_no, client_name)')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Generate receipt number
    const { count } = await supabaseAdmin
      .from('payment_receipts')
      .select('*', { count: 'exact', head: true });
    const seq = String((count ?? 0) + 1).padStart(3, '0');
    const receiptNo = `RCP-${seq}`;

    const { data, error } = await supabaseAdmin
      .from('payment_receipts')
      .insert({ ...body, receipt_no: receiptNo })
      .select('id, receipt_no')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, ...data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
