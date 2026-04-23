import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { Plus, Building2, MapPin, Hash, BadgeCheck, BadgeX, Download } from 'lucide-react';
import { Suspense } from 'react';
import SuppliersFilterBar from './SuppliersFilterBar';
import IfCan from '@/components/IfCan';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  const statusFilter = typeof sp.status === 'string' ? sp.status : 'all';

  let query = supabaseAdmin
    .from('suppliers')
    .select('*')
    .order('legal_name');

  if (statusFilter !== 'all') {
    query = query.eq('gst_status', statusFilter);
  }

  if (q) {
    query = query.or(`legal_name.ilike.%${q}%,trade_name.ilike.%${q}%,gstin.ilike.%${q}%,vendor_code.ilike.%${q}%`);
  }

  const { data: suppliers } = await query;
  const list = suppliers ?? [];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Suppliers</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {list.length} registered supplier{list.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/accounts/suppliers/export"
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors"
          >
            <Download className="h-4 w-4" /> Export CSV
          </a>
          <IfCan permission="procurement.create">
            <Link href="/d/suppliers/new"
              className="flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors">
              <Plus className="h-4 w-4" /> Add Supplier
            </Link>
          </IfCan>
        </div>
      </div>

      {/* Filter bar */}
      <Suspense fallback={null}>
        <SuppliersFilterBar />
      </Suspense>

      {/* List */}
      {!list.length ? (
        <div className={`${glass} p-12 text-center`}>
          <Building2 className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No suppliers found.</p>
          <p className="text-zinc-600 text-xs mt-1">Add a supplier with their GSTIN to auto-fetch their details.</p>
          <Link href="/d/suppliers/new"
            className="inline-flex items-center gap-2 mt-5 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors">
            <Plus className="h-4 w-4" /> Add First Supplier
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map(s => (
            <Link key={s.id} href={`/d/suppliers/${s.id}`}
              className={`${glass} p-5 hover:border-zinc-700 transition-colors block`}>

              {/* Name + status */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  {s.vendor_code && (
                    <p className="text-[10px] font-mono text-zinc-500 mb-0.5">{s.vendor_code}</p>
                  )}
                  <p className="text-sm font-bold text-white leading-snug truncate">{s.legal_name}</p>
                  {s.trade_name && s.trade_name !== s.legal_name && (
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{s.trade_name}</p>
                  )}
                </div>
                {s.gst_status && (
                  <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                    s.gst_status === 'Active'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {s.gst_status === 'Active'
                      ? <BadgeCheck className="h-3 w-3" />
                      : <BadgeX className="h-3 w-3" />
                    }
                    {s.gst_status}
                  </span>
                )}
              </div>

              {/* GSTIN */}
              {s.gstin && (
                <div className="flex items-center gap-1.5 mb-2">
                  <Hash className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                  <span className="text-xs font-mono text-amber-400">{s.gstin}</span>
                </div>
              )}

              {/* Address */}
              {(s.address || s.state) && (
                <div className="flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-zinc-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-500 line-clamp-2">
                    {[s.address, s.state, s.pincode].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {/* Entity type */}
              {s.entity_type && (
                <p className="text-[10px] text-zinc-600 mt-2">{s.entity_type}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
