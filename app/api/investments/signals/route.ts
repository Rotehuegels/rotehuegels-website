import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const symbol = searchParams.get('symbol');
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('stock_signals')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (symbol) query = query.eq('symbol', symbol);
    if (type) query = query.eq('signal_type', type);
    if (severity) query = query.eq('severity', severity);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ signals: data ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    console.error('Signals fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 });
  }
}
