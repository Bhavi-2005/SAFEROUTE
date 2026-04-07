'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, MapPin, Loader2, ShieldAlert, Navigation } from 'lucide-react';
import { calculateDistance } from '@/lib/geo-utils';
import { RISK_ZONES, RiskZone } from '@/lib/risk-zones';
import { WarningBanner } from '@/components/WarningBanner';
import { RiskLegend } from '@/components/RiskLegend';

// Leaflet components MUST be dynamically imported with SSR disabled in Next.js
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
});
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });

/**
 * MapController handles map re-centering.
 * It is defined as a standard component to be rendered INSIDE MapContainer.
 * We dynamically import it to ensure useMap() is only called on the client.
 */
const MapController = ({ center }: { center: [number, number] | null }) => {
  const { useMap } = require('react-leaflet');
  const map = useMap();
  
  useEffect(() => {
    if (center && map) {
      map.setView(center, 16, { animate: true });
    }
  }, [center, map]);
  
  return null;
};

export default function SafeRouteApp() {
  const [mounted, setMounted] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [activeRisk, setActiveRisk] = useState<RiskZone | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [L, setL] = useState<any>(null);
  
  // Cooldown to prevent alert spam (15 seconds)
  const lastAlertTime = useRef<number>(0);
  const ALERT_COOLDOWN = 15000; 

  useEffect(() => {
    setMounted(true);
    // Dynamically import leaflet library for client-side usage (icons, etc.)
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  /**
   * Triggers the multi-modal alert: UI Banner, Voice TTS, and Haptic Vibration
   */
  const triggerAlert = useCallback((zone: RiskZone, distance: number) => {
    const now = Date.now();
    if (now - lastAlertTime.current < ALERT_COOLDOWN) return;

    // 1. Vibration (Haptic Feedback) - Works on supported mobile browsers
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([500, 200, 500]);
    }
    
    // 2. Voice Alert (Speech Synthesis)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const message = `Caution! approaching ${zone.type} zone in ${Math.round(distance)} meters. ${zone.description}`;
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }

    lastAlertTime.current = now;
  }, []);

  /**
   * Risk Detection Logic (Rule-based Safety Engine)
   * Runs whenever user location updates.
   */
  const checkRisk = useCallback((lat: number, lng: number) => {
    let closestZone: RiskZone | null = null;
    let minDistance = Infinity;

    RISK_ZONES.forEach(zone => {
      const d = calculateDistance(lat, lng, zone.lat, zone.lng);
      // Alert threshold: Within 400 meters AND high severity (>= 8)
      // This is a hybrid rule-based check that operates locally without network requirements
      if (d <= 400 && zone.severity >= 8 && d < minDistance) {
        minDistance = d;
        closestZone = zone;
      }
    });

    if (closestZone) {
      setActiveRisk(closestZone);
      setCurrentDistance(minDistance);
      triggerAlert(closestZone, minDistance);
    } else {
      setActiveRisk(null);
      setCurrentDistance(null);
    }
  }, [triggerAlert]);

  /**
   * GPS Tracking Initialization
   */
  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || !navigator.geolocation) return;

    // watchPosition provides continuous real-time updates as the user moves
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setUserPos([lat, lng]);
        setError(null);
        checkRisk(lat, lng);
      },
      (err) => {
        let errMsg = "Unable to lock GPS signal.";
        if (err.code === 1) errMsg = "Location access was denied. Please enable GPS.";
        else if (err.code === 2) errMsg = "GPS signal lost. Check your visibility to the sky.";
        else if (err.code === 3) errMsg = "GPS request timed out.";
        setError(errMsg);
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 0, 
        timeout: 10000 
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [mounted, checkRisk]);

  if (!mounted) return null;

  return (
    <div className="h-[100dvh] w-full flex flex-col relative overflow-hidden bg-slate-100 font-sans">
      
      {/* Real-time Proximity Warning Banner */}
      <WarningBanner 
        activeRisk={activeRisk} 
        distance={currentDistance} 
      />

      {/* App Branding */}
      <header className="absolute top-4 left-4 z-[1000] pointer-events-none">
        <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full border shadow-lg flex items-center gap-2 pointer-events-auto">
          <ShieldAlert className="w-5 h-5 text-primary" />
          <span className="font-bold text-slate-900 tracking-tight text-sm">SafeRoute AI</span>
        </div>
      </header>

      {/* Safety Reference Legend */}
      <div className="absolute bottom-24 left-4 z-[1000] pointer-events-none sm:block hidden">
        <div className="pointer-events-auto">
          <RiskLegend />
        </div>
      </div>

      {/* Interactive Safety Map */}
      <main className="flex-1 w-full relative">
        <MapContainer 
          center={[37.7749, -122.4194]} 
          zoom={14} 
          style={{ height: '100%', width: '100%' }} 
          zoomControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Static Risk Zones Visualization */}
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

          {/* User Location Marker with Dynamic Updates */}
          {userPos && L && (
            <>
              <Marker 
                position={userPos} 
                icon={L.divIcon({
                  className: 'user-marker-container',
                  html: `
                    <div class="relative flex h-10 w-10 items-center justify-center">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <div class="relative inline-flex rounded-full h-7 w-7 bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center">
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(45deg)">
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

        {/* GPS Permission/Error Overlay */}
        {error && (
          <div className="absolute inset-0 z-[3000] bg-white/95 backdrop-blur-md flex items-center justify-center p-8 text-center">
            <div className="max-w-xs space-y-4">
              <div className="bg-red-50 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                <MapPin className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 leading-tight">GPS Signal Required</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 active:scale-95 transition-transform"
              >
                Enable Tracking
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Footer Status Dashboard */}
      <footer className="h-24 bg-white border-t border-slate-100 px-6 flex items-center justify-between z-[1000] shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-4">
          <div className={`w-3.5 h-3.5 rounded-full ${userPos ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-slate-300'}`} />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Protection Status</span>
            <span className="text-sm font-bold text-slate-800">
              {userPos ? 'Active Live Tracking' : 'Initializing GPS...'}
            </span>
          </div>
        </div>
        
        <button 
          onClick={() => { if(userPos) setUserPos([...userPos]) }} // Trigger recenter
          className="bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-200 transition-colors"
        >
           <Navigation className={`w-6 h-6 ${activeRisk ? 'text-red-500' : 'text-slate-600'}`} />
        </button>
      </footer>
    </div>
  );
}
