'use client';

import { useState, useCallback, useEffect } from 'react';

// ISO 3166-2:IN code → display name mapping (28 States + 8 UTs, post-2019 reorganization)
const CODE_TO_NAME: Record<string, string> = {
  'IN-AN': 'Andaman & Nicobar Islands', 'IN-AP': 'Andhra Pradesh', 'IN-AR': 'Arunachal Pradesh',
  'IN-AS': 'Assam', 'IN-BR': 'Bihar', 'IN-CH': 'Chandigarh', 'IN-CT': 'Chhattisgarh',
  'IN-DD': 'Daman & Diu', 'IN-DL': 'Delhi', 'IN-DN': 'Dadra & Nagar Haveli',
  'IN-GA': 'Goa', 'IN-GJ': 'Gujarat', 'IN-HP': 'Himachal Pradesh', 'IN-HR': 'Haryana',
  'IN-JH': 'Jharkhand', 'IN-JK': 'Jammu & Kashmir', 'IN-KA': 'Karnataka', 'IN-KL': 'Kerala',
  'IN-LA': 'Ladakh', 'IN-LD': 'Lakshadweep', 'IN-MH': 'Maharashtra', 'IN-ML': 'Meghalaya',
  'IN-MN': 'Manipur', 'IN-MP': 'Madhya Pradesh', 'IN-MZ': 'Mizoram', 'IN-NL': 'Nagaland',
  'IN-OR': 'Odisha', 'IN-PB': 'Punjab', 'IN-PY': 'Puducherry', 'IN-RJ': 'Rajasthan',
  'IN-SK': 'Sikkim', 'IN-TG': 'Telangana', 'IN-TN': 'Tamil Nadu', 'IN-TR': 'Tripura',
  'IN-UP': 'Uttar Pradesh', 'IN-UT': 'Uttarakhand', 'IN-WB': 'West Bengal',
};

// State-wise recycler data from CPCB (as on 08-06-2023)
const STATE_DATA: Record<string, { recyclers: number; capacity: number }> = {
  'Andhra Pradesh':    { recyclers: 10,  capacity: 44003 },
  'Assam':             { recyclers: 1,   capacity: 120 },
  'Chhattisgarh':      { recyclers: 2,   capacity: 6750 },
  'Delhi':             { recyclers: 6,   capacity: 1989 },
  'Goa':               { recyclers: 2,   capacity: 153 },
  'Gujarat':           { recyclers: 41,  capacity: 158605 },
  'Haryana':           { recyclers: 43,  capacity: 157188 },
  'Himachal Pradesh':  { recyclers: 2,   capacity: 1500 },
  'Jammu & Kashmir':   { recyclers: 3,   capacity: 705 },
  'Jharkhand':         { recyclers: 2,   capacity: 660 },
  'Karnataka':         { recyclers: 72,  capacity: 126015 },
  'Kerala':            { recyclers: 1,   capacity: 1200 },
  'Madhya Pradesh':    { recyclers: 3,   capacity: 13600 },
  'Maharashtra':       { recyclers: 140, capacity: 118032 },
  'Odisha':            { recyclers: 7,   capacity: 9050 },
  'Punjab':            { recyclers: 8,   capacity: 10092 },
  'Rajasthan':         { recyclers: 27,  capacity: 82008 },
  'Tamil Nadu':        { recyclers: 42,  capacity: 130636 },
  'Telangana':         { recyclers: 23,  capacity: 148115 },
  'Uttar Pradesh':     { recyclers: 121, capacity: 624219 },
  'Uttarakhand':       { recyclers: 8,   capacity: 153068 },
  'West Bengal':       { recyclers: 5,   capacity: 2640 },
};

function getStateColor(stateName: string): string {
  const data = STATE_DATA[stateName];
  if (!data) return '#3f3f46'; // zinc-700 — no recyclers
  const r = data.recyclers;
  if (r >= 40) return '#10b981'; // emerald-500
  if (r >= 20) return '#34d399'; // emerald-400
  if (r >= 5)  return '#38bdf8'; // sky-400
  return '#71717a';              // zinc-500
}

interface IndiaMapProps {
  onStateClick?: (stateName: string) => void;
  selectedState?: string | null;
  className?: string;
}

export default function IndiaMap({ onStateClick, selectedState, className = '' }: IndiaMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [paths, setPaths] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/india-states.json')
      .then(r => r.json())
      .then(data => { setPaths(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const svg = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - svg.left, y: e.clientY - svg.top - 10 });
  }, []);

  const hoveredData = hoveredState ? STATE_DATA[hoveredState] : null;
  const fmtNum = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-20 ${className}`}>
        <div className="text-sm text-zinc-500">Loading India map...</div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 612 632"
        className="w-full h-auto"
        onMouseMove={handleMouseMove}
      >
        {/* State paths — Survey of India boundaries, includes Ladakh UT + full claimed territory */}
        {Object.entries(paths).map(([code, d]) => {
          const name = CODE_TO_NAME[code];
          if (!name) return null;
          const isSelected = selectedState === name;
          const isHovered = hoveredState === name;
          const color = getStateColor(name);
          const data = STATE_DATA[name];

          return (
            <path
              key={code}
              d={d}
              fill={isSelected ? '#f59e0b' : isHovered ? '#fbbf24' : color}
              stroke="#27272a"
              strokeWidth={isHovered || isSelected ? 1.2 : 0.5}
              className="cursor-pointer transition-colors duration-150"
              opacity={isHovered || isSelected ? 1 : 0.85}
              onMouseEnter={() => setHoveredState(name)}
              onMouseLeave={() => setHoveredState(null)}
              onClick={() => onStateClick?.(name)}
              role="button"
              tabIndex={0}
              aria-label={`${name}: ${data ? data.recyclers : 0} recyclers`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onStateClick?.(name);
                }
              }}
            />
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredState && (
        <div
          className="absolute pointer-events-none z-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-lg"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="text-xs font-semibold text-white whitespace-nowrap">{hoveredState}</p>
          {hoveredData ? (
            <p className="text-[10px] text-zinc-400 whitespace-nowrap">
              {hoveredData.recyclers} recycler{hoveredData.recyclers !== 1 ? 's' : ''} &middot; {fmtNum(hoveredData.capacity)} MTA
            </p>
          ) : (
            <p className="text-[10px] text-zinc-500 whitespace-nowrap">No registered recyclers</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        {[
          { color: 'bg-emerald-500', label: '40+ recyclers' },
          { color: 'bg-emerald-400', label: '20–39' },
          { color: 'bg-sky-400', label: '5–19' },
          { color: 'bg-zinc-500', label: '1–4' },
          { color: 'bg-zinc-700', label: 'None' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
            <span className="text-[10px] text-zinc-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
