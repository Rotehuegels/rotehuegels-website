import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { HandCoins, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

type LedgerEntry = {
  date: string;
  ref: string;
  description: string;
  debit: number;  // amount billed (receivable)
  credit: number; // amount received
  href?: string;
};

export default async function CustomerLedgerPage() {
  // Get all orders grouped by client
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, order_no, client_name, client_gstin, description, order_date, invoice_date, total_value_incl_gst, status, order_payments(id, payment_date, amount_received, tds_deducted, notes)')
    .neq('status', 'cancelled')
    .order('order_date', { ascending: true });

  // Group by client
  const clientMap = new Map<string, {
    name: string;
    gstin: string;
    entries: LedgerEntry[];
    totalBilled: number;
    totalReceived: number;
    totalTds: number;
  }>();

  for (const o of (orders ?? [])) {
    const key = o.client_name;
    if (!clientMap.has(key)) {
      clientMap.set(key, {
        name: o.client_name,
        gstin: o.client_gstin ?? '',
        entries: [],
        totalBilled: 0,
        totalReceived: 0,
        totalTds: 0,
      });
    }
    const client = clientMap.get(key)!;

    // Invoice entry (debit — amount due)
    client.entries.push({
      date: o.invoice_date ?? o.order_date,
      ref: o.order_no,
      description: `Invoice — ${o.description ?? o.order_no}`,
      debit: o.total_value_incl_gst ?? 0,
      credit: 0,
      href: `/d/orders/${o.id}`,
    });
    client.totalBilled += o.total_value_incl_gst ?? 0;

    // Payment entries (credit — amount received)
    const payments = (o.order_payments ?? []) as Array<{
      id: string; payment_date: string; amount_received: number; tds_deducted: number; notes: string;
    }>;
    for (const p of payments) {
      client.entries.push({
        date: p.payment_date,
        ref: o.order_no,
        description: `Payment received${p.tds_deducted ? ` (TDS ₹${p.tds_deducted})` : ''} — ${p.notes ?? o.order_no}`,
        debit: 0,
        credit: p.amount_received + (p.tds_deducted ?? 0),
      });
      client.totalReceived += p.amount_received;
      client.totalTds += p.tds_deducted ?? 0;
    }
  }

  const clients = Array.from(clientMap.values());
  const grandBilled = clients.reduce((s, c) => s + c.totalBilled, 0);
  const grandReceived = clients.reduce((s, c) => s + c.totalReceived + c.totalTds, 0);
  const grandPending = grandBilled - grandReceived;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <HandCoins className="h-7 w-7 text-emerald-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Customer Ledger (Debtors)</h1>
          <p className="text-sm text-zinc-500">Customer-wise billing, receipts, and outstanding balance</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-4 w-4 text-sky-400" />
            <span className="text-xs text-zinc-500 uppercase">Total Billed</span>
          </div>
          <p className="text-xl font-bold text-sky-400">{fmt(grandBilled)}</p>
        </div>
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-zinc-500 uppercase">Total Received</span>
          </div>
          <p className="text-xl font-bold text-emerald-400">{fmt(grandReceived)}</p>
        </div>
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-zinc-500 uppercase">Outstanding</span>
          </div>
          <p className="text-xl font-bold text-amber-400">{fmt(grandPending)}</p>
        </div>
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <HandCoins className="h-4 w-4 text-zinc-400" />
            <span className="text-xs text-zinc-500 uppercase">Customers</span>
          </div>
          <p className="text-xl font-bold text-white">{clients.length}</p>
        </div>
      </div>

      {/* Per-customer ledger */}
      {clients.map(client => {
        const pending = client.totalBilled - client.totalReceived - client.totalTds;
        // Sort entries by date and compute running balance
        const sorted = [...client.entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let runBal = 0;
        const withBal = sorted.map(e => {
          runBal += e.debit - e.credit;
          return { ...e, balance: runBal };
        });

        return (
          <div key={client.name} className={`${glass} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{client.name}</h2>
                {client.gstin && <p className="text-xs text-zinc-500 font-mono">{client.gstin}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">Outstanding</p>
                <p className={`text-lg font-bold ${pending > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {fmt(pending)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-500 border-b border-zinc-800">
                    <th className="pb-2 pr-3">Date</th>
                    <th className="pb-2 pr-3">Ref</th>
                    <th className="pb-2 pr-3">Description</th>
                    <th className="pb-2 pr-3 text-right">Billed (Dr)</th>
                    <th className="pb-2 pr-3 text-right">Received (Cr)</th>
                    <th className="pb-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {withBal.map((e, idx) => (
                    <tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-2 pr-3 text-zinc-400 text-xs whitespace-nowrap">{fmtDate(e.date)}</td>
                      <td className="py-2 pr-3 font-mono text-xs">
                        {e.href ? (
                          <a href={e.href} className="text-rose-400 hover:text-rose-300">{e.ref}</a>
                        ) : (
                          <span className="text-zinc-400">{e.ref}</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-zinc-300 max-w-xs truncate">{e.description}</td>
                      <td className="py-2 pr-3 text-right text-sky-400">{e.debit > 0 ? fmt(e.debit) : ''}</td>
                      <td className="py-2 pr-3 text-right text-emerald-400">{e.credit > 0 ? fmt(e.credit) : ''}</td>
                      <td className={`py-2 text-right font-medium ${e.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{fmt(e.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-zinc-700 font-bold">
                    <td colSpan={3} className="py-3 text-right text-zinc-400">TOTAL</td>
                    <td className="py-3 text-right text-sky-400">{fmt(client.totalBilled)}</td>
                    <td className="py-3 text-right text-emerald-400">{fmt(client.totalReceived + client.totalTds)}</td>
                    <td className={`py-3 text-right ${pending > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{fmt(pending)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
