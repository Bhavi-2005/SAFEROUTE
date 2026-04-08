'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ShieldAlert, Loader2, Navigation, MapPin } from 'lucide-react';
import { calculateDistance } from '@/lib/geo-utils';
import { RISK_ZONES, RiskZone } from '@/lib/risk-zones';
import { WarningBanner } from '@/components/WarningBanner';
import { RiskLegend } from '@/components/RiskLegend';

// Leaflet components MUST be dynamically imported with SSR disabled
const SafeMap = dynamic(() => import('@/components/SafeMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
        <span className="text-sm font-medium text-slate-500">Initializing Safety Systems...</span>
      </div>
    </div>
  )
});

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

    // 1. Vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([500, 200, 500]);
    }
    
    // 2. Voice Alert
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const message = `Warning! High risk ${zone.type} ahead in ${Math.round(distance)} meters. ${zone.description}`;
      const utterance = new SpeechSynthesisUtterance(message);
      window.speechSynthesis.speak(utterance);
    }

    lastAlertTime.current = now;
  }, []);

  /**
   * Risk Detection Logic
   * Alert Threshold: < 400 meters AND Severity >= 8
   */
  const checkRisk = useCallback((lat: number, lng: number) => {
    let closestZone: RiskZone | null = null;
    let minDistance = Infinity;

    RISK_ZONES.forEach(zone => {
      const d = calculateDistance(lat, lng, zone.lat, zone.lng);
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
   * Continuous GPS Tracking
   */
  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setUserPos([lat, lng]);
        setError(null);
        checkRisk(lat, lng);
      },
      (err) => {
        let errMsg = "GPS tracking failed.";
        if (err.code === 1) errMsg = "Location access denied. Please allow GPS.";
        else if (err.code === 2) errMsg = "GPS signal lost.";
        setError(errMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [mounted, checkRisk]);

  if (!mounted) return null;

  return (
    <div className="h-[100dvh] w-full flex flex-col relative overflow-hidden bg-slate-100 antialiased font-sans">
      
      {/* Real-time Warning Banner */}
      <WarningBanner activeRisk={activeRisk} distance={currentDistance} />

      {/* Header Branding */}
      <header className="absolute top-4 left-4 z-[1000]">
        <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border shadow-lg flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          <span className="font-bold text-slate-900 text-sm">SafeRoute AI</span>
        </div>
      </header>

      {/* Risk Map */}
      <main className="flex-1 w-full relative">
        <SafeMap userPos={userPos} activeRisk={activeRisk} />

        {/* Legend */}
        <div className="absolute bottom-28 left-4 z-[1000] hidden sm:block">
          <RiskLegend />
        </div>

        {/* GPS Error Overlay */}
        {error && (
          <div className="absolute inset-0 z-[3000] bg-white/95 backdrop-blur-md flex items-center justify-center p-8 text-center">
            <div className="max-w-xs space-y-4">
              <div className="bg-red-50 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                <MapPin className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">GPS Required</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform"
              >
                Enable Tracking
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Dashboard Footer */}
      <footer className="h-24 bg-white border-t border-slate-100 px-6 flex items-center justify-between z-[1000]">
        <div className="flex items-center gap-4">
          <div className={`w-3.5 h-3.5 rounded-full ${userPos ? 'bg-green-500 animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'bg-slate-300'}`} />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protection</span>
            <span className="text-sm font-bold text-slate-800">
              {userPos ? 'Active Tracking' : 'Initializing...'}
            </span>
          </div>
        </div>
        
        <button 
          onClick={() => { if(userPos) setUserPos([...userPos]) }} 
          className="bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-200 transition-colors"
        >
           <Navigation className={`w-6 h-6 ${activeRisk ? 'text-red-500' : 'text-slate-600'}`} />
        </button>
      </footer>
    </div>
  );
}
