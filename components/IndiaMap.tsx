'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';

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
const PROJ = {
  xLng:  20.132165, xLat:  -0.180155, xC:   -1355.752301,
  yLng:  -0.160240, yLat: -20.764888, yC:    784.078530,
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
  state?: string;
}

// Reverse map: display name → ISO code so we can look up a pin's state polygon
const NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(CODE_TO_NAME).map(([code, name]) => [name, code])
);

// Parse an SVG path "M x,y L x,y L … Z" into an array of sub-polygons.
function parsePathPolygons(d: string): Array<Array<[number, number]>> {
  const subpaths: Array<Array<[number, number]>> = [];
  let current: Array<[number, number]> = [];
  const tokens = d.matchAll(/([MLZ])\s*(-?\d+(?:\.\d+)?)?\s*,?\s*(-?\d+(?:\.\d+)?)?/gi);
  for (const t of tokens) {
    const cmd = t[1].toUpperCase();
    if (cmd === 'M') {
      if (current.length) subpaths.push(current);
      current = [[parseFloat(t[2]), parseFloat(t[3])]];
    } else if (cmd === 'L') {
      current.push([parseFloat(t[2]), parseFloat(t[3])]);
    } else if (cmd === 'Z') {
      if (current.length) subpaths.push(current);
      current = [];
    }
  }
  if (current.length) subpaths.push(current);
  return subpaths.filter(p => p.length >= 3);
}

function pointInPolygon(x: number, y: number, poly: Array<[number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInAny(x: number, y: number, polys: Array<Array<[number, number]>>): boolean {
  for (const p of polys) if (pointInPolygon(x, y, p)) return true;
  return false;
}

// Distance² from a point to a line segment, and the nearest point on that segment.
function nearestOnSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): [number, number, number] {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return [cx, cy, (px - cx) ** 2 + (py - cy) ** 2];
}

// Snap a point to the nearest boundary of the polygon set (closest edge).
// Returns [x, y, distSq]. If already inside, returns the input unchanged with distSq=0.
function snapToPolygons(x: number, y: number, polys: Array<Array<[number, number]>>): [number, number, number] {
  if (pointInAny(x, y, polys)) return [x, y, 0];
  let best: [number, number, number] = [x, y, Infinity];
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const [ax, ay] = poly[i];
      const [bx, by] = poly[(i + 1) % poly.length];
      const [nx, ny, d2] = nearestOnSegment(x, y, ax, ay, bx, by);
      if (d2 < best[2]) best = [nx, ny, d2];
    }
  }
  // Nudge ~2 px inward from the boundary so the pin sits visibly inside, not on the line
  const d = Math.sqrt(best[2]);
  if (d > 0) {
    // push toward the polygon's own vicinity by moving toward the centre of the first polygon
    const cen = polyCentroid(polys[0]);
    const vx = cen[0] - best[0], vy = cen[1] - best[1];
    const vn = Math.sqrt(vx * vx + vy * vy) || 1;
    const push = 2;
    best[0] += (vx / vn) * push;
    best[1] += (vy / vn) * push;
  }
  return best;
}

function polyCentroid(poly: Array<[number, number]>): [number, number] {
  let a = 0, cx = 0, cy = 0;
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % n];
    const cross = x0 * y1 - x1 * y0;
    a += cross; cx += (x0 + x1) * cross; cy += (y0 + y1) * cross;
  }
  a /= 2;
  if (Math.abs(a) < 1e-6) return poly[0];
  return [cx / (6 * a), cy / (6 * a)];
}

// Base (un-zoomed) viewBox
const BASE_W = 612;
const BASE_H = 632;
const MIN_ZOOM = 1;
const MAX_ZOOM = 20;

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

  // zoom + pan state (viewBox top-left corner in base coords + scale)
  const [zoom, setZoom] = useState(1);
  const [viewX, setViewX] = useState(0);
  const [viewY, setViewY] = useState(0);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    fetch('/data/india-states.json')
      .then(r => r.json())
      .then(data => { setPaths(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Convert a client (mouse) point to SVG base coordinates given current viewBox
  const clientToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const vbW = BASE_W / zoom;
    const vbH = BASE_H / zoom;
    const fracX = (clientX - rect.left) / rect.width;
    const fracY = (clientY - rect.top) / rect.height;
    return { x: viewX + fracX * vbW, y: viewY + fracY * vbH };
  }, [zoom, viewX, viewY]);

  const clampView = useCallback((x: number, y: number, z: number) => {
    const vbW = BASE_W / z;
    const vbH = BASE_H / z;
    // Allow the viewBox to drift a bit past the edge so corners remain reachable,
    // but keep most of the map on-screen. A zero clamp at 1x, loosening at higher zoom.
    const slack = 0.15 * (z - 1) * BASE_W;
    const xMin = -slack;
    const xMax = BASE_W - vbW + slack;
    const yMin = -slack;
    const yMax = BASE_H - vbH + slack;
    return {
      x: Math.max(xMin, Math.min(xMax, x)),
      y: Math.max(yMin, Math.min(yMax, y)),
    };
  }, []);

  const zoomAt = useCallback((clientX: number, clientY: number, newZoom: number) => {
    const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    if (z === zoom) return;
    // Zoom toward the cursor: keep the svg-coord under the cursor fixed.
    const { x: cx, y: cy } = clientToSvg(clientX, clientY);
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const fracX = (clientX - rect.left) / rect.width;
    const fracY = (clientY - rect.top) / rect.height;
    const newVbW = BASE_W / z;
    const newVbH = BASE_H / z;
    const nx = cx - fracX * newVbW;
    const ny = cy - fracY * newVbH;
    const { x, y } = clampView(nx, ny, z);
    setZoom(z);
    setViewX(x);
    setViewY(y);
  }, [zoom, clientToSvg, clampView]);

  // Wheel zoom — passive:false required to call preventDefault on wheel
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
      zoomAt(e.clientX, e.clientY, zoom * factor);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [zoom, zoomAt]);

  const centerViewOnCenter = useCallback((z: number) => {
    const vbW = BASE_W / z;
    const vbH = BASE_H / z;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Keep the centre of the current view (or the true centre if reset).
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, z);
    void vbW; void vbH;
  }, [zoomAt]);

  const resetView = useCallback(() => {
    setZoom(1);
    setViewX(0);
    setViewY(0);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const svg = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - svg.left, y: e.clientY - svg.top - 10 });
    if (dragRef.current) {
      // Convert pixel delta → svg-coord delta
      const { x: x0, y: y0, vx, vy } = dragRef.current;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dxPix = e.clientX - x0;
      const dyPix = e.clientY - y0;
      const vbW = BASE_W / zoom;
      const vbH = BASE_H / zoom;
      const dx = (dxPix / rect.width) * vbW;
      const dy = (dyPix / rect.height) * vbH;
      const { x, y } = clampView(vx - dx, vy - dy, zoom);
      setViewX(x);
      setViewY(y);
    }
  }, [zoom, clampView]);

  const onPanStart = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragRef.current = { x: e.clientX, y: e.clientY, vx: viewX, vy: viewY };
    setIsPanning(true);
  }, [viewX, viewY]);

  const onPanEnd = useCallback(() => {
    dragRef.current = null;
    setIsPanning(false);
  }, []);

  const hoveredData = hoveredState ? stateData[hoveredState] : null;
  const fmtNum = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  // Per-state polygon set (cached after paths load).
  const statePolys = useMemo(() => {
    const out: Record<string, Array<Array<[number, number]>>> = {};
    for (const [code, d] of Object.entries(paths)) {
      out[code] = parsePathPolygons(d);
    }
    return out;
  }, [paths]);

  const projected = useMemo(() => pins
    .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .map(p => {
      const [rawX, rawY] = project(p.lat, p.lng);
      // If pin declares a state, snap into that state's polygon set when the
      // projected point falls outside (common for coastal facilities the
      // affine pushes into the ocean, and for Nominatim state-fallback hits).
      let x = rawX, y = rawY;
      let snapped = false;
      if (p.state) {
        const code = NAME_TO_CODE[p.state];
        const polys = code ? statePolys[code] : undefined;
        if (polys && polys.length) {
          const [sx, sy, d2] = snapToPolygons(rawX, rawY, polys);
          if (d2 > 0) { x = sx; y = sy; snapped = true; }
        }
      }
      return { ...p, x, y, snapped };
    }), [pins, statePolys]);

  // Scale strokes + pin sizes inversely with zoom so they stay visually constant
  const invZoom = 1 / zoom;
  const vbW = BASE_W / zoom;
  const vbH = BASE_H / zoom;
  const viewBox = `${viewX} ${viewY} ${vbW} ${vbH}`;

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
        ref={svgRef}
        viewBox={viewBox}
        className={`w-full h-auto select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseMove={handleMouseMove}
        onMouseDown={onPanStart}
        onMouseUp={onPanEnd}
        onMouseLeave={onPanEnd}
        onDoubleClick={(e) => zoomAt(e.clientX, e.clientY, zoom * 2)}
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
              strokeWidth={(isHovered || isSelected ? 1.2 : 0.5) * invZoom}
              className="transition-colors duration-150"
              style={{ cursor: isPanning ? 'grabbing' : 'pointer' }}
              opacity={isHovered || isSelected ? 1 : 0.85}
              onMouseEnter={() => setHoveredState(name)}
              onMouseLeave={() => setHoveredState(null)}
              onClick={(e) => { if (!isPanning) { e.stopPropagation(); onStateClick?.(name); } }}
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

        {/* GPS pins — facility-level markers (size stays visually constant with zoom) */}
        {showPins && projected.map((p, idx) => {
          const fill = PIN_COLOR[p.waste_type ?? ''] ?? '#d4d4d8';
          const isHover = hoveredPin === p;
          return (
            <g key={p.id ?? idx}>
              <circle
                cx={p.x} cy={p.y}
                r={(isHover ? 4.5 : 2.8) * invZoom}
                fill={fill}
                fillOpacity={0.85}
                stroke="#0a0a0a"
                strokeWidth={0.6 * invZoom}
                style={{ cursor: isPanning ? 'grabbing' : 'pointer' }}
                onMouseEnter={() => setHoveredPin(p)}
                onMouseLeave={() => setHoveredPin(null)}
              />
            </g>
          );
        })}
      </svg>

      {/* Zoom controls */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 z-20">
        <button
          onClick={() => {
            const rect = svgRef.current?.getBoundingClientRect();
            if (rect) zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, zoom * 1.5);
          }}
          disabled={zoom >= MAX_ZOOM}
          className="h-7 w-7 flex items-center justify-center rounded-md bg-zinc-800/90 border border-zinc-700 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300"
          aria-label="Zoom in"
          title="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            const rect = svgRef.current?.getBoundingClientRect();
            if (rect) zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, zoom / 1.5);
          }}
          disabled={zoom <= MIN_ZOOM}
          className="h-7 w-7 flex items-center justify-center rounded-md bg-zinc-800/90 border border-zinc-700 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300"
          aria-label="Zoom out"
          title="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={resetView}
          disabled={zoom === 1 && viewX === 0 && viewY === 0}
          className="h-7 w-7 flex items-center justify-center rounded-md bg-zinc-800/90 border border-zinc-700 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300"
          aria-label="Reset view"
          title="Reset view"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Zoom scale slider */}
      <div className="absolute bottom-16 right-2 w-7 h-28 flex flex-col items-center gap-1 z-20 pointer-events-none">
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.1}
          value={zoom}
          onChange={(e) => {
            const rect = svgRef.current?.getBoundingClientRect();
            if (rect) zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, Number(e.target.value));
          }}
          className="h-24 w-2 pointer-events-auto"
          style={{ writingMode: 'vertical-lr' as const, WebkitAppearance: 'slider-vertical' as any }}
          aria-label="Zoom scale"
        />
        <span className="text-[10px] font-mono tabular-nums text-zinc-500 bg-zinc-900/80 px-1 rounded pointer-events-auto">
          {zoom.toFixed(1)}×
        </span>
      </div>

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

      {/* Hint */}
      <p className="text-center text-[10px] text-zinc-600 mt-2">
        Scroll to zoom · drag to pan · double-click to zoom in
      </p>
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
