import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { FileCheck, Plus, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
  draft:     { icon: Clock,        color: 'bg-yellow-500/20 text-yellow-400' },
  generated: { icon: CheckCircle2, color: 'bg-emerald-500/20 text-emerald-400' },
  cancelled: { icon: XCircle,      color: 'bg-red-500/20 text-red-400' },
  expired:   { icon: AlertCircle,  color: 'bg-zinc-500/20 text-zinc-400' },
};

export default async function EwayBillsPage() {
  const { data: bills } = await supabaseAdmin
    .from('eway_bills')
    .select('*, orders(order_no, client_name), shipments(tracking_no, carrier)')
    .order('created_at', { ascending: false });

  const allBills = bills ?? [];
  const active = allBills.filter(b => b.status === 'generated');
  const drafts = allBills.filter(b => b.status === 'draft');

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCheck className="h-7 w-7 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">E-Way Bills</h1>
            <p className="text-sm text-zinc-500">Mandatory for goods movement exceeding ₹50,000</p>
          </div>
        </div>
        <Link href="/d/eway-bills/new" className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-500 transition-colors">
          <Plus className="h-4 w-4" /> New E-Way Bill
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${glass} p-5`}>
          <p className="text-xs text-zinc-500 uppercase mb-1">Total</p>
          <p className="text-2xl font-bold text-white">{allBills.length}</p>
        </div>
        <div className={`${glass} p-5`}>
          <p className="text-xs text-zinc-500 uppercase mb-1">Active</p>
          <p className="text-2xl font-bold text-emerald-400">{active.length}</p>
        </div>
        <div className={`${glass} p-5`}>
          <p className="text-xs text-zinc-500 uppercase mb-1">Drafts</p>
          <p className="text-2xl font-bold text-yellow-400">{drafts.length}</p>
        </div>
        <div className={`${glass} p-5`}>
          <p className="text-xs text-zinc-500 uppercase mb-1">Total Value</p>
          <p className="text-2xl font-bold text-sky-400">{fmt(allBills.reduce((s, b) => s + (b.total_value ?? 0), 0))}</p>
        </div>
      </div>

      {/* Table */}
      <div className={`${glass} p-6`}>
        {allBills.length === 0 ? (
          <div className="text-center py-12">
            <FileCheck className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">No e-way bills yet.</p>
            <p className="text-xs text-zinc-600 mt-1">Create one for any goods shipment exceeding ₹50,000.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                  <th className="pb-2 pr-3">E-Way Bill</th>
                  <th className="pb-2 pr-3">Invoice</th>
                  <th className="pb-2 pr-3">From → To</th>
                  <th className="pb-2 pr-3">HSN</th>
                  <th className="pb-2 pr-3 text-right">Value</th>
                  <th className="pb-2 pr-3">Transport</th>
                  <th className="pb-2 pr-3">Valid Upto</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {allBills.map(b => {
                  const cfg = statusConfig[b.status] ?? statusConfig.draft;
                  const Icon = cfg.icon;
                  const order = b.orders as { order_no: string; client_name: string } | null;
                  const isExpired = b.valid_upto && new Date(b.valid_upto) < new Date() && b.status === 'generated';
                  return (
                    <tr key={b.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-2.5 pr-3">
                        <span className="font-mono text-xs text-rose-400 font-bold">{b.eway_bill_no ?? 'DRAFT'}</span>
                        <p className="text-xs text-zinc-600">{fmtDate(b.doc_date)}</p>
                      </td>
                      <td className="py-2.5 pr-3">
                        {order ? (
                          <Link href={`/d/orders/${b.order_id}`} className="text-zinc-200 hover:text-rose-400 text-xs font-mono">{b.doc_no}</Link>
                        ) : (
                          <span className="text-zinc-400 text-xs font-mono">{b.doc_no}</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-xs">
                        <span className="text-zinc-400">{b.from_place}</span>
                        <span className="text-zinc-600"> → </span>
                        <span className="text-zinc-200">{b.to_place}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-xs font-mono text-zinc-400">{b.hsn_code}</td>
                      <td className="py-2.5 pr-3 text-right text-zinc-200">{fmt(b.total_value)}</td>
                      <td className="py-2.5 pr-3 text-xs text-zinc-400">
                        {b.vehicle_no ?? b.transporter_name ?? b.transport_mode ?? '—'}
                      </td>
                      <td className="py-2.5 pr-3 text-xs">
                        {b.valid_upto ? (
                          <span className={isExpired ? 'text-red-400' : 'text-zinc-400'}>
                            {fmtDate(b.valid_upto)} {isExpired ? '(EXPIRED)' : ''}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-2.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
                          <Icon className="h-3 w-3" /> {b.status}
                        </span>
                      </td>
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
