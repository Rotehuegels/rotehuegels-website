export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function escapeCsv(value: string | null | undefined): string {
  if (value == null) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('customer_id, name, gstin, pan, state, email, phone, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const headers = ['Customer ID', 'Name', 'GSTIN', 'PAN', 'State', 'Email', 'Phone', 'Created'];
  const csvLines = [
    headers.join(','),
    ...rows.map(r => [
      escapeCsv(r.customer_id),
      escapeCsv(r.name),
      escapeCsv(r.gstin),
      escapeCsv(r.pan),
      escapeCsv(r.state),
      escapeCsv(r.email),
      escapeCsv(r.phone),
      escapeCsv(r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : ''),
    ].join(',')),
  ];

  const csv = csvLines.join('\r\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="customers.csv"',
    },
  });
}
