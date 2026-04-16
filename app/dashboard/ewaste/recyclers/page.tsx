import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { Factory, CheckCircle2, MapPin, Shield, Mail, Phone, Globe, Battery, Recycle, Search } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const WASTE_BADGE: Record<string, { cls: string; label: string }> = {
  'e-waste':   { cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', label: 'E-Waste' },
  'battery':   { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Battery' },
  'both':      { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'E-Waste + Battery' },
  'hazardous': { cls: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Hazardous' },
};

export default async function RecyclersPage() {
  const { data: recyclers } = await supabaseAdmin
    .from('ewaste_recyclers')
    .select('*')
    .order('state, company_name');

  const list = recyclers ?? [];
  const verified = list.filter(r => r.is_verified);
  const active = list.filter(r => r.is_active);
  const withEmail = list.filter(r => r.email && !r.email.startsWith('cpcb.'));
  const battery = list.filter(r => r.waste_type === 'battery' || r.waste_type === 'both');

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Factory className="h-6 w-6 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Registered Recyclers</h1>
            <p className="mt-0.5 text-sm text-zinc-500">{list.length} total &middot; {withEmail.length} with contacts &middot; {battery.length} battery</p>
          </div>
        </div>
        <Link href="/d/ewaste" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
          &larr; Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total</p>
          <p className="text-2xl font-black text-white mt-1">{list.length}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Verified</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{verified.length}</p>
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
          <p className="text-2xl font-black text-violet-400 mt-1">{new Set(list.map(r => r.state)).size}</p>
        </div>
      </div>

      <div className={glass}>
        <div className="px-6 py-3 border-b border-zinc-800/60 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">All Recyclers</h2>
          <span className="text-xs text-zinc-500">Sorted by state, then company name</span>
        </div>
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <Factory className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No recyclers registered yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {list.map(r => {
              const wb = WASTE_BADGE[r.waste_type ?? 'e-waste'] ?? WASTE_BADGE['e-waste'];
              const hasRealEmail = r.email && !r.email.startsWith('cpcb.');
              return (
                <div key={r.id} className="px-6 py-4 hover:bg-zinc-800/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Row 1: Code + Name + Badges */}
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

                      {/* Row 2: Location + Registration */}
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 flex-wrap">
                        {r.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.city}, {r.state}</span>}
                        {r.cpcb_registration && <span className="flex items-center gap-1"><Shield className="h-3 w-3" />{r.cpcb_registration}</span>}
                      </div>

                      {/* Row 3: Contact details */}
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

                      {/* Row 4: Address */}
                      {r.address && (
                        <p className="text-[11px] text-zinc-600 mt-1 truncate">{r.address}</p>
                      )}
                    </div>

                    {/* Right side: Capacity */}
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
    </div>
  );
}
