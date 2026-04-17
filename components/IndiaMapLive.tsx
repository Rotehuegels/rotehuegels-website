'use client';

import { MapContainer, TileLayer, WMSTileLayer, Marker, Popup, LayersControl, ZoomControl, GeoJSON } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { useEffect, useState, useMemo } from 'react';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
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

// Build a compact dot icon per category, cached per colour.
const iconCache = new Map<string, L.DivIcon>();
function dotIcon(color: string): L.DivIcon {
  const hit = iconCache.get(color);
  if (hit) return hit;
  const icon = L.divIcon({
    className: 'recycler-pin',
    html: `<span style="display:block;width:10px;height:10px;border-radius:50%;background:${color};border:1px solid #0a0a0a;box-shadow:0 0 2px rgba(0,0,0,.4);"></span>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
  iconCache.set(color, icon);
  return icon;
}

// Cluster icon — scales and colors by child count
// (L.MarkerCluster type isn't exported by the core leaflet types; accept any.)
function clusterIconFactory(cluster: { getChildCount: () => number }): L.DivIcon {
  const n = cluster.getChildCount();
  const size = n < 10 ? 28 : n < 50 ? 34 : n < 200 ? 40 : 48;
  const bg = n < 10 ? '#34d399' : n < 50 ? '#38bdf8' : n < 200 ? '#a78bfa' : '#fb7185';
  return L.divIcon({
    html: `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:${bg};color:#0a0a0a;font-weight:700;font-size:${size >= 40 ? 13 : 12}px;border:2px solid #0a0a0a;box-shadow:0 0 6px rgba(0,0,0,.45);">${n}</div>`,
    className: 'recycler-cluster',
    iconSize: [size, size],
  });
}

// India centre approx + nation-view zoom
const INDIA_CENTER: [number, number] = [22.5, 80.0];
const INDIA_ZOOM = 5;

function choroplethColor(n: number): string {
  if (n === 0) return '#3f3f46';   // zinc-700
  if (n >= 100) return '#065f46';  // emerald-800
  if (n >= 40)  return '#047857';  // emerald-700
  if (n >= 20)  return '#059669';  // emerald-600
  if (n >= 10)  return '#0891b2';  // cyan-600
  if (n >= 5)   return '#0e7490';  // cyan-700
  return '#52525b';                 // zinc-600
}

interface Props {
  pins: MapPin[];
  className?: string;
  height?: string;
  stateData?: Record<string, { recyclers: number; capacity: number }>;
}

export default function IndiaMapLive({ pins, className = '', height = '560px', stateData = {} }: Props) {
  const valid = pins.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  const [geo, setGeo] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    fetch('/data/india-states-leaflet.geojson')
      .then(r => r.json())
      .then(setGeo)
      .catch(() => setGeo(null));
  }, []);

  const styleFeature = useMemo(() => (feature?: Feature<Geometry, { name?: string }>) => {
    const name = feature?.properties?.name ?? '';
    const n = stateData[name]?.recyclers ?? 0;
    return {
      fillColor: choroplethColor(n),
      fillOpacity: 0.42,
      color: '#27272a',
      weight: 0.8,
    };
  }, [stateData]);

  const onEach = useMemo(() => (feature: Feature, layer: L.Layer) => {
    const name = (feature.properties as { name?: string })?.name ?? '?';
    const data = stateData[name];
    const count = data?.recyclers ?? 0;
    const cap = data?.capacity ?? 0;
    const html = `<div style="min-width:160px"><div style="font-weight:600;font-size:13px;margin-bottom:2px">${name}</div><div style="font-size:11px;color:#555">${count} facilit${count !== 1 ? 'ies' : 'y'} · ${cap.toLocaleString('en-IN')} MTA capacity</div></div>`;
    (layer as L.Layer & { bindTooltip: (html: string, opts: L.TooltipOptions) => unknown }).bindTooltip(html, { sticky: true, direction: 'top', offset: [0, -6] });
  }, [stateData]);

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
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Satellite (Esri)">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          </LayersControl.BaseLayer>

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

          {geo && (
            <LayersControl.Overlay name="State choropleth (by recycler count)">
              <GeoJSON data={geo} style={styleFeature as unknown as L.StyleFunction} onEachFeature={onEach} />
            </LayersControl.Overlay>
          )}

          <LayersControl.BaseLayer name="Dark (Carto)">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors &copy; <a href="https://carto.com">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              maxZoom={20}
              subdomains="abcd"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Facility pins — clustered at lower zoom levels for performance */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={40}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          iconCreateFunction={clusterIconFactory}
        >
          {valid.map((p, idx) => {
            const color = PIN_COLOR[p.waste_type ?? ''] ?? '#d4d4d8';
            return (
              <Marker
                key={p.id ?? idx}
                position={[p.lat, p.lng]}
                icon={dotIcon(color)}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: 4 }}>{p.label}</div>
                    {p.sub && <div style={{ fontSize: '11px', color: '#555' }}>{p.sub}</div>}
                    <div style={{ fontSize: '10px', color: '#888', marginTop: 4 }}>
                      {p.lat.toFixed(4)}°N, {p.lng.toFixed(4)}°E
                    </div>
                    {p.code && (
                      <a href={`/recycling/recyclers/${p.code}`}
                         style={{ display: 'inline-block', marginTop: 8, padding: '4px 10px', background: '#10b981', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: 500, textDecoration: 'none' }}>
                        View profile →
                      </a>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Border disclaimer */}
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
