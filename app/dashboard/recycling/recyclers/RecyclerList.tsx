'use client';

import { useState, useMemo } from 'react';
import {
  Factory, CheckCircle2, MapPin, Shield, Mail, Phone, Globe,
  Battery, Recycle, Search, Filter, X, ChevronDown,
} from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const input = 'w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50';

const WASTE_BADGE: Record<string, { cls: string; label: string }> = {
  'e-waste':   { cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', label: 'E-Waste' },
  'battery':   { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Battery' },
  'both':      { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'E-Waste + Battery' },
  'hazardous': { cls: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Hazardous' },
};

type Recycler = Record<string, any>;

export default function RecyclerList({ recyclers }: { recyclers: Recycler[] }) {
  const [search, setSearch] = useState('');
  const [wasteFilter, setWasteFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [contactFilter, setContactFilter] = useState<string>('all');

  const states = useMemo(() => {
    const s = new Set(recyclers.map(r => r.state).filter(Boolean));
    return Array.from(s).sort();
  }, [recyclers]);

  const withEmail = recyclers.filter(r => r.email && !r.email.startsWith('cpcb.'));
  const battery = recyclers.filter(r => r.waste_type === 'battery' || r.waste_type === 'both');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return recyclers.filter(r => {
      // Search
      if (q) {
        const hay = [r.company_name, r.recycler_code, r.city, r.state, r.email, r.phone, r.contact_person, r.address]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      // Waste type
      if (wasteFilter !== 'all' && r.waste_type !== wasteFilter) return false;
      // State
      if (stateFilter !== 'all' && r.state !== stateFilter) return false;
      // Contact availability
      if (contactFilter === 'with-email' && (!r.email || r.email.startsWith('cpcb.'))) return false;
      if (contactFilter === 'with-phone' && !r.phone) return false;
      if (contactFilter === 'no-contact' && (r.email && !r.email.startsWith('cpcb.'))) return false;
      return true;
    });
  }, [recyclers, search, wasteFilter, stateFilter, contactFilter]);

  const hasFilters = wasteFilter !== 'all' || stateFilter !== 'all' || contactFilter !== 'all' || search !== '';

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total</p>
          <p className="text-2xl font-black text-white mt-1">{recyclers.length}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Showing</p>
          <p className="text-2xl font-black text-indigo-400 mt-1">{filtered.length}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">With Contacts</p>
          <p className="text-2xl font-black text-sky-400 mt-1">{withEmail.length}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1"><Battery className="h-3 w-3" /> Battery</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{battery.length}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">States</p>
          <p className="text-2xl font-black text-violet-400 mt-1">{states.length}</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className={`${glass} p-4 space-y-3`}>
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            className={`${input} pl-10`}
            placeholder="Search by name, code, city, state, email, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Filter className="h-3.5 w-3.5" /> Filters:
          </div>

          {/* Waste type filter */}
          <div className="relative">
            <select
              value={wasteFilter}
              onChange={e => setWasteFilter(e.target.value)}
              className="appearance-none rounded-lg bg-zinc-800 border border-zinc-700 pl-3 pr-7 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="e-waste">E-Waste</option>
              <option value="battery">Battery</option>
              <option value="both">E-Waste + Battery</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
          </div>

          {/* State filter */}
          <div className="relative">
            <select
              value={stateFilter}
              onChange={e => setStateFilter(e.target.value)}
              className="appearance-none rounded-lg bg-zinc-800 border border-zinc-700 pl-3 pr-7 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              <option value="all">All States</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
          </div>

          {/* Contact filter */}
          <div className="relative">
            <select
              value={contactFilter}
              onChange={e => setContactFilter(e.target.value)}
              className="appearance-none rounded-lg bg-zinc-800 border border-zinc-700 pl-3 pr-7 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              <option value="all">All Contacts</option>
              <option value="with-email">Has Email</option>
              <option value="with-phone">Has Phone</option>
              <option value="no-contact">Missing Email</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
          </div>

          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setWasteFilter('all'); setStateFilter('all'); setContactFilter('all'); }}
              className="flex items-center gap-1 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <X className="h-3 w-3" /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className={glass}>
        <div className="px-6 py-3 border-b border-zinc-800/60 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            {hasFilters ? `${filtered.length} of ${recyclers.length} recyclers` : `All ${recyclers.length} Recyclers`}
          </h2>
          <span className="text-xs text-zinc-500">Sorted by state, then company name</span>
        </div>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No recyclers match your search.</p>
            <button onClick={() => { setSearch(''); setWasteFilter('all'); setStateFilter('all'); setContactFilter('all'); }} className="text-xs text-indigo-400 hover:text-indigo-300 mt-2">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {filtered.map(r => {
              const wb = WASTE_BADGE[r.waste_type ?? 'e-waste'] ?? WASTE_BADGE['e-waste'];
              const hasRealEmail = r.email && !r.email.startsWith('cpcb.');
              return (
                <div key={r.id} className="px-6 py-4 hover:bg-zinc-800/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-amber-400 font-bold shrink-0">{r.recycler_code}</span>
                        <span className="text-sm font-medium text-white truncate">{r.company_name}</span>
                        {r.is_verified && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 shrink-0">
                            <CheckCircle2 className="h-3 w-3" /> Verified
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 text-[10px] border rounded-full px-2 py-0.5 shrink-0 ${wb.cls}`}>
                          {r.waste_type === 'battery' || r.waste_type === 'both' ? <Battery className="h-3 w-3" /> : <Recycle className="h-3 w-3" />}
                          {wb.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 flex-wrap">
                        {r.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.city}, {r.state}</span>}
                        {r.cpcb_registration && <span className="flex items-center gap-1"><Shield className="h-3 w-3" />{r.cpcb_registration}</span>}
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 text-xs flex-wrap">
                        {r.contact_person && r.contact_person !== 'Registered Facility' && (
                          <span className="text-zinc-300 font-medium">{r.contact_person}</span>
                        )}
                        {hasRealEmail ? (
                          <a href={`mailto:${r.email}`} className="flex items-center gap-1 text-sky-400 hover:text-sky-300">
                            <Mail className="h-3 w-3" />{r.email}
                          </a>
                        ) : (
                          <span className="text-zinc-600 flex items-center gap-1"><Mail className="h-3 w-3" />No email</span>
                        )}
                        {r.phone ? (
                          <a href={`tel:${r.phone}`} className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300">
                            <Phone className="h-3 w-3" />{r.phone}
                          </a>
                        ) : (
                          <span className="text-zinc-600 flex items-center gap-1"><Phone className="h-3 w-3" />No phone</span>
                        )}
                        {r.website && (
                          <a href={r.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-violet-400 hover:text-violet-300">
                            <Globe className="h-3 w-3" />Website
                          </a>
                        )}
                      </div>

                      {r.address && (
                        <p className="text-[11px] text-zinc-600 mt-1 truncate">{r.address}</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      {r.capacity_per_month && (
                        <>
                          <p className="text-sm font-bold text-white">{r.capacity_per_month}</p>
                          <p className="text-[10px] text-zinc-600">capacity</p>
                        </>
                      )}
                      {r.service_radius_km && <p className="text-[10px] text-zinc-600 mt-1">{r.service_radius_km} km radius</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
