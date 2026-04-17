'use client';

import { MapContainer, TileLayer, WMSTileLayer, CircleMarker, Popup, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  lat: number;
  lng: number;
  label: string;
  zoom?: number;
  height?: string;
}

export default function RecyclerMiniMap({ lat, lng, label, zoom = 12, height = '320px' }: Props) {
  return (
    <div style={{ width: '100%', height, borderRadius: '0.75rem', overflow: 'hidden' }}>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%', background: '#0a0a0a' }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution='Tiles &copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          </LayersControl.BaseLayer>
          <LayersControl.Overlay checked name="India boundaries (ISRO)">
            <WMSTileLayer
              url="https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms"
              layers="india3"
              format="image/png"
              transparent
              version="1.1.1"
              attribution='&copy; Bhuvan / NRSC / ISRO'
              opacity={0.7}
            />
          </LayersControl.Overlay>
        </LayersControl>

        <CircleMarker
          center={[lat, lng]}
          radius={8}
          pathOptions={{
            color: '#0a0a0a',
            weight: 1,
            fillColor: '#10b981',
            fillOpacity: 0.85,
          }}
        >
          <Popup>
            <div style={{ fontWeight: 600, fontSize: '12px' }}>{label}</div>
            <div style={{ fontSize: '10px', color: '#666', marginTop: 2 }}>
              {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
            </div>
          </Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
