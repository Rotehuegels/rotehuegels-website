import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { Factory, MapIcon } from 'lucide-react';
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
};

function parseCap(s: string | null | undefined): number {
  if (!s) return 0;
  const m = String(s).match(/([\d,]+(?:\.\d+)?)/);
  if (!m) return 0;
  const num = parseFloat(m[1].replace(/,/g, ''));
  return (!isNaN(num) && num < 500000) ? num : 0;
}

export default async function RecyclersPage() {
  // Fetch all rows (paginate past Supabase 1000 row default limit)
  const allRecyclers: R[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data } = await supabaseAdmin
      .from('recyclers')
      .select('*')
      .eq('is_active', true)
      .order('state, company_name')
      .range(from, from + pageSize - 1);
    if (!data || data.length === 0) break;
    allRecyclers.push(...(data as R[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  const recyclers = allRecyclers;

  // State aggregates for the choropleth
  const stateMap = new Map<string, { recyclers: number; capacity: number }>();
  for (const r of recyclers) {
    if (!r.state) continue;
    const e = stateMap.get(r.state) ?? { recyclers: 0, capacity: 0 };
    e.recyclers += 1;
    e.capacity += parseCap(r.capacity_per_month);
    stateMap.set(r.state, e);
  }
  const stateData = Object.fromEntries(stateMap);

  // Facility-level pins — clickable → internal profile
  const pins = recyclers
    .filter(r => r.latitude != null && r.longitude != null)
    .map(r => ({
      id: r.id,
      code: r.recycler_code ?? undefined,
      lat: Number(r.latitude),
      lng: Number(r.longitude),
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
              {recyclers.length} facilities · {statesCount} states · {new Intl.NumberFormat('en-IN').format(Math.round(totalCapacity))} MTA capacity
            </p>
          </div>
        </div>
        <Link href="/d/recycling" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
          &larr; Dashboard
        </Link>
      </div>

      {/* Choropleth + clickable GPS pins — each pin navigates to the internal profile */}
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
            pinHrefBase="/d/recycling/recyclers"
          />
        </div>
      </div>

      <RecyclerList recyclers={recyclers} />
    </div>
  );
}
