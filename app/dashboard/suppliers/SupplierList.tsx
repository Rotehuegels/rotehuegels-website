'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Building2, MapPin, Hash, BadgeCheck, BadgeX, Search, X } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

interface Supplier {
  id: string;
  legal_name: string;
  trade_name: string | null;
  gstin: string | null;
  gst_status: string | null;
  entity_type: string | null;
  address: string | null;
  state: string | null;
  pincode: string | null;
}

function isProprietorship(entity_type: string | null) {
  if (!entity_type) return false;
  return /proprietor/i.test(entity_type);
}

function displayName(s: Supplier) {
  // For proprietorships, trade name is the working name — show it first
  if (isProprietorship(s.entity_type) && s.trade_name && s.trade_name !== s.legal_name) {
    return { primary: s.trade_name, secondary: s.legal_name };
  }
  return {
    primary: s.legal_name,
    secondary: s.trade_name && s.trade_name !== s.legal_name ? s.trade_name : null,
  };
}

export default function SupplierList({ suppliers }: { suppliers: Supplier[] }) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? suppliers.filter(s => {
        const q = query.toLowerCase();
        return (
          s.legal_name.toLowerCase().includes(q) ||
          s.trade_name?.toLowerCase().includes(q) ||
          s.gstin?.toLowerCase().includes(q)
        );
      })
    : suppliers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Suppliers</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {suppliers.length} registered supplier{suppliers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/suppliers/registrations"
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-500 transition-colors">
            Registrations
          </Link>
          <Link href="/dashboard/suppliers/new"
            className="flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors">
            <Plus className="h-4 w-4" /> Add Supplier
          </Link>
        </div>
      </div>

      {/* Search */}
      {suppliers.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search suppliers…"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none transition-colors"
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* List */}
      {!suppliers.length ? (
        <div className={`${glass} p-12 text-center`}>
          <Building2 className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm font-medium">No suppliers registered yet.</p>
          <p className="text-zinc-600 text-xs mt-1">Enter a GSTIN to auto-fetch company details from the GST portal.</p>
          <Link href="/dashboard/suppliers/new"
            className="inline-flex items-center gap-2 mt-5 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors">
            <Plus className="h-4 w-4" /> Add First Supplier
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">No suppliers match &quot;{query}&quot;.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(s => {
            const { primary, secondary } = displayName(s);
            return (
              <Link key={s.id} href={`/dashboard/suppliers/${s.id}`}
                className={`${glass} p-5 hover:border-zinc-700 transition-colors block`}>

                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white leading-snug truncate">{primary}</p>
                    {secondary && (
                      <p className="text-xs text-zinc-500 truncate mt-0.5">{secondary}</p>
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
                        : <BadgeX className="h-3 w-3" />}
                      {s.gst_status}
                    </span>
                  )}
                </div>

                {s.gstin && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Hash className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                    <span className="text-xs font-mono text-amber-400">{s.gstin}</span>
                  </div>
                )}

                {(s.address || s.state) && (
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-zinc-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-zinc-500 line-clamp-2">
                      {[s.address, s.state, s.pincode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                {s.entity_type && (
                  <p className="text-[10px] text-zinc-600 mt-2">{s.entity_type}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
