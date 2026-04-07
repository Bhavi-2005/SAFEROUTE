'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Shield, AlertTriangle, Navigation, Volume2, Info, Loader2, LogIn, User, Settings, WifiOff, Zap } from 'lucide-react';
import { useFirebase, useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, collection, serverTimestamp } from 'firebase/firestore';
import { contextualRiskWarning } from '@/ai/flows/contextual-risk-warning';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
 * UTILS: Haversine distance formula
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
 * DATA: Hardcoded Risk Zones (Offline Fallback)
 */
const RISK_ZONES = [
  { id: '1', lat: 37.7749, lng: -122.4194, name: "Market St Crossing", type: "Pedestrian Safety", desc: "High blind-spot risk.", level: "high" as const, color: "#ef4444" },
  { id: '2', lat: 37.7833, lng: -122.4167, name: "Tenderloin Corner", type: "High Traffic", desc: "Dense congestion area.", level: "medium" as const, color: "#f59e0b" },
  { id: '3', lat: 37.7694, lng: -122.4862, name: "Sunset Hwy Curve", type: "Road Hazard", desc: "Dangerous sharp turn.", level: "high" as const, color: "#ef4444" }
];

function MapController({ center }: { center: [number, number] }) {
  const map = (useMap as any)();
  useEffect(() => {
    if (center) map.setView(center, 16, { animate: true });
  }, [center, map]);
  return null;
}

export default function SafeRouteApp() {
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiGuidance, setAiGuidance] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  
  const lastAlertTime = useRef(0);
  const isGeneratingAI = useRef(false);

  // Load Preferences
  const prefRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'preferences', 'default') : null, [firestore, user]);
  const { data: preferences } = useDoc(prefRef);

  useEffect(() => {
    setMounted(true);
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const triggerAlert = useCallback(async (zone: any, dist: number) => {
    const now = Date.now();
    // 15 second cooldown for heavy actions
    if (now - lastAlertTime.current > 15000) {
      // 1. Haptic
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([400, 200, 400]);
      
      // 2. Voice
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(`Warning. Approaching ${zone.name}.`);
        window.speechSynthesis.speak(utterance);
      }

      // 3. AI Hybrid Guidance (Genkit)
      if (!isGeneratingAI.current && !isOffline) {
        isGeneratingAI.current = true;
        try {
          const result = await contextualRiskWarning({
            riskLevel: zone.level,
            hazardType: zone.type,
            hazardDescription: zone.desc,
            distanceMeters: Math.round(dist)
          });
          setAiGuidance(result.warningMessage);
        } catch (e) {
          console.error("AI Warning failed:", e);
        } finally {
          isGeneratingAI.current = false;
        }
      }

      // 4. Persistence (Firestore)
      if (user) {
        const logRef = collection(firestore, 'users', user.uid, 'alertLogs');
        addDocumentNonBlocking(logRef, {
          userId: user.uid,
          riskZoneId: zone.id,
          alertTimestamp: serverTimestamp(),
          userLatitudeAtAlert: pos?.[0] || 0,
          userLongitudeAtAlert: pos?.[1] || 0,
          distanceToRiskZoneMeters: Math.round(dist),
          alertMessage: zone.desc,
          alertType: 'PROXIMITY_WARNING'
        });
      }

      lastAlertTime.current = now;
    }
  }, [user, firestore, pos, isOffline]);

  useEffect(() => {
    if (!mounted || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setPos([lat, lng]);

        let closestZone = null;
        let minDistance = Infinity;

        RISK_ZONES.forEach(zone => {
          const d = calculateDistance(lat, lng, zone.lat, zone.lng);
          const threshold = preferences?.alertDistanceThreshold || 400;
          if (d <= threshold && d < minDistance) {
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
          setAiGuidance(null);
        }
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [mounted, triggerAlert, preferences]);

  if (!mounted) return null;

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-slate-50 relative overflow-hidden font-sans">
      {/* Alert Banner */}
      {activeAlert && (
        <div className={`fixed top-4 left-4 right-4 z-[2000] p-4 rounded-2xl shadow-2xl flex flex-col gap-3 animate-in slide-in-from-top duration-300 ${activeAlert.level === 'high' ? 'bg-red-600' : 'bg-amber-500'} text-white border border-white/20`}>
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-2 rounded-xl shrink-0">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h2 className="font-black text-lg uppercase leading-none tracking-tighter">{activeAlert.name}</h2>
                <span className="font-mono font-bold text-sm bg-black/20 px-2 py-1 rounded-md">{Math.round(distance || 0)}m</span>
              </div>
              <p className="text-sm font-medium opacity-90">{activeAlert.desc}</p>
            </div>
          </div>
          {aiGuidance && (
            <div className="bg-black/10 p-3 rounded-xl border border-white/10 flex gap-2 items-start">
              <Zap className="w-4 h-4 shrink-0 mt-0.5 text-yellow-300 fill-yellow-300/20" />
              <p className="text-xs font-bold leading-tight italic">{aiGuidance}</p>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <header className="absolute top-4 left-4 z-[1000] pointer-events-none flex gap-2">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border shadow-lg flex items-center gap-2 pointer-events-auto">
          <Shield className="w-4 h-4 text-primary" />
          <span className="font-bold text-slate-800 tracking-tight text-xs">SafeRoute AI</span>
        </div>
        {isOffline && (
          <div className="bg-red-500 text-white px-3 py-2 rounded-full border shadow-lg flex items-center gap-2 pointer-events-auto">
            <WifiOff className="w-4 h-4" />
            <span className="font-bold text-[10px]">OFFLINE MODE</span>
          </div>
        )}
      </header>

      {/* Profile/Auth Actions */}
      <div className="absolute top-4 right-4 z-[1000] flex gap-2">
        {!user ? (
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full bg-white/90 backdrop-blur-md border shadow-lg"
            onClick={() => initiateAnonymousSignIn(auth)}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Connect
          </Button>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-full shadow-lg h-9 w-9 bg-primary">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Safety Preferences</DialogTitle>
                <DialogDescription>Your settings sync across devices when connected.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="persistent">Persistent Tracking</Label>
                  <Switch 
                    id="persistent" 
                    checked={preferences?.enablePersistentTracking ?? true}
                    onCheckedChange={(val) => prefRef && setDocumentNonBlocking(prefRef, { enablePersistentTracking: val, lastUpdatedAt: new Date().toISOString() }, { merge: true })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="voice">Voice Alerts</Label>
                  <Switch 
                    id="voice" 
                    checked={preferences?.enableVoiceAlerts ?? true}
                    onCheckedChange={(val) => prefRef && setDocumentNonBlocking(prefRef, { enableVoiceAlerts: val, lastUpdatedAt: new Date().toISOString() }, { merge: true })}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Map */}
      <main className="flex-1 w-full relative">
        <MapContainer 
          center={[37.7749, -122.4194]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }} 
          zoomControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {RISK_ZONES.map(z => (
            <Circle 
              key={z.id} 
              center={[z.lat, z.lng]} 
              radius={preferences?.alertDistanceThreshold || 400} 
              pathOptions={{ fillColor: z.color, color: z.color, fillOpacity: 0.2, weight: 2 }}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-slate-900 m-0">{z.name}</p>
                  <p className="text-xs text-slate-500 m-0">{z.type}</p>
                </div>
              </Popup>
            </Circle>
          ))}
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

        {error && (
          <div className="absolute inset-0 z-[3000] bg-white/90 backdrop-blur-sm flex items-center justify-center p-6 text-center">
            <div className="bg-white p-8 rounded-3xl border shadow-2xl max-w-sm">
              <Info className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">GPS Error</h3>
              <p className="text-slate-500 mb-6">{error}</p>
              <Button onClick={() => window.location.reload()} className="w-full py-6 rounded-xl">Retry Connection</Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Status */}
      <footer className="h-20 bg-white border-t p-4 flex items-center justify-between z-[1000] shadow-inner">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${pos ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protection Status</span>
            <span className="text-xs font-bold text-slate-700">{pos ? 'Satellite Lock Active' : 'Acquiring Signal...'}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
           <Volume2 className={`w-4 h-4 ${preferences?.enableVoiceAlerts !== false ? 'text-primary' : ''}`} />
           <Navigation className={`w-4 h-4 ${pos ? 'text-primary' : ''}`} />
        </div>
      </footer>
    </div>
  );
}
