import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// GET — list all e-way bills
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('eway_bills')
    .select('*, orders(order_no, client_name), shipments(tracking_no, carrier)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

// POST — create e-way bill
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Calculate validity: 100 km per day, minimum 1 day
    const distance = body.distance_km ?? 100;
    const validDays = Math.max(1, Math.ceil(distance / 100));
    const validUpto = new Date();
    validUpto.setDate(validUpto.getDate() + validDays);

    const { data, error } = await supabaseAdmin
      .from('eway_bills')
      .insert({
        ...body,
        valid_upto: validUpto.toISOString(),
        status: body.eway_bill_no ? 'generated' : 'draft',
        generated_at: body.eway_bill_no ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
