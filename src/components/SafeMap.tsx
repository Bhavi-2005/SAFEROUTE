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
  html: `<div class="relative flex h-6 w-6">
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
    <span class="relative inline-flex rounded-full h-6 w-6 bg-primary border-4 border-white shadow-lg"></span>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapRecenter({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng]);
    }
  }, [position, map]);
  return null;
}

interface SafeMapProps {
  userPosition: { lat: number; lng: number } | null;
}

export default function SafeMap({ userPosition }: SafeMapProps) {
  const initialPosition = userPosition || { lat: 37.7749, lng: -122.4194 };

  return (
    <MapContainer 
      center={[initialPosition.lat, initialPosition.lng]} 
      zoom={14} 
      scrollWheelZoom={true}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Risk Zones */}
      {RISK_ZONES.map((zone) => (
        <Circle
          key={zone.id}
          center={[zone.lat, zone.lng]}
          pathOptions={{
            fillColor: zone.level === 'high' ? 'hsl(var(--destructive))' : 'hsl(var(--warning))',
            color: zone.level === 'high' ? 'hsl(var(--destructive))' : 'hsl(var(--warning))',
            fillOpacity: 0.35,
            weight: 2
          }}
          radius={zone.radius}
        >
          <Popup>
            <div className="p-1">
              <p className="font-bold m-0">{zone.type}</p>
              <p className="text-xs text-muted-foreground mt-1">{zone.description}</p>
            </div>
          </Popup>
        </Circle>
      ))}

      {/* User Marker */}
      {userPosition && (
        <>
          <Marker position={[userPosition.lat, userPosition.lng]} icon={UserIcon} />
          <MapRecenter position={userPosition} />
        </>
      )}
    </MapContainer>
  );
}
