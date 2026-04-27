import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { Building, Plus, Wrench, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const STATUS_CONFIG: Record<string, { cls: string; icon: React.ElementType }> = {
  active:       { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  disposed:     { cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',          icon: XCircle },
  under_repair: { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',      icon: Wrench },
  written_off:  { cls: 'bg-red-500/10 text-red-400 border-red-500/20',            icon: AlertTriangle },
};

const CATEGORY_LABELS: Record<string, string> = {
  furniture: 'Furniture', equipment: 'Equipment', vehicle: 'Vehicle',
  computer: 'Computer/IT', building: 'Building', land: 'Land', other: 'Other',
};

export default async function FixedAssetsPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/accounts/fixed-assets`, { cache: 'no-store' });
  const { data: assets } = await res.json().catch(() => ({ data: [] }));
  const list = assets ?? [];

  const active = list.filter((a: any) => a.status === 'active');
  const totalPurchaseValue = active.reduce((s: number, a: any) => s + (a.purchase_value ?? 0), 0);
  const totalBookValue = active.reduce((s: number, a: any) => s + (a.current_book_value ?? 0), 0);
  const totalDepreciation = active.reduce((s: number, a: any) => s + (a.accumulated_depreciation ?? 0), 0);
  const expiringWarranty = active.filter((a: any) => {
    if (!a.warranty_expiry) return false;
    const diff = (new Date(a.warranty_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 90;
  });

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building className="h-6 w-6 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Fixed Assets Register</h1>
            <p className="mt-0.5 text-sm text-zinc-500">{active.length} active assets &middot; Depreciation tracking</p>
          </div>
        </div>
        <Link href="/d/fixed-assets/new" className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-500 transition-colors">
          <Plus className="h-4 w-4" /> Add Asset
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Purchase Value</p>
          <p className="text-xl font-black text-white mt-1">{fmt(totalPurchaseValue)}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Book Value</p>
          <p className="text-xl font-black text-emerald-400 mt-1">{fmt(totalBookValue)}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Depreciation</p>
          <p className="text-xl font-black text-amber-400 mt-1">{fmt(totalDepreciation)}</p>
        </div>
        <div className={`${glass} p-4`}>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Warranty Expiring</p>
          </div>
          <p className={`text-xl font-black mt-1 ${expiringWarranty.length > 0 ? 'text-amber-400' : 'text-zinc-600'}`}>{expiringWarranty.length}</p>
          <p className="text-[10px] text-zinc-600">within 90 days</p>
        </div>
      </div>

      {/* Warranty alert */}
      {expiringWarranty.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-400">
            {expiringWarranty.length} asset{expiringWarranty.length > 1 ? 's' : ''} with warranty expiring soon: {expiringWarranty.map((a: any) => `${a.name} (${fmtDate(a.warranty_expiry)})`).join(', ')}
          </div>
        </div>
      )}

      {/* Asset table */}
      <div className={glass}>
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <Building className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No fixed assets registered.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Asset Code</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-right">Purchase Value</th>
                  <th className="px-4 py-3 text-right">Depreciation</th>
                  <th className="px-4 py-3 text-right">Book Value</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {list.map((a: any) => {
                  const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.active;
                  const Icon = cfg.icon;
                  return (
                    <tr key={a.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-5 py-3">
                        <Link href={`/d/fixed-assets/${a.id}`} className="font-mono text-xs text-amber-400 font-bold hover:text-amber-300">
                          {a.asset_code}
                        </Link>
                        <p className="text-[10px] text-zinc-600">{fmtDate(a.purchase_date)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{a.name}</p>
                        {a.location && <p className="text-xs text-zinc-500">{a.location}</p>}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{CATEGORY_LABELS[a.category] ?? a.category}</td>
                      <td className="px-4 py-3 text-right text-zinc-300 font-mono">{fmt(a.purchase_value)}</td>
                      <td className="px-4 py-3 text-right text-amber-400 font-mono">{fmt(a.accumulated_depreciation)}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-mono font-semibold">{fmt(a.current_book_value)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
                          <Icon className="h-3 w-3" /> {a.status.replace('_', ' ')}
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
