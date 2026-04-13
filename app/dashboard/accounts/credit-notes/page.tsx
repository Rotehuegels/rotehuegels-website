import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { FileText, Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default async function CreditNotesPage() {
  const { data: notes } = await supabaseAdmin
    .from('credit_debit_notes')
    .select('*, orders(order_no, client_name)')
    .order('created_at', { ascending: false });

  const all = notes ?? [];
  const creditNotes = all.filter(n => n.note_type === 'credit');
  const debitNotes = all.filter(n => n.note_type === 'debit');

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-violet-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Credit & Debit Notes</h1>
            <p className="text-sm text-zinc-500">Invoice adjustments — returns, rate differences, discounts</p>
          </div>
        </div>
        <Link href="/d/credit-notes/new" className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-500">
          <Plus className="h-4 w-4" /> New Note
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2"><ArrowDownLeft className="h-4 w-4 text-emerald-400" /><span className="text-xs text-zinc-500 uppercase">Credit Notes</span></div>
          <p className="text-2xl font-bold text-emerald-400">{creditNotes.length}</p>
          <p className="text-xs text-zinc-500 mt-1">{fmt(creditNotes.reduce((s, n) => s + (n.total_value ?? 0), 0))}</p>
        </div>
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2"><ArrowUpRight className="h-4 w-4 text-amber-400" /><span className="text-xs text-zinc-500 uppercase">Debit Notes</span></div>
          <p className="text-2xl font-bold text-amber-400">{debitNotes.length}</p>
          <p className="text-xs text-zinc-500 mt-1">{fmt(debitNotes.reduce((s, n) => s + (n.total_value ?? 0), 0))}</p>
        </div>
        <div className={`${glass} p-5`}>
          <div className="flex items-center gap-2 mb-2"><FileText className="h-4 w-4 text-zinc-400" /><span className="text-xs text-zinc-500 uppercase">Total</span></div>
          <p className="text-2xl font-bold text-white">{all.length}</p>
        </div>
      </div>

      <div className={`${glass} p-6`}>
        {all.length === 0 ? (
          <p className="text-sm text-zinc-500 py-8 text-center">No credit or debit notes issued yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                  <th className="pb-2 pr-3">Note No</th>
                  <th className="pb-2 pr-3">Type</th>
                  <th className="pb-2 pr-3">Date</th>
                  <th className="pb-2 pr-3">Party</th>
                  <th className="pb-2 pr-3">Reason</th>
                  <th className="pb-2 pr-3">Original Invoice</th>
                  <th className="pb-2 pr-3 text-right">Taxable</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {all.map(n => (
                  <tr key={n.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-2.5 pr-3 font-mono text-xs text-rose-400 font-bold">{n.note_no}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        n.note_type === 'credit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {n.note_type === 'credit' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                        {n.note_type}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-zinc-400 text-xs">{fmtDate(n.note_date)}</td>
                    <td className="py-2.5 pr-3 text-zinc-200">{n.party_name}</td>
                    <td className="py-2.5 pr-3 text-zinc-400">{n.reason}</td>
                    <td className="py-2.5 pr-3 text-zinc-400 font-mono text-xs">{n.original_invoice ?? '—'}</td>
                    <td className="py-2.5 pr-3 text-right text-zinc-300">{fmt(n.taxable_value)}</td>
                    <td className="py-2.5 text-right text-white font-medium">{fmt(n.total_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
