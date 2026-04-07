import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

/**
 * 5) Risk Legend (Red/Orange/Blue)
 */
export function RiskLegend() {
  return (
    <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 w-48 animate-in fade-in slide-in-from-left duration-700">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Legend</h4>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800 leading-none">High Risk</span>
            <span className="text-[9px] text-slate-400 font-medium">Critical Attention</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800 leading-none">Medium Risk</span>
            <span className="text-[9px] text-slate-400 font-medium">Elevated Caution</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
          <div className="w-3.5 h-3.5 rounded-full bg-blue-600" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800 leading-none">You</span>
            <span className="text-[9px] text-slate-400 font-medium">Current Location</span>
          </div>
        </div>
      </div>
    </div>
  );
}
