'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Recycle, MapPin, Factory, ArrowLeft, List, Map as MapIcon, X } from 'lucide-react';
import IndiaMap from '@/components/IndiaMap';

// States/UTs with no facilities in our directory at all.
// Computed dynamically in the component against the live rawList so it never
// contradicts the State-wise Distribution table.
const ALL_STATES_UTS = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand',
  'West Bengal',
  // UTs
  'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli','Daman & Diu',
  'Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const fmtNum = (n: number) => new Intl.NumberFormat('en-IN').format(n);

function getColor(recyclers: number): string {
  if (recyclers >= 30) return 'text-emerald-400';
  if (recyclers >= 5) return 'text-sky-400';
  return 'text-zinc-400';
}

type RawEntry = { state: string; waste_type: string; capacity: number; black_mass_mta?: number | null };
// Public pin: position + category + state only — no id, code, name, sub.
type PublicPin = { lat: number; lng: number; label: string; sub?: string; waste_type?: string; state?: string; black_mass_mta?: number };

const CATEGORY_LABELS: Record<string, string> = {
  'e-waste': 'E-Waste',
  'battery': 'Battery / Li-Ion (full hydromet)',
  'black-mass': 'Black Mass / Mechanical',
  'both': 'E-Waste + Battery',
  'hazardous': 'Non-Ferrous Metals',
  'zinc-dross': 'Zinc Dross / Zinc Ash',
  'primary-metal': 'Primary Metal Producers',
  'critical-minerals': 'Critical Minerals',
  'ev-oem': 'EV OEMs (vehicle + battery pack)',
  'battery-pack': 'Battery Pack Makers',
  'cell-maker': 'Li-Ion Cell / CAM Makers',
};

function matchCategory(
  record: { waste_type?: string; black_mass_mta?: number | null },
  category: string,
): boolean {
  if (category === 'black-mass') {
    return record.waste_type === 'black-mass' || (record.black_mass_mta ?? 0) > 0;
  }
  return record.waste_type === category;
}

// Tier supergroups — aggregates the 10 waste_type categories into 3 circular
// economy tiers (upstream forward → downstream forward → reverse loop).
const TIER_ORDER = ['upstream', 'forward', 'reverse'] as const;
const TIER_META: Record<typeof TIER_ORDER[number], { label: string; description: string; members: string[] }> = {
  upstream: {
    label: 'Upstream',
    description: 'Primary metal producers, critical / heavy minerals, cell / CAM makers',
    members: ['primary-metal', 'critical-minerals', 'cell-maker'],
  },
  forward: {
    label: 'Forward chain',
    description: 'EV OEMs + battery pack makers',
    members: ['ev-oem', 'battery-pack'],
  },
  reverse: {
    label: 'Reverse loop',
    description: 'Recyclers, reprocessors + material recovery',
    members: ['e-waste', 'battery', 'black-mass', 'hazardous', 'zinc-dross', 'both'],
  },
};
interface Props {
  rawList: RawEntry[];
  pins?: PublicPin[];
}

export default function EcosystemDirectory({ rawList, pins = [] }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'table'>('map');
  const [showPins, setShowPins] = useState(true);

  // Filter by category first. "black-mass" category is special: it unions
  // pure-mechanical shredders (waste_type='black-mass') with integrated
  // recyclers that produce black mass as an intermediate step (black_mass_mta set).
  const filtered = selectedCategory
    ? rawList.filter(r =>
        selectedCategory === 'black-mass'
          ? r.waste_type === 'black-mass' || (r.black_mass_mta ?? 0) > 0
          : r.waste_type === selectedCategory,
      )
    : rawList;

  // Aggregate state-wise from filtered data
  const stateMap = new Map<string, { recyclers: number; capacity: number }>();
  for (const r of filtered) {
    if (!r.state) continue;
    const existing = stateMap.get(r.state) ?? { recyclers: 0, capacity: 0 };
    existing.recyclers += 1;
    existing.capacity += r.capacity;
    stateMap.set(r.state, existing);
  }

  const STATES = Array.from(stateMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.recyclers - a.recyclers);

  const TOTAL_RECYCLERS = filtered.length;
  const TOTAL_CAPACITY = STATES.reduce((s, st) => s + st.capacity, 0);
  const statesCount = STATES.length;

  // Category breakdown by primary waste_type. Each row is counted exactly
  // once so the categories sum to the total — no double-counting.
  const categoryMap = new Map<string, number>();
  for (const r of rawList) {
    categoryMap.set(r.waste_type, (categoryMap.get(r.waste_type) ?? 0) + 1);
  }
  const categories = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Integrated recyclers that also produce black-mass (but carry a different
  // primary waste_type) — shown as a secondary note so users understand the
  // black-mass filter button unions these in.
  const blackMassExtras = rawList.filter(r => r.waste_type !== 'black-mass' && (r.black_mass_mta ?? 0) > 0).length;

  // Missing states — dynamically computed to match the live data, so it
  // can never contradict the State-wise Distribution table.
  const presentStates = new Set(rawList.map(r => r.state).filter(Boolean));
  const missingStates = ALL_STATES_UTS.filter(s => !presentStates.has(s)).sort();

  // Group categories into the 3 tiers for the tier breakdown band.
  const tiers = TIER_ORDER.map(t => {
    const cats = categories.filter(c => TIER_META[t].members.includes(c.name));
    const total = cats.reduce((s, c) => s + c.count, 0);
    return { key: t, meta: TIER_META[t], categories: cats, total };
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-[1800px] mx-auto px-6 md:px-10 py-12">
        <Link href="/recycling" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6">
          <ArrowLeft className="h-3 w-3" /> Back to Recycling
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Factory className="h-7 w-7 text-emerald-400" />
          <h1 className="text-2xl font-bold">India Circular Economy Ecosystem</h1>
        </div>
        <p className="text-sm text-zinc-500 mb-8">
          From primary metal producers to EV OEMs, battery / cell makers, and authorised recyclers —{' '}
          <strong className="text-zinc-400">{fmtNum(TOTAL_RECYCLERS)}</strong> facilities across {statesCount} states. The full forward +
          reverse value chain of metals and batteries. Data sourced from CPCB, SPCB, MPCB, MoEF registries plus publicly disclosed
          facility information.
          <span className="block mt-2 text-xs text-zinc-600">
            Metals and batteries today · plastics, paper, and tyres next.
          </span>
        </p>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-center">
            <p className="text-3xl font-black text-emerald-400">{fmtNum(TOTAL_RECYCLERS)}</p>
            <p className="text-xs text-zinc-500 mt-1">Facilities Listed</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-center">
            <p className="text-3xl font-black text-sky-400">{STATES.length}</p>
            <p className="text-xs text-zinc-500 mt-1">States Covered</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-center">
            <p className="text-3xl font-black text-amber-400">{fmtNum(Math.round(TOTAL_CAPACITY))}</p>
            <p className="text-xs text-zinc-500 mt-1">MTA Total Capacity</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-center">
            <p className="text-3xl font-black text-zinc-400">{missingStates.length}</p>
            <p className="text-xs text-zinc-500 mt-1">States / UTs With No Listed Facility *</p>
          </div>
        </div>

        {/* Evolving-coverage disclaimer */}
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5 mb-8 flex gap-4">
          <div className="shrink-0 pt-0.5">
            <Recycle className="h-5 w-5 text-sky-400" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm text-sky-300 font-semibold">This ecosystem is continuously evolving.</p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We&apos;re actively expanding coverage and verifying data across every industry in India&apos;s
              critical-minerals value chain — from mines, smelters, and rare-earth processors to cell / CAM
              makers, EV OEMs, battery pack assemblers, authorised recyclers, and material-recovery
              facilities. New tiers and verified entries are added on a rolling basis; plastics, paper, and
              tyre-recycling coverage is in planning.
            </p>
            <p className="text-xs text-zinc-500">
              Spot a missing facility, outdated contact, or incorrect classification? Help us keep the map
              accurate — write to{' '}
              <a href="mailto:info@rotehuegels.com?subject=Ecosystem%20directory%20—%20correction%20or%20addition"
                 className="text-sky-400 hover:text-sky-300 underline">info@rotehuegels.com</a>.
            </p>
          </div>
        </div>

        {/* Ecosystem tiers — primary → forward → reverse loop */}
        {categories.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 mb-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-300">Ecosystem Tiers</h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">Click any category to filter. Counts sum to the full directory.</p>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`text-xs flex items-center gap-1 ${selectedCategory ? 'text-red-400 hover:text-red-300' : 'text-emerald-400'}`}
              >
                {selectedCategory ? <><X className="h-3 w-3" /> Clear filter — show all {fmtNum(rawList.length)}</>
                                  : <>Showing all {fmtNum(rawList.length)}</>}
              </button>
            </div>

            {tiers.map(t => (
              <div key={t.key} className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{t.meta.label}</span>
                    <span className="text-[11px] text-zinc-600 ml-2">{t.meta.description}</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">{fmtNum(t.total)} rows</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {t.categories.map(cat => (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(prev => prev === cat.name ? null : cat.name)}
                      className={`rounded-xl border p-3 text-center transition-colors cursor-pointer ${
                        selectedCategory === cat.name
                          ? 'border-emerald-500/50 bg-emerald-500/10'
                          : 'border-zinc-700/50 bg-zinc-800/30 hover:border-zinc-600'
                      }`}
                    >
                      <p className={`text-lg font-black ${selectedCategory === cat.name ? 'text-emerald-400' : 'text-white'}`}>{fmtNum(cat.count)}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">{CATEGORY_LABELS[cat.name] ?? cat.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {blackMassExtras > 0 && (
              <p className="text-[10px] text-zinc-600 pt-2 border-t border-zinc-800">
                Clicking <strong className="text-zinc-500">Black Mass / Mechanical</strong> also
                includes {blackMassExtras} integrated recyclers that produce black mass but are classified under their primary category.
              </p>
            )}
          </div>
        )}

        {/* View toggle */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setView('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              view === 'map' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" /> Choropleth
          </button>
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              view === 'table' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <List className="h-3.5 w-3.5" /> Table View
          </button>
        </div>

        {/* Map — choropleth + anonymised GPS dots. State counts reflect the
            active category filter. Remounting via `key` on filter change
            guarantees hover state can't carry stale counts. */}
        {view === 'map' && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-300">
                State-wise Distribution
                {selectedCategory && (
                  <span className="ml-2 text-[11px] font-normal text-emerald-400">
                    · filtered: {CATEGORY_LABELS[selectedCategory] ?? selectedCategory} ({fmtNum(TOTAL_RECYCLERS)} rows)
                  </span>
                )}
              </h2>
              {pins.length > 0 && (
                <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPins}
                    onChange={e => setShowPins(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  Show {pins.filter(p => !selectedCategory || matchCategory(p, selectedCategory)).length} facility locations
                </label>
              )}
            </div>
            <div className="max-w-2xl mx-auto lg:max-w-3xl">
              <IndiaMap
                key={selectedCategory ?? 'all'}
                stateData={Object.fromEntries(STATES.map(s => [s.name, { recyclers: s.recyclers, capacity: s.capacity }]))}
                pins={selectedCategory ? pins.filter(p => matchCategory(p, selectedCategory)) : pins}
                showPins={showPins}
              />
            </div>
            {selectedCategory && TOTAL_RECYCLERS > 0 && (
              <p className="text-[11px] text-zinc-500 mt-3 text-center">
                Hover any state for the <strong className="text-zinc-400">{CATEGORY_LABELS[selectedCategory] ?? selectedCategory}</strong> count in that state.
                States not shown on the map have zero facilities in this category.
              </p>
            )}
          </div>
        )}

        {/* State-wise counts table (aggregates only — no drilldown to facility names) */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">State-wise Distribution</h2>
            <span className="text-xs text-zinc-500">Sorted by number of recyclers</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">State</th>
                  <th className="px-4 py-3 text-right">Recyclers</th>
                  <th className="px-4 py-3 text-right">Capacity (MTA)</th>
                  <th className="px-6 py-3">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {STATES.map((s, i) => {
                  const pct = Math.round((s.recyclers / TOTAL_RECYCLERS) * 100);
                  return (
                    <tr key={s.name} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-6 py-3 text-zinc-600">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className={`h-3.5 w-3.5 ${getColor(s.recyclers)}`} />
                          <span className="text-zinc-200 font-medium">{s.name}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${getColor(s.recyclers)}`}>{s.recyclers}</td>
                      <td className="px-4 py-3 text-right text-zinc-400 font-mono">{fmtNum(s.capacity)}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                            <div className={`h-full rounded-full ${
                              pct >= 15 ? 'bg-emerald-500' : pct >= 5 ? 'bg-sky-500' : 'bg-zinc-600'
                            }`} style={{ width: `${Math.max(pct, 2)}%` }} />
                          </div>
                          <span className="text-xs text-zinc-500 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-700 bg-zinc-800/20">
                  <td className="px-6 py-3"></td>
                  <td className="px-4 py-3 font-bold text-white">Total</td>
                  <td className="px-4 py-3 text-right font-black text-emerald-400">{fmtNum(TOTAL_RECYCLERS)}</td>
                  <td className="px-4 py-3 text-right font-bold text-zinc-300 font-mono">{fmtNum(TOTAL_CAPACITY)}</td>
                  <td className="px-6 py-3 text-xs text-zinc-500">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Missing states */}
        {missingStates.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 mb-8">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">
              * States / UTs With No Listed Facility
            </h3>
            <p className="text-xs text-zinc-500 mb-3">
              The following states and union territories do not have any CPCB / SPCB / MoEF-authorised
              recycling, reprocessing, or upstream-producer facility in our directory. Waste generated
              in these regions may need to be transported to the nearest state with authorised units.
            </p>
            <div className="flex flex-wrap gap-2">
              {missingStates.map(s => (
                <span key={s} className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-full px-3 py-1">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center mb-8">
          <Recycle className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold mb-2">Are you a registered recycler or reprocessor?</h3>
          <p className="text-sm text-zinc-400 mb-4">Join our platform to connect with waste generators and material suppliers across India.</p>
          <Link href="/recycling/recycler-register"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors">
            Register Your Facility
          </Link>
        </div>

        {/* References */}
        <div className="text-xs text-zinc-600 space-y-2">
          <p className="font-semibold text-zinc-500">References &amp; Data Sources</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>CPCB — List of E-Waste Dismantlers/Recyclers under E-Waste (Management) Rules, 2022 — <a href="https://www.cpcb.nic.in/e-waste-recyclers-dismantler/" className="text-zinc-500 hover:text-zinc-300 underline" target="_blank" rel="noopener noreferrer">cpcb.nic.in</a></li>
            <li>MoEF/CPCB — List of Non-Ferrous Metal Waste Reprocessors (376 units) — <a href="http://ciiwasteexchange.org/Data/Non-ferrous%20metal%20waste%20reprocessors.pdf" className="text-zinc-500 hover:text-zinc-300 underline" target="_blank" rel="noopener noreferrer">CII Waste Exchange</a></li>
            <li>MPCB — Authorized E-Waste Recyclers, Refurbishers &amp; Dismantlers in Maharashtra (May 2024) — <a href="https://mpcb.gov.in" className="text-zinc-500 hover:text-zinc-300 underline" target="_blank" rel="noopener noreferrer">mpcb.gov.in</a></li>
            <li>TNPCB — List of Authorized E-Waste Dismantling Units in Tamil Nadu — <a href="https://tnpcb.gov.in" className="text-zinc-500 hover:text-zinc-300 underline" target="_blank" rel="noopener noreferrer">tnpcb.gov.in</a></li>
            <li>TSPCB — Details of Authorised E-Waste Dismantlers, Recyclers and Producers — <a href="https://tspcb.cgg.gov.in" className="text-zinc-500 hover:text-zinc-300 underline" target="_blank" rel="noopener noreferrer">tspcb.cgg.gov.in</a></li>
            <li>RSPCB — List of Dismantlers/Refurbishers/Recyclers Authorized by RSPCB — <a href="https://environment.rajasthan.gov.in" className="text-zinc-500 hover:text-zinc-300 underline" target="_blank" rel="noopener noreferrer">environment.rajasthan.gov.in</a></li>
            <li>KSPCB — List of E-Waste Dismantlers &amp; Recyclers in Karnataka — <a href="https://kspcb.karnataka.gov.in" className="text-zinc-500 hover:text-zinc-300 underline" target="_blank" rel="noopener noreferrer">kspcb.karnataka.gov.in</a></li>
            <li>CPCB — Battery Waste Management Rules, 2022 &amp; EPR Portal — <a href="https://eprbattery.cpcb.gov.in" className="text-zinc-500 hover:text-zinc-300 underline" target="_blank" rel="noopener noreferrer">eprbattery.cpcb.gov.in</a></li>
            <li>E-Waste (Management) Rules, 2022 &amp; Hazardous Waste Management Rules — MoEFCC, Government of India</li>
          </ol>
          <p className="italic text-zinc-700 mt-2">
            Data compiled from multiple government registries and official SPCB publications. Information may not reflect the most
            current status of authorisations. Users are advised to verify credentials independently with the respective SPCB/PCC.
          </p>
        </div>
      </div>
    </div>
  );
}
