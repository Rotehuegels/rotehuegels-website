import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { Factory, Plus, CheckCircle2, Clock, MapPin, Shield } from 'lucide-react';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

export default async function RecyclersPage() {
  const { data: recyclers } = await supabaseAdmin
    .from('ewaste_recyclers')
    .select('*')
    .order('company_name');

  const list = recyclers ?? [];
  const verified = list.filter(r => r.is_verified);
  const active = list.filter(r => r.is_active);

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Factory className="h-6 w-6 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Registered Recyclers</h1>
            <p className="mt-0.5 text-sm text-zinc-500">{verified.length} verified &middot; {active.length} active</p>
          </div>
        </div>
        <Link href="/d/ewaste" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
          &larr; Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total</p>
          <p className="text-2xl font-black text-white mt-1">{list.length}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Verified</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{verified.length}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Active</p>
          <p className="text-2xl font-black text-sky-400 mt-1">{active.length}</p>
        </div>
        <div className={`${glass} p-4`}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Collections</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{list.reduce((s, r) => s + (r.total_collections ?? 0), 0)}</p>
        </div>
      </div>

      <div className={glass}>
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <Factory className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No recyclers registered yet.</p>
            <p className="text-xs text-zinc-600 mt-1">Add recyclers via the API.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {list.map(r => (
              <div key={r.id} className="px-6 py-4 hover:bg-zinc-800/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-amber-400 font-bold">{r.recycler_code}</span>
                      <span className="text-sm font-medium text-white">{r.company_name}</span>
                      {r.is_verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      {r.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.city}, {r.state}</span>}
                      {r.cpcb_registration && <span className="flex items-center gap-1"><Shield className="h-3 w-3" />CPCB: {r.cpcb_registration}</span>}
                      <span>{r.contact_person}</span>
                    </div>
                    {r.capabilities && r.capabilities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {r.capabilities.map((cap: string) => (
                          <span key={cap} className="text-[10px] bg-zinc-800 text-zinc-400 rounded-full px-2 py-0.5">{cap}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{r.total_collections ?? 0}</p>
                    <p className="text-[10px] text-zinc-600">collections</p>
                    {r.service_radius_km && <p className="text-[10px] text-zinc-600">{r.service_radius_km} km radius</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
