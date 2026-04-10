export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

async function requireAuth() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get all unreconciled transactions
  const { data: unreconciled, error: fetchErr } = await supabaseAdmin
    .from('bank_transactions')
    .select('*')
    .or('reconciled.is.null,reconciled.eq.false');

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!unreconciled || unreconciled.length === 0) {
    return NextResponse.json({ matched: 0, details: [] });
  }

  // Get all order payments and expenses for matching
  const [paymentsRes, expensesRes] = await Promise.all([
    supabaseAdmin
      .from('order_payments')
      .select('id, order_id, payment_date, amount_received, net_received, tds_deducted, reference_no'),
    supabaseAdmin
      .from('expenses')
      .select('id, expense_date, amount, description, reference_no'),
  ]);

  const payments = paymentsRes.data ?? [];
  const expenses = expensesRes.data ?? [];

  // Get already-matched entity IDs so we don't double-match
  const { data: alreadyMatched } = await supabaseAdmin
    .from('bank_transactions')
    .select('matched_entity_id')
    .eq('reconciled', true)
    .not('matched_entity_id', 'is', null);

  const matchedIds = new Set((alreadyMatched ?? []).map(r => r.matched_entity_id));

  let matchCount = 0;
  const details: { txnId: string; entityType: string; entityId: string }[] = [];

  for (const txn of unreconciled) {
    const txnDate = new Date(txn.txn_date);

    // Credits -> match against order payments (by net_received amount + date proximity)
    if (txn.credit > 0) {
      const match = payments.find(p => {
        if (matchedIds.has(p.id)) return false;
        const netRcvd = p.net_received ?? (p.amount_received - (p.tds_deducted ?? 0));
        const amtMatch = Math.abs(netRcvd - txn.credit) < 1; // within 1 rupee
        if (!amtMatch) return false;
        const pDate = new Date(p.payment_date);
        const daysDiff = Math.abs((txnDate.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 5; // within 5 days
      });

      if (match) {
        const { error: updErr } = await supabaseAdmin
          .from('bank_transactions')
          .update({
            reconciled: true,
            reconciled_at: new Date().toISOString(),
            matched_entity_type: 'order_payment',
            matched_entity_id: match.id,
            match_notes: 'Auto-matched by amount and date',
          })
          .eq('id', txn.id);

        if (!updErr) {
          matchedIds.add(match.id);
          matchCount++;
          details.push({ txnId: txn.id, entityType: 'order_payment', entityId: match.id });
        }
        continue;
      }
    }

    // Debits -> match against expenses (by amount + date proximity)
    if (txn.debit > 0) {
      const match = expenses.find(e => {
        if (matchedIds.has(e.id)) return false;
        const amtMatch = Math.abs(e.amount - txn.debit) < 1;
        if (!amtMatch) return false;
        const eDate = new Date(e.expense_date);
        const daysDiff = Math.abs((txnDate.getTime() - eDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 5;
      });

      if (match) {
        const { error: updErr } = await supabaseAdmin
          .from('bank_transactions')
          .update({
            reconciled: true,
            reconciled_at: new Date().toISOString(),
            matched_entity_type: 'expense',
            matched_entity_id: match.id,
            match_notes: 'Auto-matched by amount and date',
          })
          .eq('id', txn.id);

        if (!updErr) {
          matchedIds.add(match.id);
          matchCount++;
          details.push({ txnId: txn.id, entityType: 'expense', entityId: match.id });
        }
      }
    }
  }

  return NextResponse.json({ matched: matchCount, details });
}
