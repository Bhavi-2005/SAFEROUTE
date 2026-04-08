'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, Popup } from 'react-leaflet';
import { RISK_ZONES, RiskZone } from '@/lib/risk-zones';

/**
 * Handles map re-centering when user position changes.
 * This component is only used inside MapContainer.
 */
function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && map) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  
  return null;
}

interface SafeMapProps {
  userPos: [number, number] | null;
  activeRisk: RiskZone | null;
}

export default function SafeMap({ userPos, activeRisk }: SafeMapProps) {
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    // Dynamic import Leaflet only on the client
    import('leaflet').then((leaflet) => {
      const leafletLib = leaflet.default;
      // Fix default marker icons
      delete (leafletLib.Icon.Default.prototype as any)._getIconUrl;
      leafletLib.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setL(leafletLib);
    });
  }, []);

  if (!L) return null;

  return (
    <MapContainer 
      center={[37.7749, -122.4194]} 
      zoom={14} 
      style={{ height: '100%', width: '100%' }} 
      zoomControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {/* Risk Zones Rendering */}
      {RISK_ZONES.map(z => (
        <Circle 
          key={z.id} 
          center={[z.lat, z.lng]} 
          radius={z.radius} 
          pathOptions={{ 
            fillColor: z.level === 'high' ? '#ef4444' : '#f59e0b', 
            color: z.level === 'high' ? '#ef4444' : '#f59e0b', 
            fillOpacity: 0.3, 
            weight: 2 
          }}
        />
      ))}

      {/* User Location with Pulsing Marker */}
      {userPos && (
        <>
          <Marker 
            position={userPos} 
            icon={L.divIcon({
              className: 'user-marker-container',
              html: `
                <div class="relative flex h-10 w-10 items-center justify-center">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <div class="relative rounded-full h-7 w-7 bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg)">
                      <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
                    </svg>
                  </div>
                </div>
              `,
              iconSize: [40, 40],
              iconAnchor: [20, 20]
            })} 
          />
          <MapController center={userPos} />
        </>
      )}
    </MapContainer>
  );
}
