'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Recycle, MapPin, Factory, ArrowLeft, List, Map as MapIcon, X } from 'lucide-react';
import IndiaMap from '@/components/IndiaMap';

const MISSING_STATES = [
  'Bihar', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim', 'Tripura',
  'Arunachal Pradesh', 'Lakshadweep', 'Andaman & Nicobar Islands', 'Chandigarh',
  'Dadra & Nagar Haveli', 'Daman & Diu', 'Puducherry', 'Ladakh',
];

const fmtNum = (n: number) => new Intl.NumberFormat('en-IN').format(n);

function getColor(recyclers: number): string {
  if (recyclers >= 30) return 'text-emerald-400';
  if (recyclers >= 5) return 'text-sky-400';
  return 'text-zinc-400';
}

type StateData = { name: string; recyclers: number; capacity: number };

interface Props {
  states: StateData[];
  totalRecyclers: number;
  totalCapacity: number;
  statesCount: number;
}

export default function RecyclerDirectory({ states: STATES, totalRecyclers: TOTAL_RECYCLERS, totalCapacity: TOTAL_CAPACITY, statesCount }: Props) {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'table'>('map');

  const filteredStates = selectedState
    ? STATES.filter(s => s.name === selectedState)
    : STATES;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link href="/ewaste" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6">
          <ArrowLeft className="h-3 w-3" /> Back to E-Waste Recycling
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Factory className="h-7 w-7 text-emerald-400" />
          <h1 className="text-2xl font-bold">Registered E-Waste & Battery Recyclers in India</h1>
        </div>
        <p className="text-sm text-zinc-500 mb-8">
          Directory of {fmtNum(TOTAL_RECYCLERS)} authorized recyclers, dismantlers and battery processors across {statesCount} states.
          Includes CPCB e-waste, battery waste (BWM), MRAI material recyclers and SPCB-registered facilities.
        </p>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-center">
            <p className="text-3xl font-black text-emerald-400">{fmtNum(TOTAL_RECYCLERS)}</p>
            <p className="text-xs text-zinc-500 mt-1">Registered Recyclers</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-center">
            <p className="text-3xl font-black text-sky-400">{STATES.length}</p>
            <p className="text-xs text-zinc-500 mt-1">States Covered</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-center">
            <p className="text-3xl font-black text-amber-400">{fmtNum(Math.round(TOTAL_CAPACITY / 1000))}</p>
            <p className="text-xs text-zinc-500 mt-1">Thousand MTA Capacity</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-center">
            <p className="text-3xl font-black text-zinc-400">{MISSING_STATES.length}</p>
            <p className="text-xs text-zinc-500 mt-1">States Without Recyclers *</p>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setView('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              view === 'map' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" /> Map View
          </button>
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              view === 'table' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <List className="h-3.5 w-3.5" /> Table View
          </button>
          {selectedState && (
            <button
              onClick={() => setSelectedState(null)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors ml-auto"
            >
              <X className="h-3 w-3" /> Clear: {selectedState}
            </button>
          )}
        </div>

        {/* Map View */}
        {view === 'map' && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 mb-8">
            <h2 className="text-sm font-semibold text-zinc-300 mb-4">Interactive India Map — Click a state to filter</h2>
            <div className="max-w-lg mx-auto">
              <IndiaMap
                onStateClick={(state) => setSelectedState(prev => prev === state ? null : state)}
                selectedState={selectedState}
              />
            </div>
          </div>
        )}

        {/* State-wise table */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">
              {selectedState ? `Recyclers in ${selectedState}` : 'State-wise Distribution'}
            </h2>
            <span className="text-xs text-zinc-500">
              {selectedState ? `${filteredStates[0]?.recyclers ?? 0} recyclers` : 'Sorted by number of recyclers'}
            </span>
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
                {filteredStates.map((s, i) => {
                  const pct = Math.round((s.recyclers / TOTAL_RECYCLERS) * 100);
                  return (
                    <tr
                      key={s.name}
                      className={`hover:bg-zinc-800/20 transition-colors cursor-pointer ${selectedState === s.name ? 'bg-amber-500/5' : ''}`}
                      onClick={() => setSelectedState(prev => prev === s.name ? null : s.name)}
                    >
                      <td className="px-6 py-3 text-zinc-600">{selectedState ? 1 : i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className={`h-3.5 w-3.5 ${getColor(s.recyclers)}`} />
                          <span className="text-zinc-200 font-medium">{s.name}</span>
                          {s.name === 'Tamil Nadu' && (
                            <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full">Our State</span>
                          )}
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
              {!selectedState && (
                <tfoot>
                  <tr className="border-t border-zinc-700 bg-zinc-800/20">
                    <td className="px-6 py-3"></td>
                    <td className="px-4 py-3 font-bold text-white">Total</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-400">{fmtNum(TOTAL_RECYCLERS)}</td>
                    <td className="px-4 py-3 text-right font-bold text-zinc-300 font-mono">{fmtNum(TOTAL_CAPACITY)}</td>
                    <td className="px-6 py-3 text-xs text-zinc-500">100%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Missing states */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 mb-8">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">
            * States / UTs Without CPCB-Registered Recyclers
          </h3>
          <p className="text-xs text-zinc-500 mb-3">
            The following states and union territories do not have any CPCB/SPCB-authorized e-waste
            recyclers or dismantlers as per the data available (as on 08-06-2023):
          </p>
          <div className="flex flex-wrap gap-2">
            {MISSING_STATES.map(s => (
              <span key={s} className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-full px-3 py-1">
                {s}
              </span>
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-3 italic">
            E-waste generated in these regions may need to be transported to the nearest state with registered recyclers.
          </p>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center mb-8">
          <Recycle className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold mb-2">Are you a CPCB-registered recycler?</h3>
          <p className="text-sm text-zinc-400 mb-4">Join our platform to get connected with e-waste generators.</p>
          <Link href="/ewaste/recycler-register"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors">
            Register Your Facility
          </Link>
        </div>

        {/* References */}
        <div className="text-xs text-zinc-600 space-y-2">
          <p className="font-semibold text-zinc-500">References &amp; Data Sources</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Central Pollution Control Board (CPCB) — <em>List of Dismantlers/Recyclers as per the authorisation issued by SPCBs/PCCs under E-Waste (Management) Rules, 2022 (As on 08-06-2023)</em> — <a href="https://www.cpcb.nic.in/e-waste-recyclers-dismantler/" className="text-zinc-500 hover:text-zinc-300 underline" target="_blank" rel="noopener noreferrer">cpcb.nic.in</a></li>
            <li>NDMC — <em>CPCB Approved List of E-Waste Recyclers/Dismantler</em> — <a href="https://www.ndmc.gov.in/pdf/cpcb_approved_list_of_e-waste_recyclers_dismantler.pdf" className="text-zinc-500 hover:text-zinc-300 underline" target="_blank" rel="noopener noreferrer">ndmc.gov.in (PDF)</a></li>
            <li>E-Waste (Management) Rules, 2022 — Ministry of Environment, Forest and Climate Change, Government of India</li>
          </ol>
          <p className="italic text-zinc-700 mt-2">
            Any omissions or errors in the data presented are not intentional. Information is sourced from publicly
            available government records and may not reflect the most current status of authorisations.
            Users are advised to verify recycler credentials independently with the respective SPCB/PCC.
            The data is as on 08-06-2023 and new authorisations issued after this date may not be reflected.
          </p>
        </div>
      </div>
    </div>
  );
}
