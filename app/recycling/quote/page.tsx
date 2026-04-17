'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Recycle, Plus, Trash2, Zap, ArrowRight, Leaf } from 'lucide-react';

const input = 'w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50';

// Recoverable material value per unit/kg — based on publicly available commodity recovery data
// These represent the ECONOMIC VALUE of materials inside the waste, NOT what we pay
const WASTE_VALUE: Record<string, { value: number; unit: string; avgKg: number; materials: string }> = {
  'Computers & Laptops':       { value: 120,  unit: 'unit', avgKg: 5,   materials: 'Copper, aluminium, gold traces, steel, plastics' },
  'Mobile Phones & Tablets':   { value: 80,   unit: 'unit', avgKg: 0.2, materials: 'Gold, silver, palladium, copper, cobalt, lithium' },
  'Batteries (Li-ion)':        { value: 150,  unit: 'kg',   avgKg: 1,   materials: 'Lithium, cobalt, nickel, manganese, copper' },
  'Batteries (Lead-acid)':     { value: 55,   unit: 'kg',   avgKg: 10,  materials: 'Lead (95% recoverable), sulphuric acid, polypropylene' },
  'Monitors & Displays':       { value: 40,   unit: 'unit', avgKg: 8,   materials: 'Glass, copper, steel, rare earth elements' },
  'Printers & Peripherals':    { value: 60,   unit: 'unit', avgKg: 6,   materials: 'Steel, copper, aluminium, plastics, toner residue' },
  'Cables & Copper Wiring':    { value: 400,  unit: 'kg',   avgKg: 1,   materials: 'Copper (65-85% recovery), PVC, aluminium' },
  'PCBs & Circuit Boards':     { value: 800,  unit: 'kg',   avgKg: 0.5, materials: 'Gold, silver, palladium, copper, tin, rare earths' },
  'UPS & Power Supply':        { value: 180,  unit: 'unit', avgKg: 8,   materials: 'Lead-acid battery, copper transformer, steel' },
  'Networking Equipment':      { value: 50,   unit: 'unit', avgKg: 2,   materials: 'Copper, aluminium, steel, small PCBs' },
  'Home Appliances (Large)':   { value: 300,  unit: 'unit', avgKg: 35,  materials: 'Compressor copper, steel, aluminium, refrigerant gas' },
  'Industrial Electronics':    { value: 100,  unit: 'kg',   avgKg: 5,   materials: 'Copper, precious metals, speciality alloys' },
  'Solar Panels':              { value: 25,   unit: 'kg',   avgKg: 18,  materials: 'Silicon, silver, copper, aluminium frame, glass' },
  'Mixed E-Waste':             { value: 15,   unit: 'kg',   avgKg: 1,   materials: 'Mixed metals, plastics — lower recovery yield' },
};

const CATEGORIES = Object.keys(WASTE_VALUE);

interface Item { category: string; quantity: number; }

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtKg = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)} MT` : `${Math.round(n)} kg`;

export default function EWasteQuotePage() {
  const [items, setItems] = useState<Item[]>([{ category: '', quantity: 1 }]);
  const [showResult, setShowResult] = useState(false);

  const addItem = () => setItems(prev => [...prev, { category: '', quantity: 1 }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string | number) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const valid = items.filter(i => i.category && i.quantity > 0);

  const breakdown = valid.map(i => {
    const info = WASTE_VALUE[i.category];
    const value = info.unit === 'kg' ? info.value * info.avgKg * i.quantity : info.value * i.quantity;
    const weight = info.avgKg * i.quantity;
    return { ...i, value, weight, materials: info.materials, rate: info.value, unit: info.unit };
  });

  const totalValue = breakdown.reduce((s, b) => s + b.value, 0);
  const totalWeight = breakdown.reduce((s, b) => s + b.weight, 0);
  const totalItems = valid.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/recycling" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6">
          <ArrowLeft className="h-3 w-3" /> Back to Recycling
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Leaf className="h-7 w-7 text-emerald-400" />
          <h1 className="text-2xl font-bold">Discover the Value in Your Recyclables</h1>
        </div>
        <p className="text-sm text-zinc-500 mb-8">
          Electronics, batteries, and metal scrap contain valuable recoverable materials — copper, gold, silver, lithium, cobalt, rare earths.
          Find out what&apos;s locked inside.
        </p>

        {!showResult ? (
          <>
            {/* Item selector */}
            <div className="space-y-3 mb-6">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-end">
                  <div className="flex-1">
                    {idx === 0 && <label className="text-xs text-zinc-500 mb-1 block">What do you have?</label>}
                    <select className={input} value={item.category} onChange={e => updateItem(idx, 'category', e.target.value)}>
                      <option value="">Select type...</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="w-24">
                    {idx === 0 && <label className="text-xs text-zinc-500 mb-1 block">Qty</label>}
                    <input type="number" min={1} className={input} value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} />
                  </div>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="p-3 text-red-400/60 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button onClick={addItem} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mb-8">
              <Plus className="h-3.5 w-3.5" /> Add More Items
            </button>

            <button
              onClick={() => { if (valid.length > 0) setShowResult(true); }}
              disabled={valid.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-4 text-base font-semibold text-white transition-colors disabled:opacity-50"
            >
              <Zap className="h-5 w-5" /> Show Recoverable Value
            </button>
          </>
        ) : (
          <div className="space-y-6">
            {/* Hero result */}
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-zinc-950 p-8 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Estimated Recoverable Material Value</p>
              <p className="text-5xl font-black text-emerald-400">{fmt(totalValue)}</p>
              <p className="text-sm text-zinc-400 mt-3">
                locked inside <strong className="text-white">{totalItems} items</strong> weighing approximately <strong className="text-white">{fmtKg(totalWeight)}</strong>
              </p>
              <p className="text-xs text-zinc-600 mt-2">
                Based on commodity recovery rates and current material market values
              </p>
            </div>

            {/* The pitch */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
              <Recycle className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold mb-2">Would you like to put this value back into the economy?</h2>
              <p className="text-sm text-zinc-400 max-w-lg mx-auto">
                Instead of letting these materials end up in landfills, we connect you with
                CPCB, SPCB, or MoEF-authorised recyclers and reprocessors near you who recover and reuse these resources responsibly.
                Your waste becomes someone else&apos;s raw material.
              </p>
              <Link
                href="/recycling/quote"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-3.5 mt-6 text-sm font-semibold text-white transition-colors"
              >
                Connect with Registered Recyclers Nearby <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Breakdown */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <div className="px-6 py-3 border-b border-zinc-800/60">
                <h3 className="text-sm font-semibold text-zinc-300">What&apos;s Inside Your Materials</h3>
              </div>
              <div className="divide-y divide-zinc-800/60">
                {breakdown.map((b, idx) => (
                  <div key={idx} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-zinc-200">{b.category}</p>
                      <p className="text-sm font-bold text-emerald-400">{fmt(b.value)}</p>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {b.quantity} {b.unit === 'kg' ? `units (~${fmtKg(b.weight)})` : 'units'} &middot; Recoverable: <span className="text-zinc-400">{b.materials}</span>
                    </p>
                  </div>
                ))}
              </div>
              <div className="px-6 py-3 bg-zinc-800/30 flex justify-between items-center">
                <span className="text-sm font-semibold text-zinc-300">Total Recoverable Value</span>
                <span className="text-lg font-black text-emerald-400">{fmt(totalValue)}</span>
              </div>
            </div>

            {/* Environmental impact */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4">Environmental Impact of Recycling This</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-black text-emerald-400">{fmtKg(totalWeight * 0.3)}</p>
                  <p className="text-xs text-zinc-500 mt-1">CO₂ emissions avoided</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-sky-400">{Math.round(totalWeight * 0.7)}</p>
                  <p className="text-xs text-zinc-500 mt-1">Litres of water saved</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-amber-400">{fmtKg(totalWeight * 0.6)}</p>
                  <p className="text-xs text-zinc-500 mt-1">Raw materials recovered</p>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-zinc-600 text-center">
              Values are estimates based on average commodity recovery rates and publicly available market data.
              Actual recoverable value depends on item condition, age, and processing method.
              Roteh&uuml;gels is a digital facilitator — we do not physically handle any waste.
            </p>

            <button onClick={() => { setShowResult(false); setItems([{ category: '', quantity: 1 }]); }}
              className="block mx-auto text-sm text-zinc-500 hover:text-zinc-300">
              Calculate Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
