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

// Affine projection fitted to Survey of India polygon centroids (23 reference states).
// Max residual ~16 px on a 612x632 viewBox (<2.5% error). See MAP_CALIBRATION below.
// x = A*lng + B*lat + C   |   y = D*lng + E*lat + F
const PROJ = {
  xLng:  20.132165,
  xLat:  -0.180155,
  xC:   -1355.752301,
  yLng:  -0.160240,
  yLat: -20.764888,
  yC:   784.078530,
};

function project(lat: number, lng: number): [number, number] {
  return [
    PROJ.xLng * lng + PROJ.xLat * lat + PROJ.xC,
    PROJ.yLng * lng + PROJ.yLat * lat + PROJ.yC,
  ];
}

function getStateColor(recyclerCount: number): string {
  if (recyclerCount === 0) return '#3f3f46'; // zinc-700 — no recyclers
  const r = recyclerCount;
  if (r >= 40) return '#10b981'; // emerald-500
  if (r >= 20) return '#34d399'; // emerald-400
  if (r >= 5)  return '#38bdf8'; // sky-400
  return '#71717a';              // zinc-500
}

// Category → pin color (matches dashboard RecyclerList badges)
const PIN_COLOR: Record<string, string> = {
  'e-waste':       '#818cf8', // indigo-400
  'battery':       '#fbbf24', // amber-400
  'both':          '#34d399', // emerald-400
  'hazardous':     '#c084fc', // purple-400
  'zinc-dross':    '#fb923c', // orange-400
  'primary-metal': '#fb7185', // rose-400
};

export interface MapPin {
  id?: string;
  lat: number;
  lng: number;
  label: string;
  sub?: string;
  waste_type?: string;
}

interface IndiaMapProps {
  onStateClick?: (stateName: string) => void;
  selectedState?: string | null;
  className?: string;
  stateData?: Record<string, { recyclers: number; capacity: number }>;
  pins?: MapPin[];
  showPins?: boolean;
}

export default function IndiaMap({
  onStateClick,
  selectedState,
  className = '',
  stateData = {},
  pins = [],
  showPins = true,
}: IndiaMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [hoveredPin, setHoveredPin] = useState<MapPin | null>(null);
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

  const hoveredData = hoveredState ? stateData[hoveredState] : null;
  const fmtNum = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  // Pre-project pins (once per render)
  const projected = pins
    .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .map(p => {
      const [x, y] = project(p.lat, p.lng);
      return { ...p, x, y };
    });

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
          const data = stateData[name];
          const color = getStateColor(data?.recyclers ?? 0);

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

        {/* GPS pins — facility-level markers */}
        {showPins && projected.map((p, idx) => {
          const fill = PIN_COLOR[p.waste_type ?? ''] ?? '#d4d4d8';
          const isHover = hoveredPin === p;
          return (
            <g key={p.id ?? idx}>
              <circle
                cx={p.x} cy={p.y}
                r={isHover ? 4.5 : 2.8}
                fill={fill}
                fillOpacity={0.85}
                stroke="#0a0a0a"
                strokeWidth={0.6}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredPin(p)}
                onMouseLeave={() => setHoveredPin(null)}
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip — prioritise pin over state */}
      {hoveredPin ? (
        <div
          className="absolute pointer-events-none z-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-lg max-w-xs"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="text-xs font-semibold text-white">{hoveredPin.label}</p>
          {hoveredPin.sub && <p className="text-[10px] text-zinc-400 mt-0.5">{hoveredPin.sub}</p>}
          <p className="text-[10px] text-zinc-500 mt-0.5">
            {hoveredPin.lat.toFixed(4)}°N, {hoveredPin.lng.toFixed(4)}°E
          </p>
        </div>
      ) : hoveredState && (
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

      {/* Pin legend (only if pins present) */}
      {showPins && projected.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          <span className="text-[10px] text-zinc-600 mr-1">Facility pins ({projected.length}):</span>
          {[
            { hex: '#818cf8', label: 'E-Waste' },
            { hex: '#fbbf24', label: 'Battery' },
            { hex: '#34d399', label: 'E-Waste + Battery' },
            { hex: '#c084fc', label: 'Non-Ferrous' },
            { hex: '#fb923c', label: 'Zinc Dross' },
            { hex: '#fb7185', label: 'Primary Metal' },
          ].map(it => (
            <div key={it.label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: it.hex }} />
              <span className="text-[10px] text-zinc-500">{it.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/*
 * MAP_CALIBRATION — how the projection constants were fitted
 *
 * The SVG state paths are in a 612x632 viewBox (Survey of India, claimed territory).
 * A simple affine transform from (lat, lng) → (x, y) was fitted via ordinary least
 * squares using 23 reference states' geographic centroids (government-published
 * lat/lng) paired against the area-weighted polygon centroids of their SVG paths.
 *
 * Residuals: max ~16 px (Odisha, complex coastline); mean ~8 px. Good enough for
 * facility-scale pin placement at national zoom.
 *
 * If the SVG paths are ever regenerated from a different source / projection,
 * rerun the fit: compute polygon centroids per state code, pair with the real
 * lat/lng, and solve the 3x3 normal equations for each of {x, y}.
 */
