export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { parseSBIDate, parseAmt } from '@/lib/parseSBI';
import type { ParsedStatement } from '@/lib/parseSBI';
import { supabaseServer } from '@/lib/supabaseServer';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// POST — receive raw XLS bytes, parse server-side, return JSON
export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const buffer = await req.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array', cellDates: false });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, {
      header: 1, raw: false, defval: '',
    });

    let account_no  = '';
    let period_from = '';
    let period_to   = '';
    let headerIdx   = -1;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const key = String(row[0] ?? '').toLowerCase();
      if (key.includes('account number') && row[1])
        account_no = maskAccNo(String(row[1]));
      if (key.includes('start date') && row[1])
        period_from = parseSBIDate(String(row[1])) ?? '';
      if (key.includes('end date') && row[1])
        period_to = parseSBIDate(String(row[1])) ?? '';
      if (key.trim() === 'txn date') { headerIdx = i; break; }
    }

    if (headerIdx === -1)
      return NextResponse.json({ error: 'Could not find "Txn Date" header in XLS.' }, { status: 400 });

    const transactions = [];
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row        = rows[i];
      const txn_date   = parseSBIDate(String(row[0] ?? ''));
      if (!txn_date) continue;
      const value_date = parseSBIDate(String(row[1] ?? '')) ?? txn_date;
      transactions.push({
        txn_date, value_date,
        description: String(row[2] ?? '').trim(),
        ref_no:      String(row[3] ?? '').trim(),
        branch_code: String(row[4] ?? '').trim(),
        debit:       parseAmt(String(row[5] ?? '')),
        credit:      parseAmt(String(row[6] ?? '')),
        balance:     parseAmt(String(row[7] ?? '')),
      });
    }

    const result: ParsedStatement = { account_no, period_from, period_to, transactions };
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to parse XLS.' },
      { status: 400 },
    );
  }
}

function maskAccNo(raw: string): string {
  const digits = raw.replace(/^_+/, '').replace(/\D/g, '');
  return digits.length >= 4 ? `****${digits.slice(-4)}` : digits;
}
