import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Circle,
  Download,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Globe,
  Terminal,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Code2,
} from 'lucide-react';
import {
  SeleniumCommand,
  TestSuite,
  CommandType,
  ReplaySessionState,
  ExecutionLog,
} from '../types/macro';
import { ExportModal } from './components/ExportModal';

const DEFAULT_SUITE: TestSuite = {
  id: 'suite_' + Date.now(),
  name: 'New Test Suite',
  baseUrl: 'https://example.com',
  commands: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const COMMAND_COLORS: Record<CommandType, { bg: string; text: string; border: string }> = {
  open: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  click: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  type: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  select: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
  submit: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  waitFor: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  wait: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' },
};

export default function App() {
  const [suite, setSuite] = useState<TestSuite>(DEFAULT_SUITE);
  const [selectedCommandId, setSelectedCommandId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [replayState, setReplayState] = useState<ReplaySessionState>({
    suiteId: null,
    status: 'idle',
    currentStepIndex: 0,
    totalSteps: 0,
    speed: 1,
    logs: [],
  });
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'navigation'>('all');
  const [autoScrollLogs, setAutoScrollLogs] = useState<boolean>(true);
  const [editingTitle, setEditingTitle] = useState<boolean>(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (autoScrollLogs && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replayState.logs, autoScrollLogs]);

  // Sync with storage on startup
  useEffect(() => {
    chrome.storage.local.get(['automacro_ide_suite'], (res) => {
      if (res.automacro_ide_suite && res.automacro_ide_suite.commands) {
        setSuite(res.automacro_ide_suite);
        if (res.automacro_ide_suite.commands.length > 0) {
          setSelectedCommandId(res.automacro_ide_suite.commands[0].id);
        }
      }
    });

    // Check initial background session state
    chrome.runtime.sendMessage({ type: 'GET_SESSION_STATE' }, (state: ReplaySessionState) => {
      if (state) {
        setReplayState(state);
        if (state.status === 'recording') {
          setIsRecording(true);
        }
      }
    });

    // Message listener for runtime broadcasts from service_worker
    const messageListener = (msg: any) => {
      if (msg.type === 'RECORDED_COMMAND') {
        const newCmd: SeleniumCommand = msg.command;
        setSuite((prev) => {
          // Avoid duplicate commands if forwarded multiple times
          if (prev.commands.some((c) => c.id === newCmd.id)) return prev;
          const next = {
            ...prev,
            commands: [...prev.commands, newCmd],
            updatedAt: Date.now(),
          };
          chrome.storage.local.set({ automacro_ide_suite: next });
          return next;
        });
        setSelectedCommandId(newCmd.id);
      } else if (msg.type === 'STEP_STATUS_CHANGED') {
        setSuite((prev) => {
          const updated = prev.commands.map((cmd) => {
            if (cmd.id === msg.commandId) {
              return {
                ...cmd,
                status: msg.status,
                errorMessage: msg.error || undefined,
              };
            }
            return cmd;
          });
          const next = { ...prev, commands: updated, updatedAt: Date.now() };
          chrome.storage.local.set({ automacro_ide_suite: next });
          return next;
        });
      } else if (msg.type === 'SESSION_STATE_UPDATE') {
        setReplayState(msg.state);
        if (msg.state.status === 'recording') {
          setIsRecording(true);
        } else if (msg.state.status === 'idle' || msg.state.status === 'completed' || msg.state.status === 'error') {
          setIsRecording(false);
        }
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  // Save suite updates to storage
  const updateSuite = (updater: (prev: TestSuite) => TestSuite) => {
    setSuite((prev) => {
      const next = updater(prev);
      chrome.storage.local.set({ automacro_ide_suite: next });
      return next;
    });
  };

  // Selected command helper
  const selectedCommand = suite.commands.find((c) => c.id === selectedCommandId) || null;

  // ============================================================================
  // RECORDING CONTROLS
  // ============================================================================
  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop Recording
      setIsRecording(false);
      chrome.runtime.sendMessage({ type: 'STOP_RECORDING' }).catch(() => {});
    } else {
      // Validate Base URL
      let url = suite.baseUrl.trim();
      if (!url) {
        alert('Please specify a valid Base URL before starting recording.');
        return;
      }
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
        updateSuite((s) => ({ ...s, baseUrl: url }));
      }

      setIsRecording(true);
      // Reset step statuses to pending
      updateSuite((s) => ({
        ...s,
        commands: s.commands.map((c) => ({ ...c, status: 'pending', errorMessage: undefined })),
      }));

      chrome.runtime.sendMessage({
        type: 'START_RECORDING',
        baseUrl: url,
        suiteId: suite.id,
      }).catch(() => {});
    }
  };

  // ============================================================================
  // REPLAY CONTROLS
  // ============================================================================
  const handleStartReplay = (startFromIndex: number = 0) => {
    if (suite.commands.length === 0) {
      alert('Suite has no steps to replay. Record or add commands first.');
      return;
    }

    // Reset statuses from startFromIndex
    updateSuite((s) => ({
      ...s,
      commands: s.commands.map((c, i) =>
        i >= startFromIndex ? { ...c, status: 'pending', errorMessage: undefined } : c
      ),
    }));

    chrome.runtime.sendMessage({
      type: 'START_REPLAY',
      suite,
      speed: playbackSpeed,
      startFromIndex,
    }).catch(() => {});
  };

  const handlePauseReplay = () => {
    chrome.runtime.sendMessage({ type: 'PAUSE_REPLAY' }).catch(() => {});
  };

  const handleResumeReplay = () => {
    chrome.runtime.sendMessage({ type: 'RESUME_REPLAY' }).catch(() => {});
  };

  const handleStop = () => {
    if (isRecording) {
      setIsRecording(false);
      chrome.runtime.sendMessage({ type: 'STOP_RECORDING' }).catch(() => {});
    } else {
      chrome.runtime.sendMessage({ type: 'STOP_REPLAY' }).catch(() => {});
    }
  };

  const handleClearSuite = () => {
    if (confirm('Are you sure you want to clear all steps in this test suite?')) {
      updateSuite((s) => ({
        ...s,
        commands: [],
        updatedAt: Date.now(),
      }));
      setSelectedCommandId(null);
    }
  };

  const handleNewSuite = () => {
    if (confirm('Create a new blank Test Suite? Current suite will be reset.')) {
      const fresh: TestSuite = {
        id: 'suite_' + Date.now(),
        name: 'New Test Suite',
        baseUrl: 'https://example.com',
        commands: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSuite(fresh);
      setSelectedCommandId(null);
      chrome.storage.local.set({ automacro_ide_suite: fresh });
    }
  };

  // ============================================================================
  // STEP MANIPULATION
  // ============================================================================
  const handleAddCommand = () => {
    const newCmd: SeleniumCommand = {
      id: 'cmd_' + Date.now(),
      command: 'click',
      target: 'css=button.submit',
      value: '',
      status: 'pending',
    };
    updateSuite((s) => ({
      ...s,
      commands: [...s.commands, newCmd],
      updatedAt: Date.now(),
    }));
    setSelectedCommandId(newCmd.id);
  };

  const handleDeleteCommand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    updateSuite((s) => ({
      ...s,
      commands: s.commands.filter((c) => c.id !== id),
      updatedAt: Date.now(),
    }));
    if (selectedCommandId === id) {
      setSelectedCommandId(null);
    }
  };

  const handleMoveCommand = (index: number, direction: 'up' | 'down', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= suite.commands.length) return;

    updateSuite((s) => {
      const nextCommands = [...s.commands];
      const temp = nextCommands[index];
      nextCommands[index] = nextCommands[newIndex];
      nextCommands[newIndex] = temp;
      return { ...s, commands: nextCommands, updatedAt: Date.now() };
    });
  };

  const handleUpdateSelectedCommand = (patch: Partial<SeleniumCommand>) => {
    if (!selectedCommandId) return;
    updateSuite((s) => ({
      ...s,
      commands: s.commands.map((c) => (c.id === selectedCommandId ? { ...c, ...patch } : c)),
      updatedAt: Date.now(),
    }));
  };

  // Status Metrics
  const passedCount = suite.commands.filter((c) => c.status === 'passed').length;
  const failedCount = suite.commands.filter((c) => c.status === 'failed').length;
  const pendingCount = suite.commands.filter((c) => c.status === 'pending' || c.status === 'executing').length;

  const isReplaying = replayState.status === 'replaying';
  const isPaused = replayState.status === 'paused';

  const filteredLogs = replayState.logs.filter((log) => {
    if (logFilter === 'error') return log.type === 'error';
    if (logFilter === 'navigation') return log.message.includes('Navigation') || log.message.includes('Page');
    return true;
  });

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090b] text-zinc-100 font-sans select-none overflow-hidden">
      {/* TOP APPLICATION BAR */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-zinc-950 border-b border-zinc-800/80 shrink-0">
        {/* Left: Brand & Suite Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-emerald-500/30 bg-slate-900 flex items-center justify-center shadow-sm shrink-0">
              <img src="/automacro_ide_symbol.png" alt="AutoMacro IDE Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider text-zinc-100 uppercase font-mono">
                  AutoMacro <span className="text-emerald-400">IDE</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                  v2.0
                </span>
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          {/* Inline Editable Suite Name */}
          <div className="flex items-center gap-1.5">
            {editingTitle ? (
              <input
                type="text"
                value={suite.name}
                autoFocus
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                onChange={(e) => updateSuite((s) => ({ ...s, name: e.target.value }))}
                className="text-xs font-medium bg-zinc-900 border border-emerald-500/50 rounded px-2 py-1 text-zinc-100 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            ) : (
              <span
                onClick={() => setEditingTitle(true)}
                title="Click to edit suite name"
                className="text-xs font-medium text-zinc-300 hover:text-zinc-100 cursor-pointer px-1.5 py-0.5 rounded hover:bg-zinc-800/60 transition-colors"
              >
                {suite.name}
              </span>
            )}
          </div>
        </div>

        {/* Center: Base URL input */}
        <div className="flex items-center gap-2 flex-1 max-w-md mx-4">
          <div className="relative w-full flex items-center">
            <div className="absolute left-2.5 text-zinc-500 pointer-events-none">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={suite.baseUrl}
              placeholder="https://example.com"
              disabled={isRecording || isReplaying}
              onChange={(e) => updateSuite((s) => ({ ...s, baseUrl: e.target.value }))}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900/90 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all font-mono disabled:opacity-60"
            />
          </div>
        </div>

        {/* Right: Primary Controls */}
        <div className="flex items-center gap-2">
          {/* Record Button */}
          <button
            onClick={handleToggleRecording}
            disabled={isReplaying}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            <Circle className={`w-3.5 h-3.5 ${isRecording ? 'fill-white' : 'fill-rose-400'}`} />
            <span>{isRecording ? 'Recording...' : 'Record'}</span>
          </button>

          {/* Replay / Pause Controls */}
          {!isReplaying ? (
            <button
              onClick={() => handleStartReplay(0)}
              disabled={isRecording || suite.commands.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Play</span>
            </button>
          ) : isPaused ? (
            <button
              onClick={handleResumeReplay}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-all shadow-sm active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={handlePauseReplay}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-medium transition-all shadow-sm active:scale-95"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          {/* Stop Button */}
          {(isRecording || isReplaying) && (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-all shadow-sm active:scale-95"
            >
              <Square className="w-3.5 h-3.5 fill-zinc-300" />
              <span>Stop</span>
            </button>
          )}

          <div className="h-4 w-px bg-zinc-800" />

          {/* Speed Selector */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[11px]">
            {[0.5, 1, 2].map((sp) => (
              <button
                key={sp}
                onClick={() => setPlaybackSpeed(sp)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  playbackSpeed === sp
                    ? 'bg-zinc-800 text-zinc-100 font-semibold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {sp}x
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          {/* Export Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* METRICS & STATUS RIBBON */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900/40 border-b border-zinc-800/60 text-xs text-zinc-400 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-mono">Status:</span>
            {isRecording ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                RECORDING TARGET WINDOW
              </span>
            ) : isReplaying ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                EXECUTING STEP {replayState.currentStepIndex + 1}/{replayState.totalSteps}
              </span>
            ) : isPaused ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-medium">
                PAUSED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[11px] font-medium font-mono">
                IDLE
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>Total: <strong className="text-zinc-200">{suite.commands.length}</strong></span>
            <span>Passed: <strong className="text-emerald-400">{passedCount}</strong></span>
            {failedCount > 0 && <span>Failed: <strong className="text-rose-400">{failedCount}</strong></span>}
            <span>Pending: <strong className="text-zinc-400">{pendingCount}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddCommand}
            className="flex items-center gap-1 px-2 py-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-[11px] transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Step
          </button>
          <button
            onClick={handleClearSuite}
            disabled={suite.commands.length === 0}
            className="flex items-center gap-1 px-2 py-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 text-[11px] transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
          <button
            onClick={handleNewSuite}
            className="flex items-center gap-1 px-2 py-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-[11px] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            New Suite
          </button>
        </div>
      </div>

      {/* MAIN SPLIT: COMMAND TABLE & INSPECTOR */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#0c0c0e]">
        {/* COMMAND TABLE HEADER */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-zinc-950/80 border-b border-zinc-800/80 text-[11px] font-semibold text-zinc-400 tracking-wider uppercase font-mono shrink-0">
          <div className="col-span-1">#</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Command</div>
          <div className="col-span-4">Target Selector</div>
          <div className="col-span-3">Value</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* COMMAND TABLE BODY */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/40">
          {suite.commands.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-zinc-500">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-medium text-zinc-300 mb-1">No Automation Steps Recorded</h3>
              <p className="text-xs text-zinc-500 max-w-sm mb-4">
                Enter your target Base URL above and click <strong className="text-rose-400">Record</strong> to start capturing user actions, or click <strong className="text-zinc-300">Add Step</strong> to construct manually.
              </p>
              <button
                onClick={handleToggleRecording}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-medium hover:bg-rose-500/20 transition-all"
              >
                <Circle className="w-3.5 h-3.5 fill-rose-400" />
                Start Recording Flow
              </button>
            </div>
          ) : (
            suite.commands.map((cmd, idx) => {
              const isSelected = cmd.id === selectedCommandId;
              const colorInfo = COMMAND_COLORS[cmd.command] || COMMAND_COLORS.click;

              return (
                <div
                  key={cmd.id}
                  onClick={() => setSelectedCommandId(cmd.id)}
                  className={`grid grid-cols-12 gap-2 px-4 py-2 text-xs items-center cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-zinc-800/70 border-l-2 border-emerald-500 text-zinc-100'
                      : 'hover:bg-zinc-900/50 text-zinc-300'
                  }`}
                >
                  {/* Step # */}
                  <div className="col-span-1 font-mono text-[11px] text-zinc-500 font-semibold">
                    {idx + 1}
                  </div>

                  {/* Status Indicator */}
                  <div className="col-span-1 flex items-center">
                    {cmd.status === 'passed' && (
                      <span title="Step Passed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </span>
                    )}
                    {cmd.status === 'failed' && (
                      <span title={cmd.errorMessage || 'Step execution failed'}>
                        <XCircle className="w-4 h-4 text-rose-400 animate-pulse" />
                      </span>
                    )}
                    {cmd.status === 'executing' && (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                    )}
                    {cmd.status === 'pending' && (
                      <span title="Pending execution">
                        <Clock className="w-3.5 h-3.5 text-zinc-600" />
                      </span>
                    )}
                  </div>

                  {/* Command Badge */}
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${colorInfo.bg} ${colorInfo.text} ${colorInfo.border}`}
                    >
                      {cmd.command}
                    </span>
                  </div>

                  {/* Target Selector */}
                  <div className="col-span-4 font-mono text-zinc-300 truncate" title={cmd.target}>
                    {cmd.target}
                    {cmd.targets && cmd.targets.length > 1 && (
                      <span className="ml-1.5 text-[10px] px-1 py-0.2 bg-zinc-800 text-zinc-500 rounded">
                        +{cmd.targets.length - 1}
                      </span>
                    )}
                  </div>

                  {/* Value */}
                  <div className="col-span-3 font-mono text-zinc-400 truncate">
                    {cmd.isSensitive ? (
                      <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded text-[11px]">
                        <Shield className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{'{{SECRET_PASSWORD}}'}</span>
                      </span>
                    ) : (
                      cmd.value || <span className="text-zinc-600">-</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-1 text-zinc-500">
                    <button
                      onClick={(e) => handleMoveCommand(idx, 'up', e)}
                      disabled={idx === 0}
                      title="Move Up"
                      className="p-1 hover:text-zinc-200 disabled:opacity-20 hover:bg-zinc-800 rounded"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleMoveCommand(idx, 'down', e)}
                      disabled={idx === suite.commands.length - 1}
                      title="Move Down"
                      className="p-1 hover:text-zinc-200 disabled:opacity-20 hover:bg-zinc-800 rounded"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteCommand(cmd.id, e)}
                      title="Delete Step"
                      className="p-1 hover:text-rose-400 hover:bg-zinc-800 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* COMMAND INSPECTOR BAR (D詢DOCKED BELOW TABLE) */}
        {selectedCommand && (
          <div className="p-3 bg-zinc-950/90 border-t border-zinc-800/80 shrink-0">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono mb-2 flex items-center justify-between">
              <span>Command Inspector</span>
              <span className="text-zinc-500 font-normal">Step ID: {selectedCommand.id}</span>
            </div>

            <div className="grid grid-cols-12 gap-3 items-center">
              {/* Command dropdown */}
              <div className="col-span-2">
                <label className="block text-[10px] text-zinc-500 mb-1">Command</label>
                <select
                  value={selectedCommand.command}
                  onChange={(e) =>
                    handleUpdateSelectedCommand({ command: e.target.value as CommandType })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
                >
                  <option value="open">open</option>
                  <option value="click">click</option>
                  <option value="type">type</option>
                  <option value="select">select</option>
                  <option value="submit">submit</option>
                  <option value="waitFor">waitFor</option>
                  <option value="wait">wait</option>
                </select>
              </div>

              {/* Target Selector input */}
              <div className="col-span-5">
                <label className="block text-[10px] text-zinc-500 mb-1">Target Selector</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={selectedCommand.target}
                    onChange={(e) => handleUpdateSelectedCommand({ target: e.target.value })}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
                  />
                  {selectedCommand.targets && selectedCommand.targets.length > 1 && (
                    <select
                      onChange={(e) => handleUpdateSelectedCommand({ target: e.target.value })}
                      className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-[11px] text-zinc-400 font-mono focus:outline-none"
                    >
                      <option value="">Locators ({selectedCommand.targets.length})</option>
                      {selectedCommand.targets.map(([loc, strat], i) => (
                        <option key={i} value={loc}>
                          {strat}: {loc}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Value input */}
              <div className="col-span-3">
                <label className="block text-[10px] text-zinc-500 mb-1">Value / Text</label>
                <input
                  type="text"
                  disabled={selectedCommand.isSensitive}
                  value={
                    selectedCommand.isSensitive
                      ? '{{SECRET_PASSWORD}}'
                      : selectedCommand.value || ''
                  }
                  onChange={(e) => handleUpdateSelectedCommand({ value: e.target.value })}
                  placeholder={selectedCommand.isSensitive ? 'Encrypted (AES-256-GCM)' : 'Optional value'}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600 disabled:opacity-60"
                />
              </div>

              {/* Play from here action */}
              <div className="col-span-2 flex items-end justify-end h-full pt-4">
                <button
                  onClick={() => {
                    const idx = suite.commands.findIndex((c) => c.id === selectedCommand.id);
                    if (idx >= 0) handleStartReplay(idx);
                  }}
                  disabled={isRecording || isReplaying}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                >
                  <Play className="w-3 h-3 fill-zinc-300" />
                  Play From Step
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM TERMINAL / EXECUTION LOG PANEL */}
      <div className="h-44 bg-[#070709] border-t border-zinc-800/80 flex flex-col shrink-0">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-950/80 border-b border-zinc-800/60 text-xs">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-mono font-semibold text-zinc-300 text-[11px] uppercase tracking-wider">
              Execution Log
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
              {replayState.logs.length} events
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter buttons */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setLogFilter('all')}
                className={`px-2 py-0.5 rounded ${
                  logFilter === 'all' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setLogFilter('navigation')}
                className={`px-2 py-0.5 rounded ${
                  logFilter === 'navigation'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Navigation
              </button>
              <button
                onClick={() => setLogFilter('error')}
                className={`px-2 py-0.5 rounded ${
                  logFilter === 'error' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Errors
              </button>
            </div>

            <div className="h-3 w-px bg-zinc-800" />

            <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScrollLogs}
                onChange={(e) => setAutoScrollLogs(e.target.checked)}
                className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0"
              />
              Auto-scroll
            </label>
          </div>
        </div>

        {/* Terminal Stream */}
        <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed space-y-1 select-text">
          {filteredLogs.length === 0 ? (
            <div className="text-zinc-600 italic">No execution events recorded yet.</div>
          ) : (
            filteredLogs.map((log, idx) => {
              let color = 'text-zinc-400';
              if (log.type === 'success') color = 'text-emerald-400';
              if (log.type === 'warn') color = 'text-amber-400';
              if (log.type === 'error') color = 'text-rose-400 font-semibold';
              if (log.message.includes('[Navigation]')) color = 'text-cyan-400';

              const timeStr = new Date(log.timestamp).toLocaleTimeString();

              return (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-zinc-600 shrink-0">[{timeStr}]</span>
                  <span className={color}>{log.message}</span>
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* EXPORT MODAL */}
      {showExportModal && (
        <ExportModal suite={suite} onClose={() => setShowExportModal(false)} />
      )}
    </div>
  );
}
