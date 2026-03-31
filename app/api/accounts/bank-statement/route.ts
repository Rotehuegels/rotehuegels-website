export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import type { ParsedTxn } from '@/lib/parseSBI';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('bank_transactions')
    .select('*')
    .order('txn_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

interface ImportBody {
  account_no:     string;
  statement_from: string;
  statement_to:   string;
  transactions:   ParsedTxn[];
}

export async function POST(req: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: ImportBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { account_no, statement_from, statement_to, transactions } = body;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return NextResponse.json({ error: 'No transactions provided.' }, { status: 400 });
  }

  const rows = transactions.map((t) => ({
    account_no:     account_no ?? null,
    statement_from: statement_from || null,
    statement_to:   statement_to || null,
    txn_date:       t.txn_date,
    value_date:     t.value_date,
    description:    t.description,
    ref_no:         t.ref_no || null,
    branch_code:    t.branch_code || null,
    debit:          t.debit,
    credit:         t.credit,
    balance:        t.balance,
  }));

  const { data, error } = await supabaseAdmin
    .from('bank_transactions')
    .upsert(rows, { ignoreDuplicates: true })
    .select('id');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ inserted: data?.length ?? 0 }, { status: 200 });
}
