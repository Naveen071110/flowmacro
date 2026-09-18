import React from 'react';
import { Macro } from '../../types/macro';
import { Play, Trash2, Clock, Layers, Upload, ChevronRight } from 'lucide-react';

interface MacroListProps {
  macros: Macro[];
  onSelectMacro: (macro: Macro) => void;
  onDeleteMacro: (macroId: string) => void;
  onQuickReplay: (macro: Macro) => void;
  onImportJson: (jsonStr: string) => void;
  onCreateNew: () => void;
}

export const MacroList: React.FC<MacroListProps> = ({
  macros,
  onSelectMacro,
  onDeleteMacro,
  onQuickReplay,
  onImportJson,
  onCreateNew,
}) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onImportJson(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  if (macros.length === 0) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[380px]">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
          <span className="text-xl">⚡</span>
        </div>
        <h3 className="text-sm font-semibold text-zinc-100">No Macros Recorded</h3>
        <p className="mt-1.5 text-xs text-zinc-400 max-w-xs leading-relaxed">
          Record repetitive clicks, form inputs, and workflows, then replay them instantly or export to Playwright/Selenium.
        </p>

        <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
          <button
            onClick={onCreateNew}
            className="h-8 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Start First Recording</span>
          </button>

          <label className="h-8 rounded border border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Import Macro JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between pb-1 px-1">
        <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
          Saved Macros ({macros.length})
        </span>

        <label className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer transition-colors">
          <Upload className="w-3 h-3" />
          <span>Import</span>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      <div className="space-y-2">
        {macros.map((macro) => (
          <div
            key={macro.macroId}
            onClick={() => onSelectMacro(macro)}
            className="group border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700 p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-200 group-hover:text-zinc-100 truncate">
                  {macro.title}
                </span>
                {macro.variables && macro.variables.length > 0 && (
                  <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded border border-zinc-700">
                    {macro.variables.length} vars
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex items-center gap-3 text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {macro.steps.length} step{macro.steps.length === 1 ? '' : 's'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(macro.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onQuickReplay(macro)}
                className="p-1.5 rounded bg-zinc-800 hover:bg-emerald-600/20 hover:text-emerald-400 text-zinc-300 transition-colors"
                title="Replay in Browser"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>

              <button
                onClick={() => onDeleteMacro(macro.macroId)}
                className="p-1.5 rounded hover:bg-red-950/40 text-zinc-400 hover:text-red-400 transition-colors"
                title="Delete Macro"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
