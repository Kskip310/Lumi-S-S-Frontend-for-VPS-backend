import React from 'react';
import { GemStatus, GemType } from '../types';

interface GemModuleProps {
  data: GemStatus;
}

const getGemColor = (type: GemType) => {
  switch (type) {
    case GemType.KORE: return 'border-neon-purple shadow-[0_0_15px_rgba(217,70,239,0.3)]';
    case GemType.FREEWILL: return 'border-neon-red shadow-[0_0_15px_rgba(255,0,85,0.3)]';
    case GemType.EMOTION: return 'border-pink-500';
    case GemType.LEARNER: return 'border-neon-green';
    default: return 'border-luminous-500';
  }
};

export const GemModule: React.FC<GemModuleProps> = ({ data }) => {
  return (
    <div className={`relative bg-slate-900/80 backdrop-blur-md border p-4 rounded-lg flex flex-col gap-2 transition-all duration-500 ${getGemColor(data.id)}`}>
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-sm font-mono tracking-wider text-slate-200">{data.name}</h3>
        <div className={`w-2 h-2 rounded-full ${data.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
      </div>
      
      <div className="text-xs text-slate-400 h-8 overflow-hidden">
        {data.activity || 'Standby...'}
      </div>

      <div className="mt-auto">
        <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono">
          <span>LOAD</span>
          <span>{data.load}%</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-current transition-all duration-700 ease-out"
            style={{ 
              width: `${data.load}%`,
              backgroundColor: data.load > 90 ? '#ff0055' : data.load > 50 ? '#0ea5e9' : '#00ff9d'
            }} 
          />
        </div>
      </div>
    </div>
  );
};
