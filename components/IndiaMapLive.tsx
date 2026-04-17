'use client';

import { MapContainer, TileLayer, WMSTileLayer, CircleMarker, Popup, LayersControl, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapPin } from './IndiaMap';

const PIN_COLOR: Record<string, string> = {
  'e-waste':       '#818cf8',
  'battery':       '#fbbf24',
  'black-mass':    '#22d3ee',
  'both':          '#34d399',
  'hazardous':     '#c084fc',
  'zinc-dross':    '#fb923c',
  'primary-metal': '#fb7185',
};

// India centre approx + nation-view zoom
const INDIA_CENTER: [number, number] = [22.5, 80.0];
const INDIA_ZOOM = 5;

interface Props {
  pins: MapPin[];
  className?: string;
  height?: string;
}

export default function IndiaMapLive({ pins, className = '', height = '560px' }: Props) {
  const valid = pins.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <MapContainer
        center={INDIA_CENTER}
        zoom={INDIA_ZOOM}
        minZoom={4}
        maxZoom={18}
        scrollWheelZoom
        zoomControl={false}
        style={{ width: '100%', height: '100%', background: '#0a0a0a', borderRadius: '0.75rem' }}
        worldCopyJump={false}
        maxBounds={[[-10, 50], [50, 105]]}
        maxBoundsViscosity={0.5}
      >
        <ZoomControl position="topright" />

        <LayersControl position="topleft">
          {/* Default: OpenStreetMap — unlimited, open data, free */}
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          {/* Esri World Imagery — global satellite, free with attribution */}
          <LayersControl.BaseLayer name="Satellite (Esri)">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          </LayersControl.BaseLayer>

          {/* Bhuvan India boundaries (ISRO / NRSC) — checked by DEFAULT.
              OSM / Esri / Carto base layers use international boundary
              interpretations that do not match the Government of India's
              official position on J&K, Ladakh, Aksai Chin, and Arunachal
              Pradesh. Overlaying this ISRO-served Survey-of-India layer
              on top renders the Indian government's official boundaries
              as the authoritative reference on this map. */}
          <LayersControl.Overlay checked name="🇮🇳 India boundaries — Survey of India / ISRO Bhuvan (official)">
            <WMSTileLayer
              url="https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms"
              layers="india3"
              format="image/png"
              transparent
              version="1.1.1"
              attribution='Boundaries &copy; <a href="https://bhuvan.nrsc.gov.in">Bhuvan &mdash; NRSC / ISRO</a> (Survey of India)'
              opacity={0.85}
            />
          </LayersControl.Overlay>

          {/* Carto dark — monochrome base fits the site's dark theme */}
          <LayersControl.BaseLayer name="Dark (Carto)">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors &copy; <a href="https://carto.com">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              maxZoom={20}
              subdomains="abcd"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Facility pins — real lat/lng, sub-metre accuracy */}
        {valid.map((p, idx) => {
          const color = PIN_COLOR[p.waste_type ?? ''] ?? '#d4d4d8';
          return (
            <CircleMarker
              key={p.id ?? idx}
              center={[p.lat, p.lng]}
              radius={4}
              pathOptions={{
                color: '#0a0a0a',
                weight: 0.8,
                fillColor: color,
                fillOpacity: 0.85,
              }}
            >
              <Popup>
                <div style={{ minWidth: '180px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: 4 }}>{p.label}</div>
                  {p.sub && <div style={{ fontSize: '11px', color: '#555' }}>{p.sub}</div>}
                  <div style={{ fontSize: '10px', color: '#888', marginTop: 4 }}>
                    {p.lat.toFixed(4)}°N, {p.lng.toFixed(4)}°E
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Border disclaimer — international base tiles (OSM, Esri, Carto)
          do NOT show Government of India's official boundaries; the
          Bhuvan/ISRO overlay (enabled by default) provides the authoritative
          Survey of India reference. */}
      <div className="absolute top-2 right-2 z-[1000] bg-amber-500/10 border border-amber-500/30 rounded-lg px-2 py-1 text-[10px] text-amber-300 backdrop-blur-sm max-w-[200px] leading-tight">
        Official India boundaries overlaid from <a href="https://bhuvan.nrsc.gov.in" className="underline" target="_blank" rel="noopener noreferrer">Bhuvan / ISRO</a> (Survey of India)
      </div>

      {/* Pin legend */}
      {valid.length > 0 && (
        <div className="absolute bottom-2 left-2 z-[1000] bg-zinc-900/90 border border-zinc-700 rounded-lg px-3 py-2 text-[10px] text-zinc-400 backdrop-blur-sm">
          <span className="text-zinc-500 mr-1">{valid.length} pins:</span>
          {[
            ['#818cf8', 'E-Waste'],
            ['#fbbf24', 'Battery (hydromet)'],
            ['#22d3ee', 'Black Mass / Mechanical'],
            ['#34d399', 'E-Waste + Battery'],
            ['#c084fc', 'Non-Ferrous'],
            ['#fb923c', 'Zinc Dross'],
            ['#fb7185', 'Primary Metal'],
          ].map(([hex, label]) => (
            <span key={label} className="inline-flex items-center gap-1 mr-2">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: hex }} />
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
