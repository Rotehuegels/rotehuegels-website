import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { CreditCard, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

type LedgerEntry = {
  date: string;
  ref: string;
  description: string;
  debit: number;  // payment made to supplier
  credit: number; // amount owed (PO/invoice)
  href?: string;
};

export default async function CreditorsLedgerPage() {
  // Get all POs with payments
  const { data: pos } = await supabaseAdmin
    .from('purchase_orders')
    .select('id, po_no, supplier_id, po_date, total_amount, status, notes, suppliers(legal_name, gstin), po_payments(id, payment_date, amount, payment_type, notes)')
    .order('po_date', { ascending: true });

  // Get all expenses grouped by vendor
  const { data: expenses } = await supabaseAdmin
    .from('expenses')
    .select('id, description, vendor_name, amount, gst_input_credit, expense_date, payment_mode, notes')
    .not('vendor_name', 'is', null)
    .order('expense_date', { ascending: true });

  // Build supplier map
  const supplierMap = new Map<string, {
    name: string;
    gstin: string;
    entries: LedgerEntry[];
    totalOwed: number;
    totalPaid: number;
  }>();

  const getSupplier = (name: string, gstin?: string) => {
    const key = name.trim().toLowerCase();
    if (!supplierMap.has(key)) {
      supplierMap.set(key, { name, gstin: gstin ?? '', entries: [], totalOwed: 0, totalPaid: 0 });
    }
    return supplierMap.get(key)!;
  };

  // PO entries
  for (const po of (pos ?? [])) {
    const supplier = (po.suppliers as unknown as { legal_name: string; gstin: string }) ?? null;
    const s = getSupplier(supplier?.legal_name ?? 'Unknown Supplier', supplier?.gstin);

    // PO raised (credit — we owe them)
    s.entries.push({
      date: po.po_date,
      ref: po.po_no,
      description: `Purchase Order — ${po.notes?.substring(0, 60) ?? po.po_no}`,
      debit: 0,
      credit: po.total_amount ?? 0,
      href: `/d/purchase-orders/${po.id}`,
    });
    s.totalOwed += po.total_amount ?? 0;

    // PO payments (debit — we paid them)
    const payments = (po.po_payments ?? []) as Array<{
      id: string; payment_date: string; amount: number; payment_type: string; notes: string;
    }>;
    for (const p of payments) {
      s.entries.push({
        date: p.payment_date,
        ref: po.po_no,
        description: `Payment (${p.payment_type}) — ${p.notes ?? po.po_no}`,
        debit: p.amount,
        credit: 0,
      });
      s.totalPaid += p.amount;
    }
  }

  // Expense entries (direct vendor payments)
  for (const e of (expenses ?? [])) {
    const vendorName = e.vendor_name as string;
    // Skip if this vendor is already tracked via PO (avoid double-counting)
    const key = vendorName.trim().toLowerCase();
    const existing = supplierMap.get(key);

    const s = getSupplier(vendorName);

    // For vendors tracked via PO, only add if expense description doesn't match PO
    if (existing && existing.entries.some(en => en.ref.startsWith('PO-'))) {
      // Already tracked via PO — check if this is a separate expense
      const isPOPayment = (e.notes as string)?.toLowerCase().includes('po-') || (e.description as string)?.toLowerCase().includes('po-');
      if (isPOPayment) continue; // Skip — already in PO payments
    }

    const totalAmount = (e.amount ?? 0) + (e.gst_input_credit ?? 0);
    s.entries.push({
      date: e.expense_date,
      ref: `EXP-${(e.id as string).substring(0, 8).toUpperCase()}`,
      description: e.description ?? '',
      debit: totalAmount, // We paid this
      credit: totalAmount, // We owed and paid simultaneously
    });
    s.totalOwed += totalAmount;
    s.totalPaid += totalAmount;
  }

  const suppliers = Array.from(supplierMap.values())
    .filter(s => s.entries.length > 0)
    .sort((a, b) => (b.totalOwed - b.totalPaid) - (a.totalOwed - a.totalPaid)); // Sort by outstanding desc

  const grandOwed = suppliers.reduce((s, c) => s + c.totalOwed, 0);
  const grandPaid = suppliers.reduce((s, c) => s + c.totalPaid, 0);
  const grandPending = grandOwed - grandPaid;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-7 w-7 text-rose-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Creditors Ledger (Payables)</h1>
          <p className="text-sm text-zinc-500">Supplier-wise purchases, payments, and outstanding dues</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft className="h-4 w-4 text-sky-400" />
            <span className="text-xs text-zinc-500 uppercase">Total Purchases</span>
          </div>
          <p className="text-xl font-bold text-sky-400">{fmt(grandOwed)}</p>
        </div>
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-zinc-500 uppercase">Total Paid</span>
          </div>
          <p className="text-xl font-bold text-emerald-400">{fmt(grandPaid)}</p>
        </div>
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-xs text-zinc-500 uppercase">Outstanding Dues</span>
          </div>
          <p className="text-xl font-bold text-red-400">{fmt(grandPending)}</p>
        </div>
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-zinc-400" />
            <span className="text-xs text-zinc-500 uppercase">Suppliers</span>
          </div>
          <p className="text-xl font-bold text-white">{suppliers.length}</p>
        </div>
      </div>

      {/* Per-supplier ledger */}
      {suppliers.map(supplier => {
        const pending = supplier.totalOwed - supplier.totalPaid;
        const sorted = [...supplier.entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let runBal = 0;
        const withBal = sorted.map(e => {
          runBal += e.credit - e.debit; // Positive = we owe, negative = overpaid
          return { ...e, balance: runBal };
        });

        // Skip suppliers with zero balance and only settled expense entries
        if (pending === 0 && supplier.entries.length <= 2) return null;

        return (
          <div key={supplier.name} className={`${glass} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{supplier.name}</h2>
                {supplier.gstin && <p className="text-xs text-zinc-500 font-mono">{supplier.gstin}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">Outstanding</p>
                <p className={`text-lg font-bold ${pending > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {pending > 0 ? fmt(pending) : 'Settled'}
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
                    <th className="pb-2 pr-3 text-right">Paid (Dr)</th>
                    <th className="pb-2 pr-3 text-right">Owed (Cr)</th>
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
                      <td className="py-2 pr-3 text-right text-emerald-400">{e.debit > 0 ? fmt(e.debit) : ''}</td>
                      <td className="py-2 pr-3 text-right text-red-400">{e.credit > 0 ? fmt(e.credit) : ''}</td>
                      <td className={`py-2 text-right font-medium ${e.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{fmt(Math.abs(e.balance))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-zinc-700 font-bold">
                    <td colSpan={3} className="py-3 text-right text-zinc-400">TOTAL</td>
                    <td className="py-3 text-right text-emerald-400">{fmt(supplier.totalPaid)}</td>
                    <td className="py-3 text-right text-red-400">{fmt(supplier.totalOwed)}</td>
                    <td className={`py-3 text-right ${pending > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{fmt(Math.abs(pending))}</td>
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
