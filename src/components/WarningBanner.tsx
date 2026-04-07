'use client';

import { AlertTriangle, Info } from 'lucide-react';
import { RiskZone } from '@/lib/risk-zones';
import { cn } from '@/lib/utils';

interface WarningBannerProps {
  activeRisk: RiskZone | null;
  aiWarning: string | null;
  distance: number | null;
}

export function WarningBanner({ activeRisk, aiWarning, distance }: WarningBannerProps) {
  if (!activeRisk) return null;

  const isHighRisk = activeRisk.level === 'high';

  return (
    <div 
      className={cn(
        "fixed top-4 left-4 right-4 z-[1000] animate-banner-slide",
        "rounded-xl shadow-2xl p-4 flex items-start gap-4 transition-all duration-300",
        isHighRisk ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground"
      )}
    >
      <div className="bg-white/20 p-2 rounded-lg">
        <AlertTriangle className="w-6 h-6 animate-pulse" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-lg leading-none uppercase tracking-wider">
            {activeRisk.level} Risk Zone Detected
          </h3>
          <span className="font-mono font-bold text-sm bg-black/10 px-2 py-1 rounded">
            {distance ? Math.round(distance) : 0}m Ahead
          </span>
        </div>
        <p className="text-sm font-medium opacity-90 mb-2">
          {activeRisk.type}: {activeRisk.description}
        </p>
        {aiWarning && (
          <div className="bg-black/10 p-3 rounded-lg flex gap-3 items-start border border-white/10">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-relaxed">
              AI GUIDANCE: {aiWarning}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
