import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Receipt, Plus } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default async function ReceiptsPage() {
  const { data: receipts } = await supabaseAdmin
    .from('payment_receipts')
    .select('*, orders(order_no, client_name)')
    .order('created_at', { ascending: false });

  const all = receipts ?? [];
  const totalAmount = all.reduce((s, r) => s + (r.amount ?? 0), 0);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="h-7 w-7 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Payment Receipts</h1>
            <p className="text-sm text-zinc-500">Formal receipts issued to customers on payment</p>
          </div>
        </div>
        <Link href="/d/receipts/new" className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-500">
          <Plus className="h-4 w-4" /> New Receipt
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${glass} p-5`}>
          <p className="text-xs text-zinc-500 uppercase mb-1">Receipts Issued</p>
          <p className="text-2xl font-bold text-white">{all.length}</p>
        </div>
        <div className={`${glass} p-5`}>
          <p className="text-xs text-zinc-500 uppercase mb-1">Total Receipted</p>
          <p className="text-2xl font-bold text-emerald-400">{fmt(totalAmount)}</p>
        </div>
      </div>

      <div className={`${glass} p-6`}>
        {all.length === 0 ? (
          <p className="text-sm text-zinc-500 py-8 text-center">No payment receipts issued yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                  <th className="pb-2 pr-3">Receipt No</th>
                  <th className="pb-2 pr-3">Date</th>
                  <th className="pb-2 pr-3">Received From</th>
                  <th className="pb-2 pr-3">Order</th>
                  <th className="pb-2 pr-3">Mode</th>
                  <th className="pb-2 pr-3">Reference</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {all.map(r => {
                  const order = r.orders as { order_no: string; client_name: string } | null;
                  return (
                    <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-2.5 pr-3 font-mono text-xs font-bold">
                        <Link href={`/d/receipts/${r.id}`} className="text-rose-400 hover:text-rose-300">
                          {r.receipt_no}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 text-zinc-400 text-xs">{fmtDate(r.receipt_date)}</td>
                      <td className="py-2.5 pr-3 text-zinc-200">{r.received_from}</td>
                      <td className="py-2.5 pr-3 text-zinc-400 font-mono text-xs">
                        {order ? <Link href={`/d/orders/${r.order_id}`} className="text-rose-400 hover:text-rose-300">{order.order_no}</Link> : '—'}
                      </td>
                      <td className="py-2.5 pr-3 text-zinc-400">{r.payment_mode ?? '—'}</td>
                      <td className="py-2.5 pr-3 text-zinc-500 font-mono text-xs">{r.reference_no ?? '—'}</td>
                      <td className="py-2.5 text-right text-emerald-400 font-medium">{fmt(r.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
