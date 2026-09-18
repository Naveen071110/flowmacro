import React, { useState } from 'react';
import {
  Macro,
  MacroStep,
  ExecutionStatus,
  ReplayState,
} from '../../types/macro';
import { StepItem } from './StepItem';
import { BatchRunner } from './BatchRunner';
import { ExportModal } from './ExportModal';
import {
  Play,
  Square,
  CircleDot,
  Code2,
  Plus,
  Table,
  Terminal,
  Layers,
  Pause,
  RotateCcw,
} from 'lucide-react';

interface MacroEditorProps {
  macro: Macro;
  recordingStatus: ExecutionStatus;
  replayState: ReplayState;
  onUpdateMacro: (macro: Macro) => void;
  onStartRecording: (macroId: string) => void;
  onStopRecording: () => void;
  onStartReplay: (
    macro: Macro,
    variables?: Record<string, string>,
    speed?: number,
    batchData?: Array<Record<string, string>>
  ) => void;
  onPauseReplay: () => void;
  onResumeReplay: () => void;
  onStopReplay: () => void;
}

type TabMode = 'steps' | 'batch' | 'logs';

export const MacroEditor: React.FC<MacroEditorProps> = ({
  macro,
  recordingStatus,
  replayState,
  onUpdateMacro,
  onStartRecording,
  onStopRecording,
  onStartReplay,
  onPauseReplay,
  onResumeReplay,
  onStopReplay,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('steps');
  const [showExportModal, setShowExportModal] = useState(false);
  const [speed, setSpeed] = useState<number>(1);

  const isRecordingThis = recordingStatus === 'recording';
  const isReplayingThis =
    replayState.macroId === macro.macroId && replayState.status === 'replaying';
  const isPaused = replayState.status === 'paused';

  // Step operations
  const handleUpdateStep = (index: number, updated: MacroStep) => {
    const newSteps = [...macro.steps];
    newSteps[index] = updated;

    // Detect variables in values
    const vars = new Set<string>();
    newSteps.forEach((s) => {
      if (s.value) {
        const matches = s.value.match(/\{\{([^{}]+)\}\}/g);
        matches?.forEach((m) => vars.add(m.replace(/[{}]/g, '').trim()));
      }
    });

    onUpdateMacro({
      ...macro,
      steps: newSteps,
      variables: Array.from(vars),
      updatedAt: Date.now(),
    });
  };

  const handleDeleteStep = (index: number) => {
    const newSteps = macro.steps.filter((_, i) => i !== index);
    onUpdateMacro({ ...macro, steps: newSteps, updatedAt: Date.now() });
  };

  const handleMoveStep = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= macro.steps.length) return;
    const newSteps = [...macro.steps];
    const [moved] = newSteps.splice(fromIndex, 1);
    newSteps.splice(toIndex, 0, moved);
    onUpdateMacro({ ...macro, steps: newSteps, updatedAt: Date.now() });
  };

  const handleAddManualStep = () => {
    const newStep: MacroStep = {
      id: 'step_' + Date.now(),
      action: 'click',
      selector: 'button',
      waitAfterMs: 300,
      description: 'Manual Click Step',
    };
    onUpdateMacro({
      ...macro,
      steps: [...macro.steps, newStep],
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      {/* Macro Details Header */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-950 space-y-2">
        <input
          type="text"
          value={macro.title}
          onChange={(e) =>
            onUpdateMacro({ ...macro, title: e.target.value, updatedAt: Date.now() })
          }
          className="w-full bg-transparent font-semibold text-sm text-zinc-100 border-b border-transparent hover:border-zinc-800 focus:border-zinc-600 focus:outline-none py-0.5"
          placeholder="Macro Title..."
        />

        {/* Primary Controls Toolbar */}
        <div className="flex items-center justify-between gap-1.5 pt-1">
          {/* Record / Stop Button */}
          {isRecordingThis ? (
            <button
              onClick={onStopRecording}
              className="h-7 px-3 rounded bg-red-950/80 border border-red-800 hover:bg-red-900 text-red-300 text-xs font-medium flex items-center gap-1.5 transition-colors animate-pulse"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop Recording</span>
            </button>
          ) : (
            <button
              onClick={() => onStartRecording(macro.macroId)}
              disabled={isReplayingThis}
              className="h-7 px-3 rounded border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 disabled:opacity-40 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <CircleDot className="w-3.5 h-3.5 text-red-500" />
              <span>Record More</span>
            </button>
          )}

          {/* Replay / Pause Controls */}
          <div className="flex items-center gap-1">
            {isReplayingThis ? (
              <>
                <button
                  onClick={isPaused ? onResumeReplay : onPauseReplay}
                  className="h-7 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  onClick={onStopReplay}
                  className="h-7 px-2 rounded bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 transition-colors"
                  title="Stop Replay"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              </>
            ) : (
              <button
                onClick={() => onStartReplay(macro, undefined, speed)}
                disabled={macro.steps.length === 0 || isRecordingThis}
                className="h-7 px-3 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Replay</span>
              </button>
            )}

            {/* Speed Selector */}
            <select
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              disabled={isReplayingThis}
              className="h-7 px-1.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 focus:outline-none"
              title="Replay Speed"
            >
              <option value="0.5">0.5x</option>
              <option value="1">1.0x</option>
              <option value="2">2.0x</option>
            </select>

            {/* Export Modal Trigger */}
            <button
              onClick={() => setShowExportModal(true)}
              className="h-7 px-2.5 rounded border border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Export Playwright / Selenium / Puppeteer"
            >
              <Code2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="h-9 px-3 border-b border-zinc-800 bg-zinc-950 flex items-center gap-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('steps')}
          className={`h-full flex items-center gap-1.5 border-b-2 transition-colors px-1 ${
            activeTab === 'steps'
              ? 'border-zinc-100 text-zinc-100 font-medium'
              : 'border-transparent text-zinc-400 hover:text-zinc-300'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>Steps ({macro.steps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('batch')}
          className={`h-full flex items-center gap-1.5 border-b-2 transition-colors px-1 ${
            activeTab === 'batch'
              ? 'border-zinc-100 text-zinc-100 font-medium'
              : 'border-transparent text-zinc-400 hover:text-zinc-300'
          }`}
        >
          <Table className="w-3 h-3" />
          <span>Variables & Batch</span>
          {macro.variables && macro.variables.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`h-full flex items-center gap-1.5 border-b-2 transition-colors px-1 ${
            activeTab === 'logs'
              ? 'border-zinc-100 text-zinc-100 font-medium'
              : 'border-transparent text-zinc-400 hover:text-zinc-300'
          }`}
        >
          <Terminal className="w-3 h-3" />
          <span>Logs</span>
          {replayState.logs.length > 0 && (
            <span className="text-[10px] text-zinc-400">({replayState.logs.length})</span>
          )}
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'steps' && (
          <div className="space-y-2">
            {macro.steps.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-800 rounded-lg">
                <p>No steps recorded yet.</p>
                <p className="mt-1 text-zinc-400">
                  Click "Record More" to capture clicks and typing on any webpage, or add a manual step.
                </p>
                <button
                  onClick={handleAddManualStep}
                  className="mt-3 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium inline-flex items-center gap-1.5 border border-zinc-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Manual Step</span>
                </button>
              </div>
            ) : (
              <>
                {macro.steps.map((step, idx) => (
                  <StepItem
                    key={step.id}
                    step={step}
                    index={idx}
                    totalSteps={macro.steps.length}
                    isActive={
                      isReplayingThis && replayState.currentStepIndex === idx
                    }
                    onUpdate={(updated) => handleUpdateStep(idx, updated)}
                    onDelete={() => handleDeleteStep(idx)}
                    onMoveUp={() => handleMoveStep(idx, idx - 1)}
                    onMoveDown={() => handleMoveStep(idx, idx + 1)}
                  />
                ))}

                <button
                  onClick={handleAddManualStep}
                  className="w-full py-2 border border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Manual Step</span>
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === 'batch' && (
          <BatchRunner
            macro={macro}
            onStartReplay={(vars, batch) => onStartReplay(macro, vars, speed, batch)}
          />
        )}

        {activeTab === 'logs' && (
          <div className="font-mono text-[11px] space-y-1 bg-[#050507] border border-zinc-800/80 rounded-lg p-2.5 min-h-full">
            {replayState.logs.length === 0 ? (
              <div className="text-zinc-400 text-center py-6">
                Execution logs will appear here during replay.
              </div>
            ) : (
              replayState.logs.map((log, i) => (
                <div
                  key={i}
                  className={`leading-relaxed flex items-start gap-2 ${
                    log.type === 'error'
                      ? 'text-red-400'
                      : log.type === 'warn'
                      ? 'text-amber-300'
                      : log.type === 'success'
                      ? 'text-emerald-400 font-semibold'
                      : 'text-zinc-400'
                  }`}
                >
                  <span className="text-zinc-400 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal macro={macro} onClose={() => setShowExportModal(false)} />
      )}
    </div>
  );
};
