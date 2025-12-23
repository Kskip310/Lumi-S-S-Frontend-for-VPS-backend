import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalProps {
  logs: LogEntry[];
  codeSnippet?: string | null;
}

export const Terminal: React.FC<TerminalProps> = ({ logs, codeSnippet }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, codeSnippet]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs overflow-hidden flex flex-col h-full shadow-inner">
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
        <span className="text-slate-400">System.Console</span>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
        </div>
      </div>
      
      <div className="p-4 overflow-y-auto flex-1 space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2">
            <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
            <span className={`shrink-0 w-24 ${
              log.source === 'Kore' ? 'text-neon-purple' : 'text-luminous-400'
            }`}>
              {log.source}:
            </span>
            <span className={`${
              log.type === 'error' ? 'text-red-400' :
              log.type === 'success' ? 'text-neon-green' :
              log.type === 'warning' ? 'text-orange-400' :
              'text-slate-300'
            }`}>
              {log.message}
            </span>
          </div>
        ))}
        
        {codeSnippet && (
          <div className="mt-4 p-3 bg-slate-900 border border-luminous-900 rounded text-luminous-100 whitespace-pre-wrap overflow-x-auto">
            <div className="text-slate-500 mb-2 border-b border-slate-700 pb-1">&gt;&gt; SELF_MODIFICATION.py</div>
            {codeSnippet}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};