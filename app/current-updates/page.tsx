// app/current-updates/page.tsx
'use client';

import MarketOverview from '@/components/MarketOverview';
import EconomicCalendar from '@/components/EconomicCalendar';

export default function CurrentUpdates() {
  return (
    <section className="container mx-auto px-4 md:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Current Updates
        </h1>
        <p className="mt-2 text-zinc-300 max-w-3xl">
          Live market intelligence powered by reliable TradingView widgets.
          Metals overview on the left, macro calendar on the right.
        </p>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Markets card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Metals & Commodities</h2>
            <span className="text-xs text-zinc-400">Data via TradingView</span>
          </div>
          <div className="overflow-hidden rounded-xl bg-black/20">
            <MarketOverview />
          </div>
        </div>

        {/* Economic calendar card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Economic Calendar</h2>
            <span className="text-xs text-zinc-400">Global macro events</span>
          </div>
          <div className="overflow-hidden rounded-xl bg-black/20">
            <EconomicCalendar />
          </div>
        </div>
      </div>

      {/* Small note */}
      <p className="mt-6 text-xs text-zinc-500">
        Tip: Use the widget controls to change timeframe, symbols, or filters.
      </p>
    </section>
  );
}