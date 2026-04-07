'use client';

import dynamic from 'next/dynamic';
import { useSafetyTracker } from '@/hooks/use-safety-tracker';
import { WarningBanner } from '@/components/WarningBanner';
import { ShieldCheck, Loader2, AlertTriangle, Navigation2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Dynamically import Leaflet Map to avoid SSR errors
const SafeMap = dynamic(() => import('@/components/SafeMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-50 flex items-center justify-center flex-col gap-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="font-medium text-slate-500">Initializing Map...</p>
    </div>
  )
});

export default function Home() {
  const { currentPosition, activeRisk, distanceToRisk, trackingError, isTracking } = useSafetyTracker();

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden flex flex-col bg-slate-50">
      {/* Visual Warning Overlay */}
      <WarningBanner 
        activeRisk={activeRisk} 
        aiWarning={null} // AI disabled per request
        distance={distanceToRisk} 
      />

      {/* Header Branding */}
      <header className="absolute top-4 left-4 z-[1000] pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-2 pointer-events-auto">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm text-slate-900">SafeRoute AI</span>
        </div>
      </header>

      {/* Connection / Status Badge */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl border border-white/10">
          <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
            {isTracking ? 'GPS Active' : 'Connecting GPS...'}
          </span>
        </div>
      </div>

      {/* Error / Permission Prompt */}
      {trackingError && (
        <div className="absolute inset-0 z-[2000] bg-white/80 backdrop-blur-sm flex items-center justify-center p-6">
          <Alert variant="destructive" className="max-w-md shadow-2xl bg-white">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Location Access Required</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4">{trackingError}</p>
              <Button onClick={() => window.location.reload()} variant="default" className="w-full">
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Full Screen Map */}
      <main className="flex-1 w-full relative">
        <SafeMap userPosition={currentPosition} />
      </main>

      {/* Quick Action Button */}
      <div className="absolute bottom-8 right-6 z-[1000]">
        <Button 
          size="icon" 
          variant="default" 
          className="w-14 h-14 rounded-2xl shadow-2xl transition-transform active:scale-90"
          onClick={() => {
            if (currentPosition) {
              window.dispatchEvent(new CustomEvent('map-recenter', { detail: currentPosition }));
            }
          }}
        >
          <Navigation2 className="w-6 h-6" />
        </Button>
      </div>

      {/* Safety Footer Info (Mobile Friendly) */}
      <footer className="h-20 bg-white border-t border-slate-200 flex items-center px-6 justify-between z-[1000]">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Current Status</span>
          <span className="text-sm font-bold text-slate-700">
            {activeRisk ? 'Entering Hazard Zone' : 'All Routes Clear'}
          </span>
        </div>
        <div className="flex items-center gap-2">
           <div className="h-8 w-px bg-slate-100 mx-2" />
           <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Active Protection</span>
              <div className="flex gap-1 justify-end">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}
