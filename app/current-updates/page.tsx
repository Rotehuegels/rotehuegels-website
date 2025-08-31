'use client';
import MarketOverview from '@/components/MarketOverview';
import EconomicCalendar from '@/components/EconomicCalendar';

export default function CurrentUpdates() {
  return (
    <section className="container mt-10">
      <h1>Current Updates</h1>
      <p className="opacity-80 mt-2">
        Live market updates powered by TradingView widgets (free & reliable).
      </p>
      <MarketOverview />
      <EconomicCalendar />
    </section>
  );
}