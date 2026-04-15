import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { ClipboardCheck, Plus, CheckCircle2, Clock, AlertCircle, XCircle, PackageCheck } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_CONFIG: Record<string, { cls: string; icon: React.ElementType }> = {
  pending:   { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
  inspected: { cls: 'bg-sky-500/10 text-sky-400 border-sky-500/20',       icon: PackageCheck },
  accepted:  { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  rejected:  { cls: 'bg-red-500/10 text-red-400 border-red-500/20',       icon: XCircle },
  partial:   { cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: AlertCircle },
};

export default async function GRNListPage() {
  const { data: grns } = await supabaseAdmin
    .from('goods_receipt_notes')
    .select('*, suppliers(legal_name), purchase_orders(po_no)')
    .order('created_at', { ascending: false });

  const list = grns ?? [];
  const accepted = list.filter(g => g.status === 'accepted').length;
  const pending = list.filter(g => g.status === 'pending').length;

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-6 w-6 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Goods Receipt Notes</h1>
            <p className="mt-0.5 text-sm text-zinc-500">{list.length} GRNs &middot; {pending} pending inspection</p>
          </div>
        </div>
        <Link href="/d/grn/new" className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-500 transition-colors">
          <Plus className="h-4 w-4" /> New GRN
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total GRNs', value: list.length, color: 'text-white' },
          { label: 'Accepted', value: accepted, color: 'text-emerald-400' },
          { label: 'Pending', value: pending, color: 'text-amber-400' },
          { label: 'This Month', value: list.filter(g => new Date(g.receipt_date).getMonth() === new Date().getMonth()).length, color: 'text-sky-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`${glass} p-4`}>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className={glass}>
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardCheck className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No goods receipt notes yet.</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid grid-cols-[100px_100px_1fr_120px_100px_90px] gap-4 px-6 py-3 border-b border-zinc-800/60 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
              <span>GRN No</span><span>PO Ref</span><span>Supplier</span><span>Receipt Date</span><span>Status</span><span></span>
            </div>
            <div className="divide-y divide-zinc-800/60">
              {list.map(grn => {
                const cfg = STATUS_CONFIG[grn.status] ?? STATUS_CONFIG.pending;
                const Icon = cfg.icon;
                const supplier = grn.suppliers as { legal_name: string } | null;
                const po = grn.purchase_orders as { po_no: string } | null;
                return (
                  <Link key={grn.id} href={`/d/grn/${grn.id}`}
                    className="flex flex-col lg:grid lg:grid-cols-[100px_100px_1fr_120px_100px_90px] gap-2 lg:gap-4 px-6 py-4 hover:bg-zinc-800/20 transition-colors items-start lg:items-center">
                    <span className="text-sm font-mono font-semibold text-amber-400">{grn.grn_no}</span>
                    <span className="text-xs font-mono text-zinc-500">{po?.po_no ?? '-'}</span>
                    <span className="text-sm text-zinc-300">{supplier?.legal_name ?? '-'}</span>
                    <span className="text-xs text-zinc-400">{fmtDate(grn.receipt_date)}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
                      <Icon className="h-3 w-3" /> {grn.status}
                    </span>
                    <span className="text-xs text-zinc-600">View &rarr;</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
