import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { Factory, MapIcon, Building2, Network } from 'lucide-react';
import IndiaMap from '@/components/IndiaMap';
import RecyclerList from './RecyclerList';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type R = Record<string, unknown> & {
  id: string;
  recycler_code: string | null;
  company_name: string | null;
  state: string | null;
  city: string | null;
  waste_type: string | null;
  capacity_per_month: string | null;
  black_mass_mta: number | string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  company_id: string | null;
};

function parseCap(s: string | null | undefined): number {
  if (!s) return 0;
  const m = String(s).match(/([\d,]+(?:\.\d+)?)/);
  if (!m) return 0;
  const num = parseFloat(m[1].replace(/,/g, ''));
  return (!isNaN(num) && num < 500000) ? num : 0;
}

export default async function RecyclersPage({ searchParams }: { searchParams?: Promise<{ group?: string }> }) {
  const sp = (await searchParams) ?? {};
  const groupFilter = sp.group ?? null;

  // Fetch all active recyclers
  const allRecyclers: R[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await supabaseAdmin.from('recyclers')
      .select('*').eq('is_active', true).order('state, company_name').range(from, from + 999);
    if (!data || !data.length) break;
    allRecyclers.push(...(data as R[]));
    if (data.length < 1000) break;
  }

  // Fetch companies + derive groups (parent holding → subsidiaries → facilities)
  const { data: companiesData } = await supabaseAdmin.from('companies')
    .select('id, slug, legal_name, trade_name, parent_company_id, is_group_holding, website, registered_state');
  const companies = companiesData ?? [];
  const companyById = new Map(companies.map(c => [c.id, c]));

  // For every company, find its ultimate ancestor (root)
  function ancestorOf(id: string): string {
    let cur = companyById.get(id); let rootId = id;
    while (cur?.parent_company_id && companyById.has(cur.parent_company_id)) {
      rootId = cur.parent_company_id; cur = companyById.get(cur.parent_company_id);
    }
    return rootId;
  }

  // Build a map: ancestor company → { facilities, states, subsidiaryCount }
  const groupMap = new Map<string, { root: typeof companies[0]; facilities: R[]; states: Set<string>; subs: Set<string> }>();
  for (const r of allRecyclers) {
    if (!r.company_id) continue;
    const rootId = ancestorOf(r.company_id);
    const root = companyById.get(rootId);
    if (!root) continue;
    if (!groupMap.has(rootId)) groupMap.set(rootId, { root, facilities: [], states: new Set(), subs: new Set() });
    const g = groupMap.get(rootId)!;
    g.facilities.push(r);
    if (r.state) g.states.add(r.state);
    g.subs.add(r.company_id);
  }
  const groups = [...groupMap.values()]
    .filter(g => g.facilities.length >= 2)
    .sort((a, b) => b.facilities.length - a.facilities.length);

  // Apply groupFilter — show only facilities that belong to rows under that ancestor
  let listedRecyclers = allRecyclers;
  let activeGroupName: string | null = null;
  if (groupFilter) {
    const root = companies.find(c => c.slug === groupFilter);
    if (root) {
      const descendants = new Set<string>([root.id]);
      let added = true;
      while (added) {
        added = false;
        for (const c of companies) {
          if (c.parent_company_id && descendants.has(c.parent_company_id) && !descendants.has(c.id)) {
            descendants.add(c.id); added = true;
          }
        }
      }
      listedRecyclers = allRecyclers.filter(r => r.company_id && descendants.has(r.company_id));
      activeGroupName = root.legal_name;
    }
  }

  // State aggregates for the choropleth (based on the currently-filtered set)
  const stateMap = new Map<string, { recyclers: number; capacity: number }>();
  for (const r of listedRecyclers) {
    if (!r.state) continue;
    const e = stateMap.get(r.state) ?? { recyclers: 0, capacity: 0 };
    e.recyclers += 1;
    e.capacity += parseCap(r.capacity_per_month);
    stateMap.set(r.state, e);
  }
  const stateData = Object.fromEntries(stateMap);
  const pins = listedRecyclers
    .filter(r => r.latitude != null && r.longitude != null)
    .map(r => ({
      id: r.id,
      code: r.recycler_code ?? undefined,
      lat: Number(r.latitude), lng: Number(r.longitude),
      label: r.company_name ?? 'Facility',
      sub: [r.city, r.state].filter(Boolean).join(', '),
      waste_type: r.waste_type ?? undefined,
      state: r.state ?? undefined,
    }));
  const statesCount = stateMap.size;
  const totalCapacity = Array.from(stateMap.values()).reduce((s, x) => s + x.capacity, 0);

  return (
    <div className="p-5 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Factory className="h-6 w-6 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Recycler Overview</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              {listedRecyclers.length} facilities · {statesCount} states · {new Intl.NumberFormat('en-IN').format(Math.round(totalCapacity))} MTA capacity
              {activeGroupName && <> · filtered to <span className="text-emerald-400">{activeGroupName}</span></>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeGroupName && (
            <Link href="/d/ecosystem" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300 hover:bg-amber-500/20 transition-colors">
              Clear filter
            </Link>
          )}
          <Link href="/d/recycling" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
            &larr; Dashboard
          </Link>
        </div>
      </div>

      {/* Group-level summary cards — click to filter the list */}
      {groups.length > 0 && !groupFilter && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between mb-3 px-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <Network className="h-4 w-4 text-indigo-400" /> Groups — {groups.length} multi-facility companies
            </h2>
            <span className="text-[10px] text-zinc-500">click a group to drill in</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {groups.slice(0, 24).map(g => {
              const capSum = g.facilities.reduce((s, r) => s + parseCap(r.capacity_per_month), 0);
              return (
                <Link
                  key={g.root.id}
                  href={`/d/ecosystem?group=${encodeURIComponent(g.root.slug)}`}
                  className="flex items-start gap-3 rounded-xl border border-zinc-700/60 bg-zinc-800/30 p-3 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-colors"
                >
                  <Building2 className={`h-4 w-4 shrink-0 mt-0.5 ${g.root.is_group_holding ? 'text-indigo-400' : 'text-zinc-400'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white truncate">{g.root.legal_name}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {g.facilities.length} facilit{g.facilities.length === 1 ? 'y' : 'ies'}
                      {g.subs.size > 1 && <> · {g.subs.size} entities</>}
                      {g.states.size > 0 && <> · {g.states.size} state{g.states.size > 1 ? 's' : ''}</>}
                    </div>
                    {capSum > 0 && (
                      <div className="text-[10px] text-emerald-400/80 font-mono mt-0.5">
                        {new Intl.NumberFormat('en-IN').format(Math.round(capSum))} MTA
                      </div>
                    )}
                    {g.root.is_group_holding && (
                      <div className="text-[9px] uppercase tracking-wider text-indigo-400/70 mt-1">Group Holding</div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          {groups.length > 24 && (
            <div className="text-[11px] text-zinc-500 text-center mt-3">+{groups.length - 24} more groups</div>
          )}
        </div>
      )}

      {/* India map */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex items-center justify-between mb-3 px-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <MapIcon className="h-4 w-4 text-indigo-400" /> India Map — click any pin to open the facility profile
          </h2>
          <span className="text-[10px] text-zinc-500">{pins.length} GPS pins · internal</span>
        </div>
        <div className="max-w-3xl mx-auto">
          <IndiaMap
            stateData={stateData}
            pins={pins}
            showPins
            pinHrefBase="/d/ecosystem"
          />
        </div>
      </div>

      <RecyclerList recyclers={listedRecyclers} />
    </div>
  );
}
