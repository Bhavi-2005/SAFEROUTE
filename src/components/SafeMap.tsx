'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import { RISK_ZONES } from '@/lib/risk-zones';

// Fix Leaflet marker icon issue in Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// User position icon (custom blue dot)
const UserIcon = L.divIcon({
  className: 'user-marker',
  html: `<div class="relative flex h-8 w-8">
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
    <span class="relative inline-flex rounded-full h-8 w-8 bg-blue-600 border-4 border-white shadow-xl"></span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function MapController({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();
  
  useEffect(() => {
    const handleRecenter = (e: any) => {
      if (e.detail) {
        map.setView([e.detail.lat, e.detail.lng], 16, { animate: true });
      }
    };
    
    window.addEventListener('map-recenter', handleRecenter);
    
    // Initial centering
    if (position) {
      map.setView([position.lat, position.lng], 15);
    }
    
    return () => window.removeEventListener('map-recenter', handleRecenter);
  }, [position, map]);
  
  return null;
}

interface SafeMapProps {
  userPosition: { lat: number; lng: number } | null;
}

export default function SafeMap({ userPosition }: SafeMapProps) {
  // Center of US if no position
  const initialPosition = userPosition || { lat: 37.7749, lng: -122.4194 };

  return (
    <MapContainer 
      center={[initialPosition.lat, initialPosition.lng]} 
      zoom={14} 
      zoomControl={false}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Risk Zones Rendering */}
      {RISK_ZONES.map((zone) => (
        <Circle
          key={zone.id}
          center={[zone.lat, zone.lng]}
          pathOptions={{
            fillColor: zone.level === 'high' ? '#ef4444' : '#f59e0b',
            color: zone.level === 'high' ? '#dc2626' : '#d97706',
            fillOpacity: 0.3,
            weight: 2
          }}
          radius={zone.radius}
        >
          <Popup>
            <div className="p-2">
              <p className="font-bold text-slate-900 m-0">{zone.type}</p>
              <p className="text-xs text-slate-500 mt-1">{zone.description}</p>
            </div>
          </Popup>
        </Circle>
      ))}

      {/* User Current Location */}
      {userPosition && (
        <>
          <Marker position={[userPosition.lat, userPosition.lng]} icon={UserIcon} />
          <MapController position={userPosition} />
        </>
      )}
    </MapContainer>
  );
}
