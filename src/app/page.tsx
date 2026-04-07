'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Shield, AlertTriangle, Navigation, Volume2, Info, Loader2 } from 'lucide-react';

// Leaflet dynamic imports for Next.js Client Component compatibility
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center"><Loader2 className="animate-spin" /></div>
});
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const useMap = dynamic(() => import('react-leaflet').then(mod => mod.useMap), { ssr: false });

/**
 * UTILS: Haversine distance formula (Rule-based tracking)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * DATA: Hardcoded Risk Zones
 */
const RISK_ZONES = [
  { id: 1, lat: 37.7749, lng: -122.4194, name: "Market St Crossing", type: "High Risk", desc: "Frequent blind-spot incidents.", color: "#ef4444" },
  { id: 2, lat: 37.7833, lng: -122.4167, name: "Tenderloin Corner", type: "Medium Risk", desc: "Heavy pedestrian traffic.", color: "#f59e0b" },
  { id: 3, lat: 37.7694, lng: -122.4862, name: "Sunset Hwy Curve", type: "High Risk", desc: "Dangerous sharp turn ahead.", color: "#ef4444" }
];

/**
 * COMPONENT: Map Controller for auto-recentering
 */
function MapController({ center }: { center: [number, number] }) {
  const map = (useMap as any)();
  useEffect(() => {
    if (center) map.setView(center, 16, { animate: true });
  }, [center, map]);
  return null;
}

export default function SafeRouteApp() {
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastAlertTime = useRef(0);

  /**
   * ALERT LOGIC: Trigger Voice and Vibration
   */
  const triggerAlert = useCallback((zone: any, dist: number) => {
    const now = Date.now();
    // 10 second cooldown to prevent alert spam
    if (now - lastAlertTime.current > 10000) {
      // 1. Vibration (Mobile support)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([400, 200, 400]);
      }
      // 2. Voice Synthesis
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(
          `Alert. Approaching ${zone.name}. Hazard detected ${Math.round(dist)} meters ahead.`
        );
        window.speechSynthesis.speak(utterance);
      }
      lastAlertTime.current = now;
    }
  }, []);

  /**
   * GPS TRACKING: Rule-based proximity detection
   */
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setPos([lat, lng]);

        let closestZone = null;
        let minDistance = Infinity;

        // Rule-based check against hardcoded zones
        RISK_ZONES.forEach(zone => {
          const d = calculateDistance(lat, lng, zone.lat, zone.lng);
          if (d <= 400 && d < minDistance) {
            minDistance = d;
            closestZone = zone;
          }
        });

        if (closestZone) {
          setActiveAlert(closestZone);
          setDistance(minDistance);
          triggerAlert(closestZone, minDistance);
        } else {
          setActiveAlert(null);
          setDistance(null);
        }
      },
      (err) => {
        setError(err.message === "User denied Geolocation" ? "Please enable GPS access." : err.message);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [triggerAlert]);

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-slate-50 relative overflow-hidden font-sans">
      {/* UI: Emergency Alert Banner */}
      {activeAlert && (
        <div className={`fixed top-4 left-4 right-4 z-[2000] p-4 rounded-2xl shadow-2xl flex items-start gap-4 animate-in slide-in-from-top duration-300 ${activeAlert.color === '#ef4444' ? 'bg-red-600' : 'bg-amber-500'} text-white border border-white/20`}>
          <div className="bg-white/20 p-2 rounded-xl">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <h2 className="font-black text-lg uppercase leading-none tracking-tighter">{activeAlert.name}</h2>
              <span className="font-mono font-bold text-sm bg-black/20 px-2 py-1 rounded-md">{Math.round(distance || 0)}m</span>
            </div>
            <p className="text-sm font-medium opacity-90">{activeAlert.type}: {activeAlert.desc}</p>
          </div>
        </div>
      )}

      {/* UI: App Header */}
      <header className="absolute top-4 left-4 z-[1000] pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border shadow-lg flex items-center gap-2 pointer-events-auto">
          <Shield className="w-5 h-5 text-blue-600 fill-blue-600/10" />
          <span className="font-black text-slate-800 tracking-tight text-sm">SafeRoute AI</span>
        </div>
      </header>

      {/* UI: Map Container */}
      <main className="flex-1 w-full relative">
        {typeof window !== 'undefined' && (
          <MapContainer 
            center={[37.7749, -122.4194]} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }} 
            zoomControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {/* Draw Risk Zones */}
            {RISK_ZONES.map(z => (
              <Circle 
                key={z.id} 
                center={[z.lat, z.lng]} 
                radius={400} 
                pathOptions={{ fillColor: z.color, color: z.color, fillOpacity: 0.2, weight: 2 }}
              >
                <Popup>
                  <div className="p-1 font-sans">
                    <p className="font-bold text-slate-900 m-0">{z.name}</p>
                    <p className="text-xs text-slate-500 m-0">{z.type}</p>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* Draw User Marker */}
            {pos && (
              <>
                <Marker 
                  position={pos} 
                  icon={new (window as any).L.DivIcon({
                    className: 'user-marker',
                    html: '<div class="relative flex h-8 w-8"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><div class="relative inline-flex rounded-full h-8 w-8 bg-blue-600 border-4 border-white shadow-xl"></div></div>',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                  })} 
                />
                <MapController center={pos} />
              </>
            )}
          </MapContainer>
        )}

        {/* UI: Error Overlay */}
        {error && (
          <div className="absolute inset-0 z-[3000] bg-white/90 backdrop-blur-sm flex items-center justify-center p-6 text-center">
            <div className="bg-white p-8 rounded-3xl border shadow-2xl max-w-sm">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <Info className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Location Required</h3>
              <p className="text-slate-500 mb-8">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform"
              >
                Retry GPS Connection
              </button>
            </div>
          </div>
        )}
      </main>

      {/* UI: Footer Branding / Status */}
      <footer className="h-24 bg-white border-t p-6 flex items-center justify-between z-[1000]">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Protection</span>
          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${pos ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
            {pos ? 'GPS Track Active' : 'Searching for Satellites...'}
          </span>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feedback</span>
            <div className="flex gap-2 justify-end mt-1">
              <Volume2 className={`w-4 h-4 ${activeAlert ? 'text-blue-600' : 'text-slate-300'}`} />
              <Navigation className={`w-4 h-4 ${pos ? 'text-blue-600' : 'text-slate-300'}`} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
