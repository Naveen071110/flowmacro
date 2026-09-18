import React from 'react';
import { Play, Square, CircleDot, ArrowLeft, Plus } from 'lucide-react';
import { ExecutionStatus } from '../../types/macro';

interface HeaderProps {
  status: ExecutionStatus;
  selectedMacroTitle?: string;
  onBack?: () => void;
  onNewMacro?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  selectedMacroTitle,
  onBack,
  onNewMacro,
}) => {
  return (
    <header className="h-12 px-3 border-b border-zinc-800/80 bg-zinc-950 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2 min-w-0">
        {onBack ? (
          <button
            onClick={onBack}
            className="p-1 -ml-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
            title="Back to Macros"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-6 h-6 rounded-md overflow-hidden border border-emerald-500/30 bg-slate-900 flex items-center justify-center shrink-0">
            <img src="/automacro_ide_symbol.png" alt="AutoMacro" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="truncate">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-tight text-zinc-100 truncate">
              {selectedMacroTitle || 'AutoMacro'}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800/60 hidden sm:inline">
              v1.0
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Status pill */}
        {status === 'recording' && (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[10px] font-mono animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            REC
          </span>
        )}

        {status === 'replaying' && (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800 text-blue-400 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            REPLAYING
          </span>
        )}

        {status === 'idle' && !onBack && onNewMacro && (
          <button
            onClick={onNewMacro}
            className="h-7 px-2.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Macro</span>
          </button>
        )}
      </div>
    </header>
  );
};
