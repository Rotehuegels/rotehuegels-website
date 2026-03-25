'use client';
import { useEffect } from 'react';

export default function MarketOverview() {
  useEffect(() => {
    if (document.getElementById('tv-market-overview')) return;
    const s = document.createElement('script');
    s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
    s.id = 'tv-market-overview';
    s.async = true;
    s.innerHTML = JSON.stringify({
      colorTheme: "dark",
      dateRange: "12M",
      showChart: true,
      locale: "en",
      width: "100%",
      height: "600",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      tabs: [
        {
          title: "Metals",
          symbols: [
            { s: "OANDA:XAUUSD", d: "Gold" },
            { s: "CAPITALCOM:ALUMINUM", d: "Aluminum" },
            { s: "COMEX:HG1!", d: "Copper" },
            { s: "CAPITALCOM:NICKEL", d: "Nickel" },
            { s: "CAPITALCOM:ZINC", d: "Zinc" }
          ]
        },
        {
          title: "FX & Index",
          symbols: [
            { s: "TVC:DXY", d: "US Dollar Index" },
            { s: "FX_IDC:USDINR", d: "USD/INR" },
            { s: "CAPITALCOM:HSI", d: "Hang Seng" },
            { s: "FOREXCOM:EURUSD", d: "EUR/USD" }
          ]
        }
      ]
    });
    const c = document.getElementById('tv-market-overview-container');
    if (c) c.appendChild(s);
  }, []);

  return (
    <section className="mt-10">
      <div id="tv-market-overview-container" className="tradingview-widget-container card">
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </section>
  );
}