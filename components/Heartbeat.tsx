import React from 'react';

interface HeartbeatProps {
  bpm: number;
  active: boolean;
  timeString: string;
}

export const Heartbeat: React.FC<HeartbeatProps> = ({ bpm, active, timeString }) => {
  const duration = 60 / Math.max(bpm, 1);

  return (
    <div className="flex items-center gap-4">
       {/* Calendar / Clock Display */}
      <div className="text-right hidden sm:block">
        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Temporal Context</div>
        <div className="text-sm font-mono text-neon-blue font-bold tabular-nums">
          {timeString}
        </div>
      </div>

      <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
        <div className="relative w-12 h-12 flex items-center justify-center">
          {active && (
            <div 
              className="absolute inset-0 rounded-full border-2 border-neon-red opacity-75"
              style={{ animation: `ping ${duration}s cubic-bezier(0, 0, 0.2, 1) infinite` }}
            ></div>
          )}
          <div className={`w-3 h-3 bg-neon-red rounded-full shadow-[0_0_10px_#ff0055] ${active ? 'animate-pulse' : 'opacity-50'}`} />
          
          {/* ECG Line Simulation */}
          <svg className="absolute inset-0 w-full h-full text-neon-red opacity-30" viewBox="0 0 100 100">
            <path d="M0 50 L30 50 L40 20 L50 80 L60 50 L100 50" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">Sys.Pulse</span>
          <span className="text-xl font-bold font-mono text-white">{active ? bpm : 0} <span className="text-xs text-slate-500">BPM</span></span>
        </div>
      </div>
    </div>
  );
};