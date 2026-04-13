import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { BookOpenCheck, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default async function CashBookPage() {
  // Cash expenses (payments made in cash)
  const { data: cashExpenses } = await supabaseAdmin
    .from('expenses')
    .select('id, description, vendor_name, amount, gst_input_credit, expense_date, category, notes')
    .eq('payment_mode', 'Cash')
    .order('expense_date', { ascending: false });

  // Cash receipts from orders (reimbursements paid in cash)
  const { data: cashReceipts } = await supabaseAdmin
    .from('order_payments')
    .select('id, payment_date, amount_received, notes, orders(order_no, client_name)')
    .ilike('notes', '%cash%')
    .order('payment_date', { ascending: false });

  // Combine into a unified ledger
  type CashEntry = {
    date: string;
    voucher: string;
    description: string;
    party: string;
    debit: number;   // cash received
    credit: number;  // cash paid out
    type: 'receipt' | 'payment';
    id: string;
  };

  const entries: CashEntry[] = [];

  for (const e of (cashExpenses ?? [])) {
    entries.push({
      date: e.expense_date,
      voucher: `EXP-${(e.id as string).substring(0, 8).toUpperCase()}`,
      description: e.description ?? '',
      party: e.vendor_name ?? 'Cash',
      debit: 0,
      credit: e.amount + (e.gst_input_credit ?? 0),
      type: 'payment',
      id: e.id,
    });
  }

  for (const r of (cashReceipts ?? [])) {
    const order = (r.orders as unknown as { order_no: string; client_name: string }) ?? null;
    entries.push({
      date: r.payment_date,
      voucher: order?.order_no ?? `RCP-${(r.id as string).substring(0, 8).toUpperCase()}`,
      description: r.notes ?? `Payment for ${order?.order_no ?? 'order'}`,
      party: order?.client_name ?? 'Customer',
      debit: r.amount_received,
      credit: 0,
      type: 'receipt',
      id: r.id,
    });
  }

  // Sort by date descending
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Running balance
  let balance = 0;
  const withBalance = entries.reverse().map(e => {
    balance += e.debit - e.credit;
    return { ...e, balance };
  }).reverse();

  // Totals
  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <BookOpenCheck className="h-7 w-7 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Cash Book</h1>
          <p className="text-sm text-zinc-500">All cash receipts and payments — FY 2025-26</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-zinc-500 uppercase">Cash Received</span>
          </div>
          <p className="text-xl font-bold text-emerald-400">{fmt(totalDebit)}</p>
        </div>
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-4 w-4 text-red-400" />
            <span className="text-xs text-zinc-500 uppercase">Cash Paid</span>
          </div>
          <p className="text-xl font-bold text-red-400">{fmt(totalCredit)}</p>
        </div>
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <BookOpenCheck className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-zinc-500 uppercase">Net Balance</span>
          </div>
          <p className={`text-xl font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(balance)}</p>
        </div>
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <BookOpenCheck className="h-4 w-4 text-zinc-400" />
            <span className="text-xs text-zinc-500 uppercase">Entries</span>
          </div>
          <p className="text-xl font-bold text-white">{entries.length}</p>
        </div>
      </div>

      {/* Ledger table */}
      <div className={`${glass} p-6`}>
        {withBalance.length === 0 ? (
          <p className="text-sm text-zinc-500 py-8 text-center">No cash transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                  <th className="pb-2 pr-3">Date</th>
                  <th className="pb-2 pr-3">Voucher</th>
                  <th className="pb-2 pr-3">Description</th>
                  <th className="pb-2 pr-3">Party</th>
                  <th className="pb-2 pr-3 text-right">Received (Dr)</th>
                  <th className="pb-2 pr-3 text-right">Paid (Cr)</th>
                  <th className="pb-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {withBalance.map((e, idx) => (
                  <tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-2.5 pr-3 text-zinc-400 text-xs whitespace-nowrap">{fmtDate(e.date)}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-zinc-400">{e.voucher}</td>
                    <td className="py-2.5 pr-3 text-zinc-200 max-w-xs truncate">{e.description}</td>
                    <td className="py-2.5 pr-3 text-zinc-400">{e.party}</td>
                    <td className="py-2.5 pr-3 text-right text-emerald-400">{e.debit > 0 ? fmt(e.debit) : ''}</td>
                    <td className="py-2.5 pr-3 text-right text-red-400">{e.credit > 0 ? fmt(e.credit) : ''}</td>
                    <td className={`py-2.5 text-right font-medium ${e.balance >= 0 ? 'text-zinc-200' : 'text-red-400'}`}>{fmt(e.balance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-700 font-bold">
                  <td colSpan={4} className="py-3 pr-3 text-zinc-400 text-right">TOTAL</td>
                  <td className="py-3 pr-3 text-right text-emerald-400">{fmt(totalDebit)}</td>
                  <td className="py-3 pr-3 text-right text-red-400">{fmt(totalCredit)}</td>
                  <td className={`py-3 text-right ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(balance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-600">
        Note: Cash book is auto-generated from expenses (payment_mode = Cash) and order payments.
        For manual cash voucher entries, <Link href="/d/expenses/new" className="text-rose-400 hover:text-rose-300">add an expense</Link> with payment mode &quot;Cash&quot;.
      </p>
    </div>
  );
}
