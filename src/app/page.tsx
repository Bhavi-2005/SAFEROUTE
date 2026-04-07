'use client';

import dynamic from 'next/dynamic';
import { useSafetyTracker } from '@/hooks/use-safety-tracker';
import { WarningBanner } from '@/components/WarningBanner';
import { RiskLegend } from '@/components/RiskLegend';
import { Navigation, ShieldCheck, Map as MapIcon, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dynamically import Leaflet Map to avoid SSR errors
const SafeMap = dynamic(() => import('@/components/SafeMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted flex items-center justify-center flex-col gap-4">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <p className="font-medium text-muted-foreground">Initializing Safety Maps...</p>
    </div>
  )
});

export default function Home() {
  const { currentPosition, activeRisk, aiWarning, distanceToRisk, trackingError } = useSafetyTracker();

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col bg-background">
      {/* Top Banner Area */}
      <WarningBanner 
        activeRisk={activeRisk} 
        aiWarning={aiWarning} 
        distance={distanceToRisk} 
      />

      {/* Header / Brand */}
      <header className="absolute top-4 left-4 right-4 z-[500] pointer-events-none flex justify-between items-start">
        {!activeRisk && (
          <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-border flex items-center gap-2 pointer-events-auto">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm tracking-tight">SafeRoute AI</span>
          </div>
        )}
      </header>

      {/* Error State */}
      {trackingError && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2000] w-full max-w-sm">
          <div className="bg-destructive/10 backdrop-blur-md border-2 border-destructive p-6 rounded-2xl shadow-xl text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Tracking Interrupted</h2>
            <p className="text-sm text-muted-foreground mb-4">{trackingError}</p>
            <Button onClick={() => window.location.reload()} variant="default" className="w-full">
              Restart Tracker
            </Button>
          </div>
        </div>
      )}

      {/* Main Map View */}
      <main className="flex-1 w-full relative">
        <SafeMap userPosition={currentPosition} />
      </main>

      {/* Overlay UI elements */}
      <div className="absolute bottom-8 left-4 z-[500] w-64 md:w-72 hidden sm:block">
        <RiskLegend />
      </div>

      <div className="absolute bottom-8 right-4 z-[500] flex flex-col gap-3">
        <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-border flex flex-col items-center gap-4">
          <Button size="icon" variant="ghost" className="rounded-xl hover:bg-primary/10 hover:text-primary">
            <Navigation className="w-5 h-5" />
          </Button>
          <div className="w-full h-px bg-border" />
          <Button size="icon" variant="ghost" className="rounded-xl hover:bg-primary/10 hover:text-primary">
            <MapIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Location Status Badge */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[500]">
        <div className="bg-primary px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-primary-foreground font-bold text-sm">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          {currentPosition ? 'Tracking Real-time' : 'Waiting for GPS...'}
        </div>
      </div>
    </div>
  );
}
