'use client';

import React from 'react';
import { AlertTriangle, MapPin } from 'lucide-react';
import { RiskZone } from '@/lib/risk-zones';
import { cn } from '@/lib/utils';

interface WarningBannerProps {
  activeRisk: RiskZone | null;
  distance: number | null;
}

/**
 * 4a) On-screen warning banner with dynamic distance and smooth animations
 */
export function WarningBanner({ activeRisk, distance }: WarningBannerProps) {
  if (!activeRisk) return null;

  const isHighRisk = activeRisk.level === 'high';

  return (
    <div 
      className={cn(
        "fixed top-4 left-4 right-4 z-[2000] animate-in slide-in-from-top duration-500",
        "rounded-2xl shadow-2xl p-4 flex items-start gap-4 border-2 border-white/20",
        isHighRisk ? "bg-red-600 text-white" : "bg-amber-500 text-white"
      )}
    >
      <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shrink-0">
        <AlertTriangle className="w-6 h-6 animate-pulse" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-black text-lg uppercase leading-none tracking-tighter">
            {activeRisk.type} Zone
          </h3>
          <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full border border-white/10">
            <MapPin className="w-3 h-3" />
            <span className="font-mono font-bold text-xs">
              {distance ? Math.round(distance) : 0}m
            </span>
          </div>
        </div>
        
        <p className="text-sm font-bold opacity-90 leading-snug truncate">
          {activeRisk.description}
        </p>
        
        <div className="mt-2 w-full h-1 bg-black/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white/40 transition-all duration-300"
            style={{ width: `${Math.min(100, (distance || 400) / 4)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
