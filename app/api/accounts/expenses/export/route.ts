export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: expenses, error } = await supabaseAdmin
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = 'Date,Type,Description,Amount,GST Credit,Vendor,Payment Mode';

  const rows = (expenses ?? []).map(e => {
    const date = new Date(e.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const descEscaped = `"${(e.description ?? '').replace(/"/g, '""')}"`;
    const vendorEscaped = `"${(e.vendor_name ?? '').replace(/"/g, '""')}"`;
    return [
      date,
      e.expense_type,
      descEscaped,
      (e.amount ?? 0).toFixed(2),
      (e.gst_input_credit ?? 0).toFixed(2),
      vendorEscaped,
      e.payment_mode ?? '',
    ].join(',');
  });

  const csv = [header, ...rows].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="expenses-export.csv"',
    },
  });
}
