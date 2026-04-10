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
    .from('suppliers')
    .select('vendor_code, legal_name, trade_name, gstin, pan, state, email, phone, gst_status')
    .order('legal_name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const headers = ['Vendor Code', 'Legal Name', 'Trade Name', 'GSTIN', 'PAN', 'State', 'Email', 'Phone', 'GST Status'];
  const csvLines = [
    headers.join(','),
    ...rows.map(r => [
      escapeCsv(r.vendor_code),
      escapeCsv(r.legal_name),
      escapeCsv(r.trade_name),
      escapeCsv(r.gstin),
      escapeCsv(r.pan),
      escapeCsv(r.state),
      escapeCsv(r.email),
      escapeCsv(r.phone),
      escapeCsv(r.gst_status),
    ].join(',')),
  ];

  const csv = csvLines.join('\r\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="suppliers.csv"',
    },
  });
}
