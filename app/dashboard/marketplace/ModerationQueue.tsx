'use client';

import { useState } from 'react';
import { Check, X, Mail, Phone, MapPin, Package, Building2, Loader2 } from 'lucide-react';

type Listing = {
  id: string;
  listing_type: 'sell' | 'buy';
  item_category_id: string;
  company_name: string | null;
  title: string;
  description: string | null;
  quantity_value: number | null;
  quantity_unit: string | null;
  price_inr_per_unit: number | null;
  location_state: string | null;
  location_city: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  submitter_name: string | null;
  submitter_ip: string | null;
  valid_until: string | null;
  created_at: string;
  item_categories: { id: string; group_code: string; label: string } | { id: string; group_code: string; label: string }[] | null;
};

export default function ModerationQueue({ listings: initial }: { listings: Listing[] }) {
  const [listings, setListings] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: 'approve' | 'reject', notes?: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/listings/${id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: notes ?? null }),
      });
      if (res.ok) setListings(prev => prev.filter(l => l.id !== id));
      else alert(`Failed: ${(await res.json()).error ?? 'unknown'}`);
    } finally { setBusy(null); }
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
        <Check className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
        <p className="text-zinc-400 text-sm">Queue clear — no pending listings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map(l => {
        const cat = Array.isArray(l.item_categories) ? l.item_categories[0] : l.item_categories;
        const isSell = l.listing_type === 'sell';
        return (
          <div key={l.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isSell ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {isSell ? 'Sell' : 'Buy'}
                  </span>
                  {cat && <span className="text-[11px] text-zinc-500">{cat.label}</span>}
                  <span className="text-[10px] text-zinc-600 ml-auto">
                    {new Date(l.created_at).toLocaleString('en-IN')}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white">{l.title}</h3>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => act(l.id, 'approve')} disabled={busy === l.id}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white">
                  {busy === l.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Approve
                </button>
                <button onClick={() => {
                  const notes = prompt('Reason for rejection (optional):') ?? undefined;
                  act(l.id, 'reject', notes);
                }} disabled={busy === l.id}
                  className="flex items-center gap-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-red-400 border border-red-500/30">
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            </div>

            {l.description && (
              <p className="text-sm text-zinc-400 mb-3 whitespace-pre-line line-clamp-3">{l.description}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {l.quantity_value != null && (
                <Meta icon={Package} label="Qty" value={`${l.quantity_value} ${l.quantity_unit ?? ''}`} />
              )}
              {(l.location_city || l.location_state) && (
                <Meta icon={MapPin} label="Location" value={[l.location_city, l.location_state].filter(Boolean).join(', ')} />
              )}
              {l.company_name && (
                <Meta icon={Building2} label="Company" value={l.company_name} />
              )}
              {l.contact_email && (
                <Meta icon={Mail} label="Email" value={l.contact_email} />
              )}
              {l.contact_phone && (
                <Meta icon={Phone} label="Phone" value={l.contact_phone} />
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between text-[10px] text-zinc-600">
              <span>Submitted by {l.submitter_name ?? '—'}</span>
              <span>IP {l.submitter_ip ?? '—'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Meta({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-zinc-500 uppercase flex items-center gap-1 mb-0.5">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="text-zinc-300 truncate">{value}</p>
    </div>
  );
}
