'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { MapPin, Clock, X, Package } from 'lucide-react';

type Cat = { id: string; parent_id: string | null; group_code: string; label: string; typical_unit: string | null; sort_order: number };
type Listing = {
  id: string;
  listing_type: 'sell' | 'buy';
  item_category_id: string;
  company_name: string | null;
  title: string;
  quantity_value: number | null;
  quantity_unit: string | null;
  price_inr_per_unit: number | null;
  location_state: string | null;
  location_city: string | null;
  valid_until: string | null;
  created_at: string;
  item_categories: { id: string; group_code: string; label: string } | { id: string; group_code: string; label: string }[] | null;
};

const GROUP_LABELS: Record<string, string> = {
  virgin_supply: 'Virgin metals & minerals',
  secondary_supply: 'Secondary (recycled) metals',
  intermediate_battery: 'Battery chain intermediates',
  eol_feedstock: 'End-of-life feedstock',
  byproduct: 'Byproducts & intermediates',
  plastics_paper_tyres: 'Plastics / paper / tyres',
  consumable: 'Consumables & reagents',
};

export default function MarketplaceBrowser({
  initialListings, categories, states,
}: {
  initialListings: Listing[];
  categories: Cat[];
  states: string[];
}) {
  const [mode, setMode] = useState<'all' | 'sell' | 'buy'>('all');
  const [group, setGroup] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [state, setState] = useState<string>('');

  const groupCategories = useMemo(
    () => categories.filter(c => !c.id.startsWith('_group_') && (!group || c.group_code === group)),
    [categories, group],
  );

  const filtered = useMemo(() => initialListings.filter(l => {
    if (mode !== 'all' && l.listing_type !== mode) return false;
    if (categoryId && l.item_category_id !== categoryId) return false;
    const cat = Array.isArray(l.item_categories) ? l.item_categories[0] : l.item_categories;
    if (group && cat && cat.group_code !== group) return false;
    if (state && l.location_state !== state) return false;
    return true;
  }), [initialListings, mode, group, categoryId, state]);

  const clear = () => { setMode('all'); setGroup(''); setCategoryId(''); setState(''); };
  const hasFilters = mode !== 'all' || !!group || !!categoryId || !!state;

  return (
    <div>
      {/* Filter bar */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode */}
          <div className="inline-flex rounded-lg bg-zinc-800 p-1">
            {(['all', 'sell', 'buy'] as const).map(m => (
              <button key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  mode === m ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}>
                {m === 'all' ? 'All' : m === 'sell' ? 'Sell posts' : 'Buy posts'}
              </button>
            ))}
          </div>

          <select value={group} onChange={e => { setGroup(e.target.value); setCategoryId(''); }}
            className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200">
            <option value="">All tiers</option>
            {Object.entries(GROUP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
            className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 max-w-xs">
            <option value="">All categories</option>
            {groupCategories.map(c => (<option key={c.id} value={c.id}>{c.label}</option>))}
          </select>

          <select value={state} onChange={e => setState(e.target.value)}
            className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200">
            <option value="">All states</option>
            {states.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>

          {hasFilters && (
            <button onClick={clear} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}

          <span className="text-xs text-zinc-500 ml-auto">
            Showing <strong className="text-emerald-400">{filtered.length}</strong> of {initialListings.length}
          </span>
        </div>
      </div>

      {/* Listings grid */}
      {filtered.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const cat = Array.isArray(listing.item_categories) ? listing.item_categories[0] : listing.item_categories;
  const isSell = listing.listing_type === 'sell';
  return (
    <Link href={`/marketplace/${listing.id}`}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-zinc-600 hover:bg-zinc-900/60 transition-colors block">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
          isSell ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'
        }`}>
          {isSell ? 'Selling' : 'Wanting'}
        </span>
        {cat && (
          <span className="text-[10px] text-zinc-500 text-right truncate max-w-[60%]">{cat.label}</span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">{listing.title}</h3>
      <div className="text-xs text-zinc-400 space-y-1">
        {listing.quantity_value != null && (
          <div className="flex items-center gap-1.5">
            <Package className="h-3 w-3 text-zinc-500 shrink-0" />
            <span>{listing.quantity_value} {listing.quantity_unit ?? 'MT'}</span>
          </div>
        )}
        {(listing.location_city || listing.location_state) && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-zinc-500 shrink-0" />
            <span>{[listing.location_city, listing.location_state].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {listing.valid_until && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-zinc-500 shrink-0" />
            <span>Valid until {new Date(listing.valid_until).toLocaleDateString('en-IN')}</span>
          </div>
        )}
      </div>
      {listing.company_name && (
        <div className="mt-3 pt-3 border-t border-zinc-800 text-[11px] text-zinc-500">
          {listing.company_name}
        </div>
      )}
    </Link>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
      <Package className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
      <p className="text-zinc-400 text-sm font-medium">
        {hasFilters ? 'No listings match these filters.' : 'No active listings yet.'}
      </p>
      <p className="text-zinc-600 text-xs mt-1">
        {hasFilters ? 'Try clearing filters or broadening your search.' : 'Be the first to post — submissions go live within 24 hours.'}
      </p>
      <Link href="/marketplace/new"
        className="inline-flex items-center gap-2 mt-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition-colors">
        Post a Listing
      </Link>
    </div>
  );
}
