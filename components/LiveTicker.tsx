'use client';
import { useEffect } from 'react';

/**
 * TradingView Ticker Tape widget.
 * Symbols can be edited below. Free to use & embed.
 */
export default function LiveTicker(){
  useEffect(()=>{
    if(document.getElementById('tv-script')) return;
    const s = document.createElement('script');
    s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    s.id = 'tv-script';
    s.async = true;
    s.innerHTML = JSON.stringify({
      symbols: [
        { proName: "COMEX:HG1!", title: "Copper" },
        { proName: "MCX:COPPER1!", title: "MCX Copper" },
        { proName: "TVC:DXY", title: "US Dollar Index" },
        { proName: "OANDA:XAUUSD", title: "Gold" },
        { proName: "CAPITALCOM:ALUMINUM", title: "Aluminum" }
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "en"
    });
    const c = document.getElementById('tv-container');
    if(c) c.appendChild(s);
  },[]);

  return (
    <section className="border-t border-b border-white/10 bg-black/30">
      <div className="container py-3">
        <div id="tv-container" className="tradingview-widget-container">
          <div className="tradingview-widget-container__widget"></div>
        </div>
      </div>
    </section>
  )
}
