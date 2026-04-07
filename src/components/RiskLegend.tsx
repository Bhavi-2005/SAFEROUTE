import { ShieldAlert, Info } from 'lucide-react';

export function RiskLegend() {
  return (
    <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-border">
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
        <ShieldAlert className="w-3 h-3" />
        Risk Level Legend
      </h4>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-destructive border-2 border-white shadow-sm ring-1 ring-destructive/50" />
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-none">High Risk</span>
            <span className="text-[10px] text-muted-foreground">Severe hazards, immediate caution</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-warning border-2 border-white shadow-sm ring-1 ring-warning/50" />
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-none">Medium Risk</span>
            <span className="text-[10px] text-muted-foreground">Minor hazards, stay alert</span>
          </div>
        </div>
      </div>
    </div>
  );
}
