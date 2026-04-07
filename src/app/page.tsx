'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, Navigation, MapPin, Loader2, ShieldAlert } from 'lucide-react';
import { calculateDistance } from '@/lib/geo-utils';
import { RISK_ZONES, RiskZone } from '@/lib/risk-zones';
import { WarningBanner } from '@/components/WarningBanner';
import { RiskLegend } from '@/components/RiskLegend';

// Leaflet dynamic imports for Next.js Client Component compatibility
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
});
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });
const useMap = dynamic(() => import('react-leaflet').then(mod => mod.useMap), { ssr: false });

/**
 * Component to handle map re-centering when user moves
 */
function MapController({ center }: { center: [number, number] }) {
  const map = (useMap as any)();
  useEffect(() => {
    if (center) map.setView(center, 16, { animate: true });
  }, [center, map]);
  return null;
}

export default function SafeRouteApp() {
  const [mounted, setMounted] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [activeRisk, setActiveRisk] = useState<RiskZone | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Cooldown to prevent alert spam (15 seconds)
  const lastAlertTime = useRef<number>(0);
  const ALERT_COOLDOWN = 15000; 

  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Triggers the multi-modal alert: UI, Voice, and Vibration
   */
  const triggerAlert = useCallback((zone: RiskZone, distance: number) => {
    const now = Date.now();
    if (now - lastAlertTime.current < ALERT_COOLDOWN) return;

    // 1. Vibration (Haptic Feedback)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([400, 200, 400]);
    }
    
    // 2. Voice Alert (Text-to-Speech)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const message = `Warning! ${zone.level} risk zone ahead in ${Math.round(distance)} meters. ${zone.description}`;
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }

    lastAlertTime.current = now;
  }, []);

  /**
   * Core tracking logic using navigator.geolocation.watchPosition
   */
  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setUserPos([lat, lng]);
        setError(null);

        let closestZone: RiskZone | null = null;
        let minDistance = Infinity;

        // Risk Detection Logic (CRITICAL)
        // Check distance to all hardcoded zones
        RISK_ZONES.forEach(zone => {
          const d = calculateDistance(lat, lng, zone.lat, zone.lng);
          // Alert within 400m threshold
          if (d <= 400 && d < minDistance) {
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
      },
      (err) => {
        let errMsg = "Unable to access GPS.";
        if (err.code === 1) errMsg = "Location permission denied.";
        else if (err.code === 2) errMsg = "GPS signal lost.";
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
  }, [mounted, triggerAlert]);

  if (!mounted) return null;

  return (
    <div className="h-[100dvh] w-full flex flex-col relative overflow-hidden bg-slate-100 font-sans">
      
      {/* 4. Alert System: Top Warning Banner */}
      <WarningBanner 
        activeRisk={activeRisk} 
        distance={currentDistance} 
      />

      {/* Header / Logo */}
      <header className="absolute top-4 left-4 z-[1000] pointer-events-none">
        <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full border shadow-lg flex items-center gap-2 pointer-events-auto">
          <ShieldAlert className="w-5 h-5 text-primary" />
          <span className="font-bold text-slate-900 tracking-tight text-sm">SafeRoute AI</span>
        </div>
      </header>

      {/* 5. UI Improvements: Risk Legend */}
      <div className="absolute bottom-24 left-4 z-[1000]">
        <RiskLegend />
      </div>

      {/* Main Map Content */}
      <main className="flex-1 w-full relative">
        <MapContainer 
          center={[37.7749, -122.4194]} 
          zoom={14} 
          style={{ height: '100%', width: '100%' }} 
          zoomControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* 2. Risk Zones Rendering */}
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

          {/* 1. GPS Tracking: User Marker */}
          {userPos && (
            <>
              <Marker 
                position={userPos} 
                icon={new (window as any).L.DivIcon({
                  className: 'user-marker-container',
                  html: `
                    <div class="relative flex h-10 w-10 items-center justify-center">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <div class="relative inline-flex rounded-full h-6 w-6 bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center">
                        <Navigation className="w-3 h-3 text-white fill-white" style="transform: rotate(45deg)" />
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

        {/* GPS Error State */}
        {error && (
          <div className="absolute inset-0 z-[3000] bg-white/95 backdrop-blur-md flex items-center justify-center p-8 text-center">
            <div className="max-w-xs space-y-4">
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <MapPin className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">GPS Signal Required</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/30 transition-active"
              >
                Retry GPS Connection
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Status Bar */}
      <footer className="h-20 bg-white border-t border-slate-200 px-6 flex items-center justify-between z-[1000] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${userPos ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-300'}`} />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Status</span>
            <span className="text-xs font-bold text-slate-700 tracking-tight">
              {userPos ? 'Active Protection' : 'Searching for GPS...'}
            </span>
          </div>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
           <AlertTriangle className={`w-5 h-5 ${activeRisk ? 'text-red-500 animate-pulse' : 'text-slate-300'}`} />
        </div>
      </footer>
    </div>
  );
}
