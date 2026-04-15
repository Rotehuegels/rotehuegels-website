'use client';

import { useState, useCallback } from 'react';

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
  'Orissa':            { recyclers: 7,   capacity: 9050 },
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

// Simplified India state paths (SVG)
// Each state is a path with an approximate boundary
const STATES: Array<{ name: string; d: string; labelX: number; labelY: number }> = [
  { name: 'Jammu & Kashmir', d: 'M180,30 L220,20 L260,30 L270,60 L260,80 L240,90 L220,85 L200,95 L185,80 L170,60 Z', labelX: 220, labelY: 55 },
  { name: 'Himachal Pradesh', d: 'M200,95 L220,85 L240,90 L250,100 L240,115 L220,115 L205,108 Z', labelX: 225, labelY: 103 },
  { name: 'Punjab', d: 'M175,100 L200,95 L205,108 L220,115 L215,130 L195,135 L175,125 Z', labelX: 195, labelY: 118 },
  { name: 'Uttarakhand', d: 'M240,90 L260,80 L280,85 L290,100 L275,115 L255,115 L240,115 L250,100 Z', labelX: 265, labelY: 100 },
  { name: 'Haryana', d: 'M175,125 L195,135 L215,130 L220,115 L240,115 L235,135 L225,145 L210,150 L190,148 L180,140 Z', labelX: 207, labelY: 138 },
  { name: 'Delhi', d: 'M210,150 L220,147 L225,155 L215,158 Z', labelX: 218, labelY: 153 },
  { name: 'Rajasthan', d: 'M100,150 L140,130 L175,125 L180,140 L190,148 L210,150 L215,175 L210,210 L195,240 L175,260 L140,255 L110,230 L90,200 L85,170 Z', labelX: 150, labelY: 195 },
  { name: 'Uttar Pradesh', d: 'M210,150 L225,145 L235,135 L255,115 L275,115 L290,100 L310,110 L330,120 L345,135 L350,160 L340,175 L325,190 L310,200 L290,210 L270,215 L250,220 L235,210 L220,200 L215,175 Z', labelX: 280, labelY: 165 },
  { name: 'Bihar', d: 'M345,135 L370,130 L395,140 L405,160 L395,175 L370,180 L350,175 L340,175 L350,160 Z', labelX: 375, labelY: 155 },
  { name: 'West Bengal', d: 'M395,140 L415,135 L425,150 L430,175 L425,200 L420,225 L415,250 L405,260 L395,245 L385,225 L380,200 L385,185 L395,175 L405,160 Z', labelX: 410, labelY: 195 },
  { name: 'Jharkhand', d: 'M340,175 L350,175 L370,180 L395,175 L385,185 L380,200 L370,210 L350,215 L335,205 L325,190 Z', labelX: 358, labelY: 195 },
  { name: 'Gujarat', d: 'M60,210 L85,170 L100,150 L110,180 L100,210 L115,240 L110,260 L130,275 L120,290 L100,295 L80,290 L60,275 L45,260 L35,240 L40,225 Z', labelX: 82, labelY: 250 },
  { name: 'Madhya Pradesh', d: 'M110,230 L140,255 L175,260 L195,240 L210,210 L235,210 L250,220 L270,215 L280,225 L280,250 L270,270 L250,280 L230,275 L210,280 L190,285 L170,280 L150,275 L130,275 L110,260 L115,240 Z', labelX: 200, labelY: 258 },
  { name: 'Chhattisgarh', d: 'M280,225 L310,200 L325,190 L335,205 L350,215 L355,235 L350,260 L335,275 L315,280 L300,275 L285,265 L280,250 Z', labelX: 315, labelY: 248 },
  { name: 'Orissa', d: 'M350,215 L370,210 L380,200 L385,225 L395,245 L390,265 L380,280 L365,290 L345,285 L330,280 L335,275 L350,260 L355,235 Z', labelX: 365, labelY: 255 },
  { name: 'Maharashtra', d: 'M80,290 L100,295 L120,290 L130,275 L150,275 L170,280 L190,285 L210,280 L230,300 L220,320 L210,340 L195,350 L175,345 L155,340 L130,335 L110,325 L95,310 Z', labelX: 160, labelY: 315 },
  { name: 'Telangana', d: 'M210,280 L230,275 L250,280 L270,270 L285,285 L285,310 L270,320 L250,325 L230,320 L220,305 L230,300 Z', labelX: 252, labelY: 300 },
  { name: 'Andhra Pradesh', d: 'M210,340 L220,320 L230,320 L250,325 L270,320 L285,310 L300,315 L310,330 L320,350 L315,370 L300,385 L280,395 L265,390 L250,380 L240,370 L230,360 L220,350 Z', labelX: 270, labelY: 355 },
  { name: 'Karnataka', d: 'M130,335 L155,340 L175,345 L195,350 L210,340 L220,350 L230,360 L225,380 L215,400 L200,410 L180,415 L160,405 L145,390 L130,370 L120,350 Z', labelX: 175, labelY: 378 },
  { name: 'Goa', d: 'M120,350 L130,350 L135,360 L130,370 L120,365 Z', labelX: 127, labelY: 360 },
  { name: 'Kerala', d: 'M160,405 L180,415 L190,430 L185,450 L175,465 L165,470 L155,460 L150,440 L148,425 L155,412 Z', labelX: 168, labelY: 442 },
  { name: 'Tamil Nadu', d: 'M180,415 L200,410 L215,400 L225,380 L240,370 L250,380 L255,395 L250,415 L240,435 L225,450 L210,455 L195,450 L185,450 L190,430 Z', labelX: 222, labelY: 420 },
  { name: 'Assam', d: 'M430,115 L450,105 L470,100 L490,105 L500,115 L490,125 L475,130 L460,135 L450,130 L440,125 Z', labelX: 465, labelY: 118 },
  { name: 'Meghalaya', d: 'M430,130 L450,130 L460,135 L455,145 L440,145 L430,140 Z', labelX: 445, labelY: 138 },
  { name: 'Manipur', d: 'M490,125 L505,125 L510,140 L505,150 L495,148 L488,138 Z', labelX: 500, labelY: 138 },
  { name: 'Mizoram', d: 'M488,148 L498,148 L505,155 L500,170 L490,175 L483,165 L480,155 Z', labelX: 493, labelY: 162 },
  { name: 'Tripura', d: 'M468,148 L480,145 L483,155 L480,165 L470,168 L465,160 Z', labelX: 473, labelY: 158 },
  { name: 'Nagaland', d: 'M500,115 L515,112 L520,125 L510,135 L505,125 Z', labelX: 510, labelY: 122 },
  { name: 'Arunachal Pradesh', d: 'M450,75 L475,65 L510,70 L530,80 L525,95 L515,105 L500,105 L490,100 L470,100 L455,95 L445,85 Z', labelX: 490, labelY: 88 },
  { name: 'Sikkim', d: 'M415,110 L425,105 L430,115 L425,120 L418,118 Z', labelX: 423, labelY: 113 },
  { name: 'Sikkim', d: '', labelX: 0, labelY: 0 }, // duplicate removed below
];

// Remove the duplicate Sikkim entry
const UNIQUE_STATES = STATES.filter((s, i) => i < STATES.length - 1);

interface IndiaMapProps {
  onStateClick?: (stateName: string) => void;
  selectedState?: string | null;
  className?: string;
}

export default function IndiaMap({ onStateClick, selectedState, className = '' }: IndiaMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const svg = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - svg.left, y: e.clientY - svg.top - 10 });
  }, []);

  const hoveredData = hoveredState ? STATE_DATA[hoveredState] : null;
  const fmtNum = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 560 500"
        className="w-full h-auto"
        onMouseMove={handleMouseMove}
      >
        {/* Background */}
        <rect width="560" height="500" fill="transparent" />

        {/* State paths */}
        {UNIQUE_STATES.map(state => {
          if (!state.d) return null;
          const isSelected = selectedState === state.name;
          const isHovered = hoveredState === state.name;
          const color = getStateColor(state.name);
          const data = STATE_DATA[state.name];

          return (
            <g key={state.name}>
              <path
                d={state.d}
                fill={isSelected ? '#f59e0b' : isHovered ? '#fbbf24' : color}
                stroke="#52525b"
                strokeWidth={isHovered || isSelected ? 1.5 : 0.8}
                className="cursor-pointer transition-all duration-150"
                opacity={isHovered || isSelected ? 1 : 0.85}
                onMouseEnter={() => setHoveredState(state.name)}
                onMouseLeave={() => setHoveredState(null)}
                onClick={() => onStateClick?.(state.name)}
                role="button"
                tabIndex={0}
                aria-label={`${state.name}: ${data ? data.recyclers : 0} recyclers`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onStateClick?.(state.name);
                  }
                }}
              />
              {/* State label for major states */}
              {data && data.recyclers >= 5 && (
                <text
                  x={state.labelX}
                  y={state.labelY}
                  textAnchor="middle"
                  fontSize={state.name.length > 12 ? 6 : 7}
                  fill="#fff"
                  fontWeight="600"
                  className="pointer-events-none select-none"
                  opacity={0.9}
                >
                  {data.recyclers}
                </text>
              )}
            </g>
          );
        })}

        {/* Title */}
        <text x="280" y="490" textAnchor="middle" fontSize="7" fill="#71717a" className="select-none">
          Click a state to view recyclers
        </text>
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
