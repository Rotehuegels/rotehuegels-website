'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calculator, Recycle, ArrowRight, Trash2, Plus, Zap } from 'lucide-react';

const input = 'w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50';

// Approximate scrap value per kg (INR) — varies by market
const SCRAP_RATES: Record<string, { rate: number; unit: string; avgWeight: number }> = {
  'Computers & Laptops':       { rate: 25,  unit: 'per unit', avgWeight: 5 },
  'Mobile Phones & Tablets':   { rate: 15,  unit: 'per unit', avgWeight: 0.2 },
  'Batteries (Li-ion)':        { rate: 80,  unit: 'per kg',   avgWeight: 1 },
  'Batteries (Lead-acid)':     { rate: 45,  unit: 'per kg',   avgWeight: 10 },
  'Monitors & Displays':       { rate: 10,  unit: 'per unit', avgWeight: 8 },
  'Printers & Peripherals':    { rate: 15,  unit: 'per unit', avgWeight: 6 },
  'Cables & Copper Wiring':    { rate: 350, unit: 'per kg',   avgWeight: 1 },
  'PCBs & Circuit Boards':     { rate: 600, unit: 'per kg',   avgWeight: 0.5 },
  'UPS & Power Supply':        { rate: 40,  unit: 'per unit', avgWeight: 8 },
  'Networking Equipment':      { rate: 20,  unit: 'per unit', avgWeight: 2 },
  'Home Appliances (AC)':      { rate: 200, unit: 'per unit', avgWeight: 35 },
  'Home Appliances (Fridge)':  { rate: 150, unit: 'per unit', avgWeight: 40 },
  'Home Appliances (Washer)':  { rate: 100, unit: 'per unit', avgWeight: 30 },
  'Industrial Electronics':    { rate: 50,  unit: 'per kg',   avgWeight: 5 },
  'Solar Panels':              { rate: 15,  unit: 'per kg',   avgWeight: 18 },
  'Mixed E-Waste':             { rate: 10,  unit: 'per kg',   avgWeight: 1 },
};

const CATEGORIES = Object.keys(SCRAP_RATES);

interface Item {
  category: string;
  quantity: number;
}

export default function EWasteQuotePage() {
  const [items, setItems] = useState<Item[]>([{ category: '', quantity: 1 }]);
  const [showResult, setShowResult] = useState(false);

  const addItem = () => setItems(prev => [...prev, { category: '', quantity: 1 }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string | number) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const validItems = items.filter(i => i.category && i.quantity > 0);
  const totalWeight = validItems.reduce((s, i) => {
    const info = SCRAP_RATES[i.category];
    return s + (info ? info.avgWeight * i.quantity : 0);
  }, 0);
  const estimatedValue = validItems.reduce((s, i) => {
    const info = SCRAP_RATES[i.category];
    if (!info) return s;
    return s + (info.unit === 'per kg' ? info.rate * info.avgWeight * i.quantity : info.rate * i.quantity);
  }, 0);

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/ewaste" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6">
          <ArrowLeft className="h-3 w-3" /> Back to E-Waste Recycling
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Calculator className="h-7 w-7 text-emerald-400" />
          <h1 className="text-2xl font-bold">E-Waste Value Estimator</h1>
        </div>
        <p className="text-sm text-zinc-500 mb-8">
          Get an instant estimate of your e-waste scrap value. Actual rates depend on condition, market prices, and recycler.
        </p>

        {/* Items */}
        <div className="space-y-3 mb-6">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-3 items-end">
              <div className="flex-1">
                {idx === 0 && <label className="text-xs text-zinc-500 mb-1 block">E-Waste Type</label>}
                <select className={input} value={item.category} onChange={e => updateItem(idx, 'category', e.target.value)}>
                  <option value="">Select category...</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c} — {SCRAP_RATES[c].unit === 'per kg' ? `~₹${SCRAP_RATES[c].rate}/kg` : `~₹${SCRAP_RATES[c].rate}/unit`}</option>
                  ))}
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
          <Plus className="h-3.5 w-3.5" /> Add Another Item
        </button>

        {/* Calculate */}
        {!showResult ? (
          <button
            onClick={() => { if (validItems.length > 0) setShowResult(true); }}
            disabled={validItems.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-4 text-base font-semibold text-white transition-colors disabled:opacity-50"
          >
            <Zap className="h-5 w-5" /> Get Instant Estimate
          </button>
        ) : (
          <div className="space-y-6">
            {/* Result card */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Estimated Scrap Value</p>
              <p className="text-4xl font-black text-emerald-400">{fmt(estimatedValue)}</p>
              <div className="flex gap-6 mt-4">
                <div>
                  <p className="text-xs text-zinc-500">Items</p>
                  <p className="text-lg font-bold text-white">{validItems.reduce((s, i) => s + i.quantity, 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Est. Weight</p>
                  <p className="text-lg font-bold text-white">{Math.round(totalWeight)} kg</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Categories</p>
                  <p className="text-lg font-bold text-white">{validItems.length}</p>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <div className="px-6 py-3 border-b border-zinc-800/60">
                <h3 className="text-sm font-semibold text-zinc-300">Breakdown</h3>
              </div>
              <div className="divide-y divide-zinc-800/60">
                {validItems.map((item, idx) => {
                  const info = SCRAP_RATES[item.category];
                  const value = info.unit === 'per kg' ? info.rate * info.avgWeight * item.quantity : info.rate * item.quantity;
                  const weight = info.avgWeight * item.quantity;
                  return (
                    <div key={idx} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <p className="text-sm text-zinc-300">{item.category}</p>
                        <p className="text-xs text-zinc-500">{item.quantity} {info.unit === 'per kg' ? `units (~${Math.round(weight)} kg)` : 'units'} &times; ₹{info.rate}/{info.unit.replace('per ', '')}</p>
                      </div>
                      <p className="text-sm font-semibold text-emerald-400">{fmt(value)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 text-xs text-zinc-500 space-y-1">
              <p><strong className="text-zinc-400">Note:</strong> This is an approximate estimate based on average market rates.</p>
              <p>Actual value depends on item condition (working/non-working), current scrap market prices, recycler capacity, and location.</p>
              <p>Rates shown are indicative and may vary &plusmn;30%. No payment is guaranteed until the recycler inspects the items.</p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3">
              <Link href="/ewaste/recycler-register"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3.5 text-sm font-semibold text-white transition-colors">
                <Recycle className="h-4 w-4" /> Register as Recycler
              </Link>
              <button onClick={() => { setShowResult(false); setItems([{ category: '', quantity: 1 }]); }}
                className="text-sm text-zinc-500 hover:text-zinc-300">
                Start Over
              </button>
            </div>
          </div>
        )}

        {/* How rates work */}
        <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">How Scrap Value is Determined</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-500">
            <div>
              <p className="text-zinc-400 font-medium mb-1">High Value</p>
              <p>PCBs, copper cables, batteries — contain precious and base metals (gold, silver, copper, lithium) recoverable through recycling.</p>
            </div>
            <div>
              <p className="text-zinc-400 font-medium mb-1">Medium Value</p>
              <p>Computers, UPS, appliances — contain mixed metals, plastics, and some recoverable components.</p>
            </div>
            <div>
              <p className="text-zinc-400 font-medium mb-1">Low Value</p>
              <p>Monitors, mixed e-waste — high processing cost relative to recoverable material. Still must be recycled responsibly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
