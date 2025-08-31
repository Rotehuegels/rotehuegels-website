'use client';
import { useEffect } from 'react';

export default function EconomicCalendar() {
  useEffect(() => {
    if (document.getElementById('tv-econ-cal')) return;
    const s = document.createElement('script');
    s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    s.id = 'tv-econ-cal';
    s.async = true;
    s.innerHTML = JSON.stringify({
      colorTheme: "dark",
      isTransparent: true,
      width: "100%",
      height: "600",
      locale: "en",
      importanceFilter: "-1,0,1"  // all
    });
    const c = document.getElementById('tv-econ-cal-container');
    if (c) c.appendChild(s);
  }, []);

  return (
    <section className="mt-10">
      <div id="tv-econ-cal-container" className="tradingview-widget-container card">
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </section>
  );
}